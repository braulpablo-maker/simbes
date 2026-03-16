"""
SIMBES — Módulo Hidráulica de Bomba Centrífuga Multietapa
==========================================================
Fuentes:
  - Darcy-Weisbach (1845/1850).
  - Colebrook, C.F. & White, C.M. (1937). Experiments with fluid friction in roughened pipes.
    Proc. R. Soc. London, Series A, 161, 367–381.
  - Hydraulic Institute (2000). Pump Standards.
  - Leyes de Afinidad / Affinity Laws — estándar ANSI/HI 1.3.
"""

import math
from typing import Optional
import numpy as np
from scipy.optimize import brentq


# ══════════════════════════════════════════════════════════════════
#  FACTOR DE FRICCIÓN — COLEBROOK-WHITE (iterativo)
# ══════════════════════════════════════════════════════════════════

def friction_factor_colebrook(
    Re: float,        # Número de Reynolds (adimensional)
    epsilon_D: float, # Rugosidad relativa ε/D (adimensional)
) -> float:
    """
    Calcula el factor de fricción de Darcy-Weisbach mediante la ecuación
    implícita de Colebrook-White, resuelta numéricamente.

    1/√f = −2·log₁₀(ε/(3.7·D) + 2.51/(Re·√f))

    Args:
        Re        : número de Reynolds (ρvD/μ)
        epsilon_D : rugosidad relativa (ε/D), típico tubing acero: 0.0006

    Returns:
        Factor de fricción f (adimensional)

    Ref: Colebrook & White (1937).
    [SIMPLIFIED: para Re < 2300 usa Hagen-Poiseuille f=64/Re]
    """
    if Re <= 0:
        raise ValueError("Reynolds debe ser positivo")

    if Re < 2300:
        return 64.0 / Re  # Flujo laminar — Hagen-Poiseuille

    if Re < 4000:
        # Zona de transición — usar Churchill (1977) como aproximación continua
        pass  # cae al régimen turbulento de Colebrook

    def colebrook_eq(f):
        if f <= 0:
            return 1e10
        return 1.0 / math.sqrt(f) + 2.0 * math.log10(epsilon_D / 3.7 + 2.51 / (Re * math.sqrt(f)))

    # Estimación inicial con ecuación de Swamee-Jain (explícita)
    f_init = 0.25 / (math.log10(epsilon_D / 3.7 + 5.74 / Re**0.9))**2
    f_init = max(0.001, min(0.1, f_init))

    try:
        f = brentq(colebrook_eq, 1e-4, 0.1, xtol=1e-8)
    except ValueError:
        f = f_init  # fallback a Swamee-Jain si Colebrook falla

    return f


def reynolds_number(
    Q_stbd: float,   # caudal (STB/d)
    D_in: float,     # diámetro interno del tubing (pulgadas)
    rho_lbft3: float = 52.0,   # densidad del fluido (lb/ft³), default agua ~52
    mu_cp: float = 1.0,        # viscosidad (cp)
) -> float:
    """
    Calcula el número de Reynolds para flujo en tubing.

    Re = ρvD/μ    [unidades consistentes]

    Args:
        Q_stbd    : caudal (STB/d)
        D_in      : diámetro interno del tubing (pulgadas)
        rho_lbft3 : densidad del fluido (lb/ft³)
        mu_cp     : viscosidad dinámica (cp)

    Returns:
        Re (adimensional)
    """
    Q_ft3s = Q_stbd * 5.615 / 86400.0   # STB/d → ft³/s
    D_ft   = D_in / 12.0                 # pulgadas → ft
    A_ft2  = math.pi * D_ft**2 / 4.0
    v_fts  = Q_ft3s / A_ft2              # velocidad (ft/s)
    mu_lbfts = mu_cp * 6.72e-4           # cp → lb/(ft·s)
    return rho_lbft3 * v_fts * D_ft / mu_lbfts


