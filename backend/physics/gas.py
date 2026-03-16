"""
SIMBES — Módulo Gas y Flujo Multifásico
========================================
Fuentes:
  - Vogel, J.V. (1968). Inflow performance relationships for solution-gas drive wells.
  - Standing, M.B. (1977). Volumetric and Phase Behavior of Oil Field Hydrocarbon Systems.
  - SPE Brazil FATC 2022: Evaluation and simulation of gas-liquid separation in ESP.
  - Hydraulic Institute: Viscosity correction factors for centrifugal pumps.
"""

import math
from typing import Optional


# ══════════════════════════════════════════════════════════════════
#  GVF — GAS VOLUME FRACTION EN SUCCIÓN
# ══════════════════════════════════════════════════════════════════

def gas_volume_fraction(
    GOR_scf_stb: float,      # Gas-Oil Ratio superficial (scf/STB)
    Pb_psi: float,           # Presión de burbuja (psi)
    Ps_psi: float,           # Presión en la succión de la bomba (psi)
    T_F: float = 200.0,      # Temperatura en el fondo (°F)
    Bg_approx: Optional[float] = None,  # Factor volumétrico del gas (ft³/scf)
) -> dict:
    """
    Calcula el Gas Volume Fraction (GVF) en la succión de la bomba BES.

    GVF = Q_gas / (Q_gas + Q_liquid)   [fracción volumétrica, 0–1]

    Para Ps ≥ Pb: todo el gas está disuelto → GVF = 0.
    Para Ps < Pb: el gas libre es proporcional a la fracción de GOR liberado.

    [SIMPLIFIED: asume comportamiento de gas ideal para Bg; para producción
     real usar correlaciones PVT de Standing o Vasquez-Beggs]

    Args:
        GOR_scf_stb  : Gas-Oil Ratio en superficie (scf/STB)
        Pb_psi       : Presión de burbuja (psi)
        Ps_psi       : Presión de succión de la bomba (psi)
        T_F          : Temperatura de fondo (°F)
        Bg_approx    : Factor volumétrico del gas (ft³/scf). Si None, calcula aproximación.

    Returns:
        dict con:
          'GVF'           : Gas Volume Fraction en succión (0–1)
          'GVF_pct'       : GVF expresado en %
          'free_gas_ratio': fracción del GOR total que se libera
          'gas_lock_risk' : 'none' | 'warning' | 'danger'

    Ref: SPE Brazil FATC 2022.
    """
    if Ps_psi >= Pb_psi:
        return {
            "GVF": 0.0,
            "GVF_pct": 0.0,
            "free_gas_ratio": 0.0,
            "gas_lock_risk": "none",
            "message": "Ps ≥ Pb: todo el gas permanece disuelto. Sin gas libre en succión.",
        }

    # Fracción de GOR que se libera (aproximación lineal con presión)
    # Standing (1977): Rs ≈ GOR × (Ps/Pb)  para correlación simplificada
    # [SIMPLIFIED: correlación de Standing simplificada]
    rs_at_suction = GOR_scf_stb * (Ps_psi / Pb_psi)
    free_GOR = max(0.0, GOR_scf_stb - rs_at_suction)  # scf/STB libres

    # Factor volumétrico del gas (ft³/scf) — gas ideal a condiciones de fondo
    if Bg_approx is None:
        T_R = T_F + 459.67          # °F → °R
        z   = 0.9                   # factor de compresibilidad (aproximación)
        # [SIMPLIFIED: z = 0.9 representativo; usar correlación Hall-Yarborough para rigor]
        Bg_approx = 0.02829 * z * T_R / Ps_psi  # ft³/scf

    # Volúmenes en condiciones de fondo
    Qgas_ft3  = free_GOR * Bg_approx  # ft³ gas / STB petróleo
    Qliq_ft3  = 5.615                  # ft³ / STB (1 STB = 5.615 ft³)

    GVF = Qgas_ft3 / (Qgas_ft3 + Qliq_ft3)
    GVF = min(1.0, max(0.0, GVF))

    # Diagnóstico de riesgo de gas lock
    if GVF < 0.10:
        risk = "none"
        msg  = f"GVF = {GVF*100:.1f}%. Operación segura. Sin riesgo de gas lock."
    elif GVF < 0.15:
        risk = "warning"
        msg  = f"GVF = {GVF*100:.1f}%. Aproximándose al umbral de gas lock (15%). Evaluar separador AGS."
    else:
        risk = "danger"
        msg  = (f"GVF = {GVF*100:.1f}% supera el umbral de gas lock (15%). "
                "Alta probabilidad de pérdida de succión. Instalar AGS o reducir drawdown.")

    return {
        "GVF":            round(GVF, 4),
        "GVF_pct":        round(GVF * 100, 2),
        "free_GOR_scf_stb": round(free_GOR, 1),
        "Bg_ft3_scf":     round(Bg_approx, 5),
        "free_gas_ratio": round(free_GOR / GOR_scf_stb, 4) if GOR_scf_stb > 0 else 0.0,
        "gas_lock_risk":  risk,
        "message":        msg,
    }


