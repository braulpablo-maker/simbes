"""
SIMBES — Módulo IPR (Inflow Performance Relationship)
======================================================
Fuentes:
  - Darcy, H. (1856). Les fontaines publiques de la ville de Dijon.
  - Vogel, J.V. (1968). Inflow performance relationships for solution-gas drive wells.
    JPT Jan 1968, pp. 83–92.
  - Fetkovich, M.J. (1973). The isochronal testing of oil wells.
    SPE 4529.
  - Nodal Analysis — whitson+ User Manual:
    https://manual.whitson.com/modules/well-performance/nodal-analysis/
"""

import math
from typing import Optional
import numpy as np
from scipy.optimize import brentq


# ══════════════════════════════════════════════════════════════════
#  ÍNDICE DE PRODUCTIVIDAD Y AOF
# ══════════════════════════════════════════════════════════════════

def calc_productivity_index(
    k: float,   # permeabilidad efectiva (md)
    h: float,   # espesor del yacimiento (ft)
    mu: float,  # viscosidad del fluido (cp)
    Bo: float,  # factor volumétrico del petróleo (bbl/STB)
    re: float,  # radio de drenaje (ft)
    rw: float,  # radio del pozo (ft)
    skin: float = 0.0,
) -> float:
    """
    Calcula el Índice de Productividad (IP) mediante la ecuación de Darcy
    en régimen pseudo-estacionario, flujo radial.

    Ecuación:
        IP = 0.00708 × k × h / (μ × Bo × (ln(re/rw) − 0.75 + S))

    Args:
        k    : permeabilidad efectiva (md)
        h    : espesor neto del yacimiento (ft)
        mu   : viscosidad del petróleo a condiciones de fondo (cp)
        Bo   : factor volumétrico del petróleo (bbl/STB)
        re   : radio de drenaje (ft)
        rw   : radio del pozo (ft)
        skin : factor de daño de formación (adimensional, default 0)

    Returns:
        IP en STB/d/psi

    Ref: Darcy (1856), ecuación de flujo radial en estado pseudo-estacionario.
    """
    if re <= rw:
        raise ValueError("re debe ser mayor que rw")
    if any(v <= 0 for v in [k, h, mu, Bo, re, rw]):
        raise ValueError("k, h, mu, Bo, re, rw deben ser positivos")

    denominator = mu * Bo * (math.log(re / rw) - 0.75 + skin)
    return 0.00708 * k * h / denominator


def calc_aof(
    Pr: float,   # presión estática del reservorio (psi)
    Pb: float,   # presión de burbuja (psi)
    IP: float,   # índice de productividad (STB/d/psi)
) -> float:
    """
    Calcula el Flujo Abierto Absoluto (AOF): caudal máximo teórico a Pwf = 0.

    Composición Darcy + Vogel:
        Qb   = IP × max(Pr − Pb, 0)          [zona lineal, Pwf ≥ Pb]
        AOF  = Qb + (IP × Pb) / 1.8          [suma zona Vogel]

    Args:
        Pr : presión estática del reservorio (psi)
        Pb : presión de burbuja (psi)
        IP : índice de productividad (STB/d/psi)

    Returns:
        AOF en STB/d

    Ref: Vogel (1968), Standing (1971) — extensión Vogel compuesta.
    """
    if Pr <= 0 or IP <= 0:
        raise ValueError("Pr e IP deben ser positivos")
    Pb = min(Pb, Pr)
    qb = IP * max(Pr - Pb, 0.0)
    return qb + (IP * Pb) / 1.8


def ipr_pwf_to_q(
    Pwf: float,
    Pr: float,
    Pb: float,
    IP: float,
) -> float:
    """
    IPR forward: dado Pwf → Q.

    Régimen:
      - Pwf ≥ Pb → Darcy lineal:  Q = IP × (Pr − Pwf)
      - Pwf <  Pb → Vogel bifásico con transición en Qb

    Args:
        Pwf : presión fluyente de fondo (psi)
        Pr  : presión estática del reservorio (psi)
        Pb  : presión de burbuja (psi)
        IP  : índice de productividad (STB/d/psi)

    Returns:
        Caudal Q en STB/d (≥ 0)

    Ref: Vogel (1968).
    """
    Pb = min(Pb, Pr)
    qb = IP * max(Pr - Pb, 0.0)

    if Pwf >= Pb:
        return max(0.0, IP * (Pr - Pwf))

    q_vogel_max = (IP * Pb) / 1.8
    vogel = 1.0 - 0.2 * (Pwf / Pb) - 0.8 * (Pwf / Pb) ** 2
    return qb + q_vogel_max * max(0.0, vogel)