# ══════════════════════════════════════════════════════════════════
#  PÉRDIDAS POR FRICCIÓN — DARCY-WEISBACH
# ══════════════════════════════════════════════════════════════════

def friction_head(
    Q_stbd: float,     # caudal (STB/d)
    L_ft: float,       # longitud del tubing (ft)
    D_in: float,       # diámetro interno (pulgadas)
    mu_cp: float = 1.0,
    rho_lbft3: float = 52.0,
    epsilon_in: float = 0.0018,  # rugosidad absoluta ε (pulgadas), default acero
) -> float:
    """
    Pérdidas de fricción en tubing usando Darcy-Weisbach + Colebrook-White.

    hf = f × (L/D) × v²/(2g)   [ft de fluido]
    ΔPf = hf × grad_fluido      [psi]  — convertir externamente

    Args:
        Q_stbd    : caudal (STB/d)
        L_ft      : longitud del tubing (ft)
        D_in      : diámetro interno (pulgadas)
        mu_cp     : viscosidad (cp)
        rho_lbft3 : densidad del fluido (lb/ft³)
        epsilon_in: rugosidad absoluta (pulgadas)

    Returns:
        Pérdida de carga hf en ft de columna de fluido.

    Ref: Darcy-Weisbach; Colebrook-White para factor f.
    """
    if Q_stbd <= 0:
        return 0.0

    D_ft      = D_in / 12.0
    epsilon_D = epsilon_in / D_in
    Re        = reynolds_number(Q_stbd, D_in, rho_lbft3, mu_cp)
    f         = friction_factor_colebrook(Re, epsilon_D)

    Q_ft3s = Q_stbd * 5.615 / 86400.0
    A_ft2  = math.pi * D_ft**2 / 4.0
    v_fts  = Q_ft3s / A_ft2
    g_fts2 = 32.174

    hf = f * (L_ft / D_ft) * (v_fts**2) / (2.0 * g_fts2)
    return hf


# ══════════════════════════════════════════════════════════════════
#  TDH — TOTAL DYNAMIC HEAD
# ══════════════════════════════════════════════════════════════════

def total_dynamic_head(
    Q_stbd: float,       # caudal de operación (STB/d)
    depth_ft: float,     # profundidad de la bomba (ft)
    Pwh_psi: float,      # presión de cabezal (psi)
    Pwf_psi: float,      # presión fluyente de fondo (psi) en el punto de operación
    grad_psi_ft: float,  # gradiente del fluido (psi/ft), típico 0.35–0.45
    D_in: float = 2.992, # diámetro interno del tubing (pulgadas), default 2-7/8"
    mu_cp: float = 1.0,
    rho_lbft3: float = 52.0,
    include_friction: bool = True,
) -> dict:
    """
    Calcula el TDH (Total Dynamic Head) de la bomba.

    TDH = H_neta_estática + H_fricción + H_contrapresión

    Donde:
      H_neta_estática = profundidad − Pwf/grad    [ft de fluido neto]
      H_contrapresión = Pwh / grad                [ft de columna]
      H_fricción      = Darcy-Weisbach (ver friction_head)

    Args:
        Q_stbd       : caudal (STB/d)
        depth_ft     : profundidad de la bomba (ft)
        Pwh_psi      : presión en cabezal (psi)
        Pwf_psi      : presión fluyente de fondo en el punto de operación (psi)
        grad_psi_ft  : gradiente promedio del fluido (psi/ft)
        D_in         : diámetro interno del tubing (pulgadas)
        mu_cp        : viscosidad del fluido (cp)
        rho_lbft3    : densidad del fluido (lb/ft³)
        include_friction : si True, incluye pérdidas por fricción

    Returns:
        dict con:
          'TDH_ft'          : TDH total en ft
          'H_static_ft'     : altura estática neta (ft)
          'H_friction_ft'   : pérdidas por fricción (ft)
          'H_backpressure_ft': contrapresión en cabezal (ft)

    Ref: Hydraulic Institute; Darcy-Weisbach.
    """
    # Altura neta estática: columna de fluido que la bomba debe levantar
    H_static = depth_ft - (Pwf_psi / grad_psi_ft)

    # Contrapresión en cabezal
    H_backpressure = Pwh_psi / grad_psi_ft

    # Fricción en tubing desde bomba hasta superficie
    H_friction = 0.0
    if include_friction and Q_stbd > 0:
        H_friction = friction_head(Q_stbd, depth_ft, D_in, mu_cp, rho_lbft3)

    TDH = H_static + H_friction + H_backpressure

    return {
        "TDH_ft":              round(TDH, 1),
        "H_static_ft":         round(H_static, 1),
        "H_friction_ft":       round(H_friction, 1),
        "H_backpressure_ft":   round(H_backpressure, 1),
    }


