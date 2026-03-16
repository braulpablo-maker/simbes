"""
SIMBES — Módulo Eléctrico (Cable, VSD, Arrhenius, THD)
=======================================================
Fuentes:
  - IEEE 519-2014: Harmonic Control in Electric Power Systems.
  - NACE MR0175 / ISO 15156: Materials for H₂S environments.
  - Arrhenius, S. (1889). Über die Reaktionsgeschwindigkeit bei der Inversion
    von Rohrzucker durch Säuren. Z. Phys. Chem. 4, 226–248.
  - ABB Technical Note 060: Active Front End vs. Active Filter Solutions.
"""

import math
from typing import Optional


# ══════════════════════════════════════════════════════════════════
#  CABLE — CAÍDA DE VOLTAJE
# ══════════════════════════════════════════════════════════════════

# Resistencia base a 20°C por calibre AWG (Ω/1000 ft, conductor de cobre)
# Fuente: tablas estándar Southwire / API RP 11S6
CABLE_RESISTANCE_OHM_PER_1000FT = {
    1:   0.1239,
    2:   0.1563,
    4:   0.2485,
    6:   0.3951,
    8:   0.6282,
    10:  0.9989,
    12:  1.588,
    14:  2.525,
}


def cable_resistance_corrected(
    awg: int,
    length_ft: float,
    T_bottomhole_C: float,
    T_surface_C: float = 20.0,
    alpha_cu: float = 0.00393,  # coeficiente de temperatura del cobre (/°C)
) -> dict:
    """
    Resistencia total del cable corregida por temperatura.

    R_T = R_20 × (1 + α × (T_avg − 20))

    Donde T_avg es la temperatura promedio del cable (gradient lineal asumido).

    Args:
        awg             : calibre del cable (1, 2, 4, 6, 8, 10, 12, 14)
        length_ft       : longitud del cable (ft) — igual a la profundidad del motor
        T_bottomhole_C  : temperatura en el fondo del pozo (°C)
        T_surface_C     : temperatura en superficie (°C), default 20°C
        alpha_cu        : coeficiente de temperatura del cobre (/°C)

    Returns:
        dict con:
          'R_base_ohm'     : resistencia base a 20°C (Ω)
          'R_corrected_ohm': resistencia corregida (Ω)
          'T_avg_C'        : temperatura promedio del cable (°C)

    Ref: API RP 11S6; efecto Joule + gradiente geotérmico.
    """
    if awg not in CABLE_RESISTANCE_OHM_PER_1000FT:
        raise ValueError(f"AWG {awg} no disponible. Opciones: {list(CABLE_RESISTANCE_OHM_PER_1000FT.keys())}")

    r_per_1000ft = CABLE_RESISTANCE_OHM_PER_1000FT[awg]
    R_base = r_per_1000ft * length_ft / 1000.0  # Ω total (un conductor)

    T_avg = (T_bottomhole_C + T_surface_C) / 2.0
    R_T   = R_base * (1.0 + alpha_cu * (T_avg - 20.0))

    return {
        "R_base_ohm":      round(R_base, 4),
        "R_corrected_ohm": round(R_T, 4),
        "T_avg_C":         round(T_avg, 1),
    }