# ══════════════════════════════════════════════════════════════════
#  DEGRADACIÓN DE CURVA H-Q POR GAS
# ══════════════════════════════════════════════════════════════════

def hq_gas_degradation_factor(GVF: float) -> dict:
    """
    Factor de degradación de la curva H-Q de la bomba por presencia de gas libre.

    Basado en correlaciones empíricas de fabricantes (Schlumberger, Baker Hughes).
    A mayor GVF, la bomba pierde eficiencia hidráulica y la cabeza se reduce.

    [SIMPLIFIED: factor lineal segmentado — para diseño real usar curvas del fabricante]

    Regiones:
      GVF 0–5%   → sin degradación apreciable (factor ≈ 1.0)
      GVF 5–10%  → degradación leve (factor 0.90–1.00)
      GVF 10–15% → degradación moderada (factor 0.70–0.90)
      GVF >15%   → degradación severa / gas lock inminente (factor < 0.70)

    Args:
        GVF : Gas Volume Fraction en succión (0–1)

    Returns:
        dict con:
          'head_factor'  : multiplicador sobre la cabeza H (0–1)
          'flow_factor'  : multiplicador sobre el caudal Q (0–1)
          'eff_factor'   : multiplicador sobre la eficiencia η (0–1)
          'severity'     : 'none' | 'mild' | 'moderate' | 'severe'

    Ref: SPE Brazil FATC 2022; catálogos Baker Hughes / SLB.
    """
    GVF = max(0.0, min(1.0, GVF))

    if GVF <= 0.05:
        head_f = 1.0
        flow_f = 1.0
        eff_f  = 1.0
        sev    = "none"
    elif GVF <= 0.10:
        t      = (GVF - 0.05) / 0.05       # 0→1 en el rango 5–10%
        head_f = 1.0 - 0.10 * t
        flow_f = 1.0 - 0.05 * t
        eff_f  = 1.0 - 0.12 * t
        sev    = "mild"
    elif GVF <= 0.15:
        t      = (GVF - 0.10) / 0.05
        head_f = 0.90 - 0.20 * t
        flow_f = 0.95 - 0.10 * t
        eff_f  = 0.88 - 0.18 * t
        sev    = "moderate"
    else:
        t      = min(1.0, (GVF - 0.15) / 0.10)
        head_f = 0.70 - 0.50 * t
        flow_f = 0.85 - 0.35 * t
        eff_f  = 0.70 - 0.40 * t
        sev    = "severe"

    head_f = max(0.0, head_f)
    flow_f = max(0.0, flow_f)
    eff_f  = max(0.0, eff_f)

    return {
        "head_factor": round(head_f, 3),
        "flow_factor": round(flow_f, 3),
        "eff_factor":  round(eff_f, 3),
        "GVF_pct":     round(GVF * 100, 1),
        "severity":    sev,
    }


# ══════════════════════════════════════════════════════════════════
#  CORRECCIÓN DE VISCOSIDAD (Hydraulic Institute)
# ══════════════════════════════════════════════════════════════════