# ══════════════════════════════════════════════════════════════════
#  VELOCIDAD ESPECÍFICA (Ns)
# ══════════════════════════════════════════════════════════════════

def specific_speed(
    N_rpm: float,    # velocidad de rotación (rpm)
    Q_gpm: float,    # caudal en el BEP (gpm)
    H_ft: float,     # altura por etapa en el BEP (ft)
) -> float:
    """
    Velocidad específica en unidades US (convención de la industria BES).

    Ns = N × Q^0.5 / H^0.75

    Clasificación:
      Ns < 1500  → impulsor radial
      1500–4500  → flujo mixto (mayoría de BES modernos)
      Ns > 4500  → flujo axial

    Args:
        N_rpm : velocidad de rotación (rpm)
        Q_gpm : caudal en el BEP (gpm) — NOT STB/d
        H_ft  : altura hidráulica por etapa en el BEP (ft)

    Returns:
        Ns (adimensional, unidades US)

    Ref: Hydraulic Institute ANSI/HI 1.3.
    """
    if H_ft <= 0 or Q_gpm <= 0:
        raise ValueError("Q_gpm y H_ft deben ser positivos")
    return N_rpm * math.sqrt(Q_gpm) / H_ft**0.75


def impeller_type(Ns: float) -> str:
    """Clasifica el tipo de impulsor según Ns (unidades US)."""
    if Ns < 1500:
        return "Radial (< 1500)"
    elif Ns <= 4500:
        return "Flujo Mixto (1500–4500) — ideal para BES"
    else:
        return "Axial (> 4500)"


# ══════════════════════════════════════════════════════════════════
#  LEYES DE AFINIDAD (VSD — variación de frecuencia)
# ══════════════════════════════════════════════════════════════════

def affinity_laws(
    Q1: float,   # caudal a frecuencia f1 (STB/d o cualquier unidad de Q)
    H1: float,   # altura a frecuencia f1 (ft o cualquier unidad de H)
    P1: float,   # potencia a frecuencia f1 (HP o cualquier unidad de P)
    f1: float,   # frecuencia de referencia (Hz)
    f2: float,   # frecuencia objetivo (Hz)
) -> dict:
    """
    Aplica las Leyes de Afinidad para variación de frecuencia en VSD.

    Q2/Q1 = f2/f1
    H2/H1 = (f2/f1)²
    P2/P1 = (f2/f1)³

    Args:
        Q1, H1, P1 : valores a frecuencia de referencia f1
        f1, f2     : frecuencias (Hz)

    Returns:
        dict con Q2, H2, P2 escalados a frecuencia f2.

    Ref: ANSI/HI 1.3 Affinity Laws.
    """
    ratio = f2 / f1
    return {
        "Q2": round(Q1 * ratio, 2),
        "H2": round(H1 * ratio**2, 2),
        "P2": round(P1 * ratio**3, 2),
        "ratio": round(ratio, 4),
    }