def ipr_q_to_pwf(
    Q: float,
    Pr: float,
    Pb: float,
    IP: float,
) -> float:
    """
    IPR inversa: dado Q → Pwf.
    Resuelve analíticamente en zona Darcy e invierte la cuadrática de Vogel.

    Args:
        Q   : caudal objetivo (STB/d)
        Pr  : presión estática del reservorio (psi)
        Pb  : presión de burbuja (psi)
        IP  : índice de productividad (STB/d/psi)

    Returns:
        Pwf en psi (≥ 0)

    Ref: Vogel (1968) — inversión cuadrática.
    """
    Pb = min(Pb, Pr)
    qb = IP * max(Pr - Pb, 0.0)

    # Zona Darcy
    if Q <= qb:
        return max(0.0, Pr - Q / IP)

    # Zona Vogel: 0.8x² + 0.2x − (1−f) = 0  donde x = Pwf/Pb
    q_vogel_max = (IP * Pb) / 1.8
    f = min(1.0, (Q - qb) / q_vogel_max)
    discriminant = 0.04 + 3.2 * (1.0 - f)
    if discriminant < 0:
        return 0.0
    x = (-0.2 + math.sqrt(discriminant)) / 1.6
    return max(0.0, x * Pb)


# ══════════════════════════════════════════════════════════════════
#  FETKOVICH (referencia, no usado en M1 del MVP)
# ══════════════════════════════════════════════════════════════════

def fetkovich_q(
    Pr: float,
    Pwf: float,
    C: float,
    n: float = 0.5,
) -> float:
    """
    Ecuación de contrapresión de Fetkovich.

    Q = C × (Pr² − Pwf²)^n

    Args:
        Pr  : presión estática (psi)
        Pwf : presión fluyente de fondo (psi)
        C   : coeficiente de productividad de Fetkovich
        n   : exponente (0.5 para crudos saturados, hasta 1.0 para flujo laminar puro)

    Returns:
        Caudal Q (STB/d)

    Ref: Fetkovich (1973), SPE 4529.
    """
    return C * max(0.0, Pr**2 - Pwf**2) ** n


# ══════════════════════════════════════════════════════════════════
#  PUNTO DE OPERACIÓN (IPR ∩ VLP)
# ══════════════════════════════════════════════════════════════════

def find_operating_point(
    Pr: float,
    Pb: float,
    IP: float,
    vlp_func,  # callable: Q (STB/d) → Pwf_VLP (psi)
    Q_max: Optional[float] = None,
) -> Optional[dict]:
    """
    Encuentra el punto de operación: intersección IPR ∩ VLP.
    Usa scipy.optimize.brentq para robustez numérica.

    Args:
        Pr       : presión estática del reservorio (psi)
        Pb       : presión de burbuja (psi)
        IP       : índice de productividad (STB/d/psi)
        vlp_func : función que recibe Q y devuelve Pwf_VLP (psi)
        Q_max    : límite superior de búsqueda (default: 1.2 × AOF)

    Returns:
        dict con claves 'Q' (STB/d) y 'Pwf' (psi), o None si no hay intersección.
    """
    aof = calc_aof(Pr, Pb, IP)
    if Q_max is None:
        Q_max = aof * 1.2

    def residual(Q):
        return ipr_q_to_pwf(Q, Pr, Pb, IP) - vlp_func(Q)

    try:
        # Verificar que hay cruce de signo en el intervalo
        r0 = residual(0.0)
        r1 = residual(Q_max)
        if r0 * r1 > 0:
            return None  # No hay intersección en el rango

        Q_op = brentq(residual, 0.0, Q_max, xtol=0.1, rtol=1e-6)
        Pwf_op = (ipr_q_to_pwf(Q_op, Pr, Pb, IP) + vlp_func(Q_op)) / 2
        return {"Q": round(Q_op, 1), "Pwf": round(Pwf_op, 1)}

    except ValueError:
        return None


# ══════════════════════════════════════════════════════════════════
#  CURVA IPR COMPLETA (para graficar)
# ══════════════════════════════════════════════════════════════════

def build_ipr_curve(
    Pr: float,
    Pb: float,
    IP: float,
    n_points: int = 150,
) -> dict:
    """
    Genera la curva IPR completa para visualización.

    Returns:
        dict con listas 'Q' (STB/d) y 'Pwf' (psi).
        También incluye 'aof', 'qb', 'IP', 'Pr', 'Pb'.
    """
    aof = calc_aof(Pr, Pb, IP)
    qb  = IP * max(Pr - min(Pb, Pr), 0.0)
    Q_values   = np.linspace(0, aof, n_points)
    Pwf_values = np.array([ipr_q_to_pwf(q, Pr, Pb, IP) for q in Q_values])

    return {
        "Q":   Q_values.tolist(),
        "Pwf": Pwf_values.tolist(),
        "aof": round(aof, 1),
        "qb":  round(qb, 1),
        "IP":  IP,
        "Pr":  Pr,
        "Pb":  Pb,
    }