def viscosity_correction(
    Q_bep_gpm: float,         # Caudal BEP en agua (gpm)
    H_bep_ft: float,          # Cabeza BEP en agua (ft)
    mu_cp: float,             # Viscosidad del fluido real (cp)
    rho_rel: float = 1.0,     # Densidad relativa al agua (adimensional)
) -> dict:
    """
    Corrección de la curva H-Q por viscosidad del fluido.
    Basado en los factores de corrección del Hydraulic Institute.

    Los factores Cq, Ch, Ce reducen el caudal, la cabeza y la eficiencia
    cuando el fluido es más viscoso que el agua.

    [SIMPLIFIED: correlación algebraica de HI simplificada; para μ > 3000 cp
     usar tablas completas del HI o método Stepanoff]

    Args:
        Q_bep_gpm : Caudal en el BEP a condiciones de agua (gpm)
        H_bep_ft  : Cabeza en el BEP a condiciones de agua (ft)
        mu_cp     : Viscosidad cinemática del fluido (cp ≈ cSt para densidad ≈ 1)
        rho_rel   : Densidad relativa al agua (1.0 = agua)

    Returns:
        dict con factores de corrección Cq, Ch, Ce y valores corregidos.

    Ref: Hydraulic Institute ANSI/HI 9.6.7 — Viscosity Effects on Rotodynamic Pumps.
    """
    if mu_cp <= 1.0:
        return {
            "Cq": 1.0, "Ch": 1.0, "Ce": 1.0,
            "Q_corrected_gpm": Q_bep_gpm,
            "H_corrected_ft":  H_bep_ft,
            "note": "Fluido acuoso (μ ≤ 1 cp). Sin corrección necesaria.",
        }

    # Número de viscosidad (parámetro HI)
    # [SIMPLIFIED: factor B = Q^0.5 × H^0.25 / ν^0.5 — HI Chart]
    nu_cSt = mu_cp / rho_rel     # viscosidad cinemática (cSt)
    B = (Q_bep_gpm ** 0.5) * (H_bep_ft ** 0.25) / (nu_cSt ** 0.5)

    # Factores de corrección (interpolación de curvas HI)
    # [SIMPLIFIED: ajuste polinomial de las curvas HI para 10 ≤ B ≤ 1000]
    if B >= 40.0:
        Cq = 1.0
        Ch = 1.0
        Ce = 1.0
    elif B >= 10.0:
        t  = (B - 10.0) / 30.0   # 0→1 en rango 10–40
        Cq = 0.85 + 0.15 * t
        Ch = 0.92 + 0.08 * t
        Ce = 0.60 + 0.40 * t
    else:
        # Fluidos muy viscosos — corrección severa
        Cq = max(0.4, 0.85 * (B / 10.0))
        Ch = max(0.5, 0.92 * (B / 10.0))
        Ce = max(0.2, 0.60 * (B / 10.0))

    return {
        "Cq":              round(Cq, 3),
        "Ch":              round(Ch, 3),
        "Ce":              round(Ce, 3),
        "Q_corrected_gpm": round(Q_bep_gpm * Cq, 1),
        "H_corrected_ft":  round(H_bep_ft  * Ch, 1),
        "viscosity_B":     round(B, 2),
        "mu_cp":           mu_cp,
        "nu_cSt":          round(nu_cSt, 1),
        "note":            (
            f"Corrección HI aplicada para μ = {mu_cp} cp. "
            f"Cq={Cq:.3f} · Ch={Ch:.3f} · Ce={Ce:.3f}."
        ),
    }


# ══════════════════════════════════════════════════════════════════
#  SEPARADORES DE GAS (AGS — Rotary Gas Separator)
# ══════════════════════════════════════════════════════════════════

def gas_separator_efficiency(
    GVF_intake: float,          # GVF en la intake del separador (0–1)
    separator_type: str = "ags_passive",  # tipo de separador
) -> dict:
    """
    Estima la eficiencia de separación de gas y el GVF residual
    en la succión de la bomba después del separador.

    Tipos disponibles:
      - 'none'         : sin separador (GVF_pump = GVF_intake)
      - 'ags_passive'  : Rotary Gas Separator pasivo (eficiencia 50–75%)
      - 'gas_handler'  : Gas Handler activo (eficiencia 75–90%)

    [SIMPLIFIED: eficiencias representativas de industria]

    Args:
        GVF_intake     : GVF en la entrada del sistema (0–1)
        separator_type : tipo de separador instalado

    Returns:
        dict con GVF residual en bomba y eficiencia de separación.

    Ref: SPE Brazil FATC 2022.
    """
    SEPARATORS = {
        "none":        {"name": "Sin separador",            "eff": 0.0},
        "ags_passive": {"name": "AGS Pasivo (Rotary)",      "eff": 0.65},
        "gas_handler": {"name": "Gas Handler Activo",       "eff": 0.82},
    }

    if separator_type not in SEPARATORS:
        raise ValueError(f"Tipo '{separator_type}' no reconocido. "
                         f"Opciones: {list(SEPARATORS.keys())}")

    sep  = SEPARATORS[separator_type]
    eff  = sep["eff"]

    # GVF residual que llega a la bomba
    GVF_pump = GVF_intake * (1.0 - eff)
    GVF_pump = max(0.0, min(1.0, GVF_pump))

    deg = hq_gas_degradation_factor(GVF_pump)

    return {
        "separator_type":    separator_type,
        "separator_name":    sep["name"],
        "separation_eff":    eff,
        "GVF_intake_pct":    round(GVF_intake * 100, 1),
        "GVF_pump_pct":      round(GVF_pump * 100, 1),
        "head_factor":       deg["head_factor"],
        "gas_lock_risk":     "danger" if GVF_pump > 0.15 else ("warning" if GVF_pump > 0.10 else "none"),
        "recommendation":    (
            "Gas lock inminente. Aumentar velocidad del separador o reducir GOR."
            if GVF_pump > 0.15 else
            "Operación marginal. Monitorear vibración y corriente."
            if GVF_pump > 0.10 else
            "Separación efectiva. GVF en bomba dentro de límites seguros."
        ),
    }