# ══════════════════════════════════════════════════════════════════
#  CURVA H-Q DE BOMBA (representativa genérica)
# ══════════════════════════════════════════════════════════════════

def pump_head_ft(
    Q_stbd: float,
    freq_hz: float,
    H0_ft: float = 8500.0,    # altura máxima a Q=0, frecuencia nominal (ft)
    Q_max_stbd: float = 4200.0, # caudal máximo a H=0, frecuencia nominal (STB/d)
    exp: float = 1.85,
) -> float:
    """
    Curva H-Q representativa de bomba centrífuga multietapa BES.
    Aplica Leyes de Afinidad para escalar con frecuencia.

    H(Q, f) = H0 × (1 − (Q_ref/Q_max)^exp) × (f/f0)²
    Q_ref   = Q / (f/f0)   [escala Q a frecuencia de referencia]

    NOTA: Curva GENÉRICA representativa. No corresponde a ningún fabricante
    específico. Para diseño real, usar curvas certificadas del fabricante.

    Args:
        Q_stbd     : caudal de operación (STB/d)
        freq_hz    : frecuencia del VSD (Hz)
        H0_ft      : cabeza máxima a Q=0 y 60 Hz (ft)
        Q_max_stbd : caudal a H=0 y 60 Hz (STB/d)
        exp        : exponente de la curva (1.85 típico para flujo mixto)

    Returns:
        Altura hidráulica en ft.

    [SIMPLIFIED: curva de potencia genérica, no curva real de fabricante]
    """
    f0 = 60.0
    ratio = freq_hz / f0
    Q_ref = Q_stbd / ratio if ratio > 0 else 0.0
    H_ref = H0_ft * max(0.0, 1.0 - (Q_ref / Q_max_stbd) ** exp)
    return H_ref * ratio**2


def pump_bep(
    freq_hz: float,
    BEP_Q_60hz: float = 2100.0,  # BEP a 60 Hz (STB/d)
) -> dict:
    """
    Punto de Mejor Eficiencia (BEP) escalado a frecuencia dada.

    Args:
        freq_hz      : frecuencia del VSD (Hz)
        BEP_Q_60hz   : caudal BEP a 60 Hz (STB/d)

    Returns:
        dict con 'Q_bep' (STB/d) y 'freq' (Hz).

    [SIMPLIFIED: BEP estimado linealmente con frecuencia]
    """
    ratio = freq_hz / 60.0
    return {
        "Q_bep": round(BEP_Q_60hz * ratio, 1),
        "freq":  freq_hz,
    }


# ══════════════════════════════════════════════════════════════════
#  NÚMERO DE ETAPAS REQUERIDAS
# ══════════════════════════════════════════════════════════════════

def required_stages(
    TDH_ft: float,
    head_per_stage_ft: float,
) -> int:
    """
    Calcula el número de etapas de la bomba requeridas.

    N_etapas = ceil(TDH / H_etapa)

    Args:
        TDH_ft             : TDH total requerido (ft)
        head_per_stage_ft  : altura por etapa en el BEP (ft)

    Returns:
        Número de etapas (entero, redondeado hacia arriba).
    """
    if head_per_stage_ft <= 0:
        raise ValueError("head_per_stage_ft debe ser positivo")
    return math.ceil(TDH_ft / head_per_stage_ft)


# ══════════════════════════════════════════════════════════════════
#  API MÓDULO 2 — funciones en unidades SI (m³/d, m, kg/L)
#  Mirrors de physics/hydraulics.js para uso en notebooks
# ══════════════════════════════════════════════════════════════════

STB_TO_M3 = 0.158987   # 1 STB = 0.158987 m³
FT_TO_M   = 0.3048     # 1 ft  = 0.3048 m
PSI_PER_FT = 0.4335    # psi/ft para agua

_EPS_STEEL_M = 4.6e-5  # Rugosidad acero comercial (m)