def cable_voltage_drop(
    awg: int,
    length_ft: float,
    I_amps: float,           # corriente del motor (A)
    T_bottomhole_C: float,
    T_surface_C: float = 20.0,
    phases: int = 3,
) -> dict:
    """
    Caída de voltaje total en el cable (todos los conductores).

    V_drop = I × R_T × n_conductores   [V]

    Para cable trifásico: n = 3 conductores (o 2 si es monofásico).
    La caída expresada como % del voltaje nominal de superficie.

    Args:
        awg             : calibre del cable
        length_ft       : longitud del cable (ft)
        I_amps          : corriente de operación del motor (A)
        T_bottomhole_C  : temperatura en fondo (°C)
        T_surface_C     : temperatura en superficie (°C)
        phases          : número de fases (default 3)

    Returns:
        dict con:
          'V_drop_V'       : caída de voltaje total (V)
          'R_corrected_ohm': resistencia corregida por conductor (Ω)
          'warning'        : True si caída > 5% de 1000V nominales

    Ref: API RP 11S6; IEEE 1050.
    """
    cable = cable_resistance_corrected(awg, length_ft, T_bottomhole_C, T_surface_C)
    R_T   = cable["R_corrected_ohm"]

    # Caída total = I × R por conductor × número de conductores
    V_drop = I_amps * R_T * phases

    # Referencia nominal: 1000 V (típico motor BES de mediana tensión)
    # [SIMPLIFIED: voltaje nominal de referencia fijo en 1000V para indicador pedagógico]
    V_nominal_ref = 1000.0
    pct_drop = (V_drop / V_nominal_ref) * 100.0

    return {
        "V_drop_V":          round(V_drop, 1),
        "pct_drop":          round(pct_drop, 2),
        "R_corrected_ohm":   R_T,
        "T_avg_C":           cable["T_avg_C"],
        "warning_5pct":      pct_drop > 5.0,
        "danger_10pct":      pct_drop > 10.0,
    }


# ══════════════════════════════════════════════════════════════════
#  REGLA DE ARRHENIUS — DEGRADACIÓN DE AISLAMIENTO
# ══════════════════════════════════════════════════════════════════

def arrhenius_life_factor(
    T_operating_C: float,
    T_rated_C: float,
) -> dict:
    """
    Calcula el factor de reducción de vida útil del aislamiento eléctrico
    por operación sobre la temperatura nominal (Regla de Arrhenius simplificada).

    τ₂/τ₁ = 2^((T₁ − T₂) / 10)

    "Por cada 10°C sobre el límite nominal, la vida útil del aislamiento
    se reduce a la mitad."

    Args:
        T_operating_C : temperatura de operación real (°C)
        T_rated_C     : temperatura nominal máxima del aislamiento (°C)

    Returns:
        dict con:
          'life_factor'        : factor de vida (< 1.0 si T_op > T_rated)
          'pct_life_remaining' : porcentaje de vida relativa (100% si T_op ≤ T_rated)
          'delta_T_C'          : exceso de temperatura (°C), 0 si dentro del límite
          'warning'            : True si T_op > T_rated

    Ref: Arrhenius (1889); IEEE 117; Regla de los 10°C.
    """
    delta_T = T_operating_C - T_rated_C

    if delta_T <= 0:
        return {
            "life_factor":         1.0,
            "pct_life_remaining":  100.0,
            "delta_T_C":           0.0,
            "warning":             False,
            "message":             "Temperatura dentro del límite nominal.",
        }

    life_factor = 2.0 ** (-delta_T / 10.0)
    pct_remaining = life_factor * 100.0

    return {
        "life_factor":         round(life_factor, 4),
        "pct_life_remaining":  round(pct_remaining, 1),
        "delta_T_C":           round(delta_T, 1),
        "warning":             True,
        "message":             (
            f"Temperatura {delta_T:.1f}°C sobre el límite nominal. "
            f"Vida útil del aislamiento reducida al {pct_remaining:.1f}%. "
            f"({int(round(delta_T/10))} × reducción por factor 2 — Regla Arrhenius)"
        ),
    }


# ══════════════════════════════════════════════════════════════════
#  THD — DISTORSIÓN ARMÓNICA TOTAL
# ══════════════════════════════════════════════════════════════════

# THD típico por topología de VSD (valores representativos de industria)
# Fuente: ABB Technical Note 060; IEEE 519-2014.
VSD_THD_TYPICAL = {
    "standard_6pulse": {"THD_pct": 30.0, "desc": "VSD estándar 6 pulsos"},
    "12pulse":         {"THD_pct": 17.5, "desc": "Multipulso 12 pulsos"},
    "18pulse":         {"THD_pct": 4.0,  "desc": "Multipulso 18 pulsos"},
    "afe":             {"THD_pct": 2.5,  "desc": "Active Front End (IGBT)"},
    "active_filter":   {"THD_pct": 1.5,  "desc": "Filtro Activo dedicado"},
}