def colebrook_white(Re: float, D_m: float, eps: float = _EPS_STEEL_M) -> float:
    """
    Factor de fricción Colebrook-White (turbulento) o Hagen-Poiseuille (laminar).

    Args:
        Re  : Número de Reynolds
        D_m : Diámetro interno (m)
        eps : Rugosidad absoluta (m)

    Returns:
        Factor de fricción de Darcy (adimensional)
    """
    if Re <= 0:
        return 0.02
    if Re < 2300:
        return 64.0 / Re
    eD = eps / D_m
    # Swamee-Jain como arranque
    f = 0.25 / (math.log10(eD / 3.7 + 5.74 / Re**0.9))**2

    def eq(f_):
        return 1.0 / math.sqrt(f_) + 2.0 * math.log10(eD / 3.7 + 2.51 / (Re * math.sqrt(f_)))

    try:
        f = brentq(eq, 1e-5, 0.1, xtol=1e-9)
    except ValueError:
        pass
    return f


def flow_regime(Re: float) -> str:
    """Clasifica el régimen de flujo según Re."""
    if Re < 2300:
        return 'laminar'
    if Re < 4000:
        return 'transición'
    return 'turbulento'


def reynolds_number_si(Q_m3d: float, D_in: float, rho_kgL: float, mu_cP: float) -> float:
    """
    Número de Reynolds en unidades SI.

    Args:
        Q_m3d   : Caudal (m³/d)
        D_in    : Diámetro interno (pulgadas)
        rho_kgL : Densidad (kg/L)
        mu_cP   : Viscosidad (cP)

    Returns:
        Re (adimensional)
    """
    D_m   = D_in * 0.0254
    A_m2  = math.pi * D_m**2 / 4
    Q_m3s = Q_m3d / 86400
    v_ms  = Q_m3s / A_m2 if A_m2 > 0 else 0
    rho   = rho_kgL * 1000      # kg/m³
    mu    = mu_cP * 0.001       # Pa·s
    return (rho * v_ms * D_m) / mu if mu > 0 else 0


def tdh_components(
    Q_m3d: float,
    depth_m: float,
    Pwh_psi: float,
    D_in: float,
    mu_cP: float,
    rho_kgL: float,
) -> dict:
    """
    TDH y sus tres componentes en METROS.

    TDH = H_estático + H_fricción (Darcy-Weisbach + Colebrook-White) + H_contrapresión

    Returns:
        dict con H_static_m, H_friction_m, H_back_m, TDH_m, Re, f, v_ms, regime
    """
    D_m   = D_in * 0.0254
    A_m2  = math.pi * D_m**2 / 4
    Q_m3s = Q_m3d / 86400
    v_ms  = Q_m3s / A_m2 if Q_m3d > 0 else 0
    Re    = reynolds_number_si(Q_m3d, D_in, rho_kgL, mu_cP)
    f     = colebrook_white(Re, D_m)

    H_friction_m = f * (depth_m / D_m) * v_ms**2 / (2 * 9.81)
    H_static_m   = depth_m
    grad_psi_ft  = rho_kgL * PSI_PER_FT
    H_back_m     = (Pwh_psi / grad_psi_ft) * FT_TO_M
    TDH_m        = H_static_m + H_friction_m + H_back_m

    return {
        'H_static_m':   round(H_static_m,   2),
        'H_friction_m': round(H_friction_m,  2),
        'H_back_m':     round(H_back_m,      2),
        'TDH_m':        round(TDH_m,         2),
        'Re':           round(Re,            0),
        'f':            round(f,             6),
        'v_ms':         round(v_ms,          4),
        'regime':       flow_regime(Re),
    }


def pump_head_total_m(
    Q_m3d: float,
    freq_hz: float,
    N_stages: int,
    H0_stage_ft: float,
    Qmax_stbd: float = 4200,
) -> float:
    """
    Cabeza total bomba multietapa en METROS.

    H_total(Q) = H0_stage × N × (1−(Q_ref/Qmax)^1.85) × (f/60)²  [en ft]
    → convertido a metros.
    """
    Q_stbd = Q_m3d / STB_TO_M3
    ratio  = freq_hz / 60
    Q_ref  = Q_stbd / ratio if ratio > 0 else 0
    H_ref  = H0_stage_ft * max(0, 1 - (Q_ref / Qmax_stbd)**1.85)
    return H_ref * ratio**2 * N_stages * FT_TO_M


def compute_required_stages(
    depth_m: float,
    Pwh_psi: float,
    D_in: float,
    mu_cP: float,
    rho_kgL: float,
    freq_hz: float,
    H0_stage_ft: float,
) -> int:
    """
    Número de etapas requerido para operar en el BEP.

    N_stages = ceil(TDH_en_BEP / H_por_etapa_en_BEP)
    """
    Q_bep_m3d = 2100 * (freq_hz / 60) * STB_TO_M3
    comps     = tdh_components(Q_bep_m3d, depth_m, Pwh_psi, D_in, mu_cP, rho_kgL)
    ratio     = freq_hz / 60
    # 0.5^1.85 ≈ 0.2774 → factor BEP ≈ 0.7226
    H_stage_bep_m = H0_stage_ft * FT_TO_M * (1 - 0.5**1.85) * ratio**2
    if H_stage_bep_m <= 0:
        return 200
    return max(1, math.ceil(comps['TDH_m'] / H_stage_bep_m))


def find_hydraulic_op_point(
    depth_m: float,
    Pwh_psi: float,
    D_in: float,
    mu_cP: float,
    rho_kgL: float,
    freq_hz: float,
    N_stages: int,
    H0_stage_ft: float,
) -> Optional[dict]:
    """
    Punto de operación: intersección curva de sistema vs. H-Q bomba.
    Bisección numérica en 2000 puntos.

    Returns:
        {'Q_m3d': float, 'TDH_m': float} o None si no hay intersección.
    """
    Qmax_m3d = 4200 * (freq_hz / 60) * STB_TO_M3 * 1.05
    steps    = 2000
    prev_diff, prev_Q = None, None

    for i in range(steps + 1):
        Q    = (Qmax_m3d * i) / steps
        H_p  = pump_head_total_m(Q, freq_hz, N_stages, H0_stage_ft)
        tdh  = tdh_components(Q, depth_m, Pwh_psi, D_in, mu_cP, rho_kgL)['TDH_m']
        diff = H_p - tdh

        if prev_diff is not None and prev_diff * diff < 0:
            t    = prev_diff / (prev_diff - diff)
            Q_op = prev_Q + t * (Q - prev_Q)
            TDH_op = tdh_components(Q_op, depth_m, Pwh_psi, D_in, mu_cP, rho_kgL)['TDH_m']
            return {'Q_m3d': round(Q_op, 1), 'TDH_m': round(TDH_op, 1)}

        prev_diff, prev_Q = diff, Q
    return None


def pump_specific_speed(H0_stage_ft: float) -> dict:
    """
    Velocidad específica de la bomba genérica SIMBES.
    Calculada a condiciones de referencia (60 Hz, BEP Q=2100 STBd).

    Ns = RPM × √(Q_gpm_bep) / H_bep_stage^0.75

    Returns:
        {'Ns': int, 'type': str}
    """
    RPM_60       = 3600
    Q_bep_60_gpm = 2100 * 0.029166  # ≈ 61.25 GPM
    H_bep_60     = H0_stage_ft * (1 - 0.5**1.85)  # ft/etapa en BEP
    if H_bep_60 <= 0:
        return {'Ns': 0, 'type': 'N/A'}
    Ns = RPM_60 * math.sqrt(Q_bep_60_gpm) / H_bep_60**0.75
    Ns = round(Ns)
    return {'Ns': Ns, 'type': impeller_type(Ns)}