IEEE_519_LIMIT_PCT = 5.0  # THDv máximo en PCC (IEEE 519-2014)


def thd_estimate(vsd_topology: str) -> dict:
    """
    Estima el THD (Total Harmonic Distortion) según la topología del VSD.

    Args:
        vsd_topology : clave de topología. Opciones:
                       'standard_6pulse', '12pulse', '18pulse', 'afe', 'active_filter'

    Returns:
        dict con:
          'THD_pct'          : THD estimado (%)
          'complies_ieee519' : True si THD < 5% (IEEE 519-2014)
          'topology_desc'    : descripción de la topología
          'recommendation'   : acción recomendada si no cumple

    Ref: IEEE 519-2014; ABB Technical Note 060.
    [SIMPLIFIED: valores representativos de industria, no mediciones reales]
    """
    if vsd_topology not in VSD_THD_TYPICAL:
        raise ValueError(f"Topología '{vsd_topology}' no reconocida. "
                         f"Opciones: {list(VSD_THD_TYPICAL.keys())}")

    entry   = VSD_THD_TYPICAL[vsd_topology]
    THD     = entry["THD_pct"]
    complies = THD < IEEE_519_LIMIT_PCT

    recommendation = ""
    if not complies:
        if vsd_topology == "standard_6pulse":
            recommendation = "Considerar upgrade a 12 o 18 pulsos, o instalar filtro activo para cumplir IEEE 519."
        elif vsd_topology == "12pulse":
            recommendation = "THD marginal. Evaluar 18 pulsos o AFE para zonas sensibles."

    return {
        "THD_pct":           THD,
        "complies_ieee519":  complies,
        "limit_pct":         IEEE_519_LIMIT_PCT,
        "topology":          vsd_topology,
        "topology_desc":     entry["desc"],
        "recommendation":    recommendation,
    }


# ══════════════════════════════════════════════════════════════════
#  SELECCIÓN DE MATERIALES (NACE MR0175)
# ══════════════════════════════════════════════════════════════════

def material_recommendation(
    T_C: float,         # temperatura de operación (°C)
    H2S_present: bool,  # presencia de H₂S (gas amargo)
    solvent_injection: bool = False,
) -> dict:
    """
    Recomienda materiales para cable y elastómeros según condiciones del pozo.

    Ref: NACE MR0175 / ISO 15156.

    Args:
        T_C               : temperatura de operación (°C)
        H2S_present       : True si hay presencia de H₂S
        solvent_injection : True si se inyectan solventes

    Returns:
        dict con recomendaciones de elastómero, cable y estándar aplicable.
    """
    elastomer = "NBR (Nitrile)"
    cable_jacket = "EPDM estándar"
    standards = []
    warnings = []

    if T_C > 140:
        elastomer = "EPDM o PEEK (NBR NO apto sobre 140°C)"
        cable_jacket = "PEEK o EPDM alta temperatura"
        warnings.append(f"T = {T_C}°C excede límite de NBR (140°C). Cambiar elastómeros.")

    if solvent_injection:
        elastomer = "PEEK (resistencia química a solventes)"
        warnings.append("Inyección de solventes detectada — PEEK mandatorio.")

    if H2S_present:
        cable_jacket = "Lead Sheath (camisa de plomo) sobre las fases"
        standards.append("NACE MR0175 / ISO 15156")
        warnings.append(
            "Presencia de H₂S: riesgo de SSC (Sulfide Stress Cracking) y "
            "descompresión explosiva. Requerido: Lead Sheath + blindaje Monel 400."
        )

    return {
        "elastomer_recommendation": elastomer,
        "cable_jacket":             cable_jacket,
        "applicable_standards":     standards if standards else ["API RP 11S6"],
        "warnings":                 warnings,
        "compliant":                len(warnings) == 0,
    }
