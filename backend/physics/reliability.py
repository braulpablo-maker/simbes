"""
SIMBES — Módulo de Confiabilidad y MTBF
=========================================
Fuentes:
  - Nelson, W.B. (1982). Applied Life Data Analysis. Wiley.
  - Meeker, W.Q. & Escobar, L.A. (1998). Statistical Methods for Reliability Data. Wiley.
  - API RP 11S1: Recommended Practice for Electrical Submersible Pump Teardown Report.
  - lifelines library: https://lifelines.readthedocs.io
"""

import math
from typing import Optional
from scipy.stats import chi2
import numpy as np


# ══════════════════════════════════════════════════════════════════
#  MTBF — ESTIMACIÓN CON DATOS CENSURADOS
# ══════════════════════════════════════════════════════════════════

def mtbf_mle(
    failure_times: list[float],    # tiempos de falla (días)
    censored_times: list[float],   # tiempos de equipos aún operativos (días) — "censurados"
) -> dict:
    """
    Estima el MTBF usando Máxima Verosimilitud (MLE) con datos censurados.
    Asume distribución exponencial (tasa de falla constante — "período de vida útil").

    Para distribución exponencial:
        MTBF_MLE = T_total / r
        donde T_total = Σ t_fallas + Σ t_censurados
              r = número de fallas

    IMPORTANTE: Ignorar los equipos censurados (aún operativos) produce
    "Sesgo de Sobrevivencia Inverso" — subestima el MTBF real.

    Args:
        failure_times  : lista de tiempos hasta la falla (días). Puede ser vacía.
        censored_times : lista de tiempos de equipos aún en operación (días).

    Returns:
        dict con:
          'MTBF_days'          : MTBF estimado (días)
          'r_failures'         : número de fallas
          'n_total'            : total de equipos (fallados + censurados)
          'T_total_days'       : tiempo acumulado total (días)
          'lambda_per_day'     : tasa de falla (1/días)
          'censoring_fraction' : fracción de equipos censurados (0–1)
          'bias_warning'       : True si < 20% han fallado (sesgo potencial)

    Ref: Nelson (1982); Meeker & Escobar (1998).
    """
    r = len(failure_times)
    T_failures  = sum(failure_times)
    T_censored  = sum(censored_times)
    T_total     = T_failures + T_censored
    n_total     = r + len(censored_times)

    if T_total <= 0:
        raise ValueError("El tiempo total acumulado debe ser positivo.")
    if r == 0:
        return {
            "MTBF_days":          float("inf"),
            "r_failures":         0,
            "n_total":            n_total,
            "T_total_days":       round(T_total, 1),
            "lambda_per_day":     0.0,
            "censoring_fraction": 1.0,
            "bias_warning":       True,
            "message":            "Sin fallas registradas. MTBF no estimable con MLE. Aumentar período de observación.",
        }

    MTBF    = T_total / r
    lam     = 1.0 / MTBF
    cens_frac = len(censored_times) / n_total if n_total > 0 else 0.0
    bias_warn = (r / n_total) < 0.20 if n_total > 0 else True

    return {
        "MTBF_days":          round(MTBF, 1),
        "r_failures":         r,
        "n_total":            n_total,
        "T_total_days":       round(T_total, 1),
        "lambda_per_day":     round(lam, 6),
        "censoring_fraction": round(cens_frac, 3),
        "bias_warning":       bias_warn,
        "message":            (
            f"MTBF estimado = {MTBF:.0f} días con {r} fallas de {n_total} equipos. "
            + ("⚠ Posible sesgo: < 20% han fallado. Usar intervalos de confianza." if bias_warn else "")
        ),
    }


# ══════════════════════════════════════════════════════════════════
#  PROBABILIDAD DE SUPERVIVENCIA
# ══════════════════════════════════════════════════════════════════

def survival_prob(
    t_days: float,
    MTBF_days: float,
) -> float:
    """
    Probabilidad de supervivencia bajo distribución exponencial.

    R(t) = e^(−t / MTBF) = e^(−λt)

    Resultado fundamental: R(MTBF) = e⁻¹ ≈ 0.3679 (36.77%)
    → Solo el 36.77% de los equipos alcanza su MTBF nominal.

    Args:
        t_days    : tiempo de evaluación (días)
        MTBF_days : MTBF estimado (días)

    Returns:
        Probabilidad de supervivencia R(t) ∈ [0, 1]

    Ref: Nelson (1982).
    """
    if MTBF_days <= 0:
        raise ValueError("MTBF_days debe ser positivo")
    return math.exp(-t_days / MTBF_days)


def survival_curve(
    MTBF_days: float,
    t_max_days: Optional[float] = None,
    n_points: int = 200,
) -> dict:
    """
    Genera la curva de supervivencia completa para visualización.

    Args:
        MTBF_days  : MTBF estimado (días)
        t_max_days : tiempo máximo del eje (default: 2 × MTBF)
        n_points   : número de puntos en la curva

    Returns:
        dict con listas 't' (días) y 'R' (probabilidad de supervivencia).
        También incluye el punto R(MTBF) = 0.3679.
    """
    if t_max_days is None:
        t_max_days = 2.0 * MTBF_days

    t_values = np.linspace(0, t_max_days, n_points)
    R_values = np.exp(-t_values / MTBF_days)

    return {
        "t":           t_values.tolist(),
        "R":           R_values.tolist(),
        "MTBF_days":   MTBF_days,
        "R_at_MTBF":   round(math.exp(-1), 4),   # 0.3679
        "t_90pct":     round(-MTBF_days * math.log(0.90), 1),  # t donde R=90%
        "t_50pct":     round(-MTBF_days * math.log(0.50), 1),  # t donde R=50%
        "t_10pct":     round(-MTBF_days * math.log(0.10), 1),  # t donde R=10%
    }


# ══════════════════════════════════════════════════════════════════
#  INTERVALOS DE CONFIANZA — CHI-CUADRADO
# ══════════════════════════════════════════════════════════════════

def mtbf_confidence_interval(
    T_total_days: float,  # tiempo total acumulado (días)
    r_failures: int,      # número de fallas observadas
    confidence: float = 0.90,  # nivel de confianza (0–1), default 90%
) -> dict:
    """
    Intervalos de confianza asimétricos para MTBF (distribución exponencial)
    usando la distribución Chi-cuadrado.

    MTBF_lower = 2T / χ²(1−α/2, 2r+2)
    MTBF_upper = 2T / χ²(α/2,   2r)

    Para r = 0 (sin fallas): límite superior es infinito.

    Args:
        T_total_days : tiempo acumulado total incluyendo censurados (días)
        r_failures   : número de fallas observadas
        confidence   : nivel de confianza (ej. 0.90 para 90%)

    Returns:
        dict con:
          'MTBF_lower'    : límite inferior del IC (días)
          'MTBF_upper'    : límite superior del IC (días)
          'MTBF_mle'      : MTBF puntual MLE (días)
          'confidence_pct': nivel de confianza en %

    Ref: Meeker & Escobar (1998), Cap. 7.
    """
    if T_total_days <= 0:
        raise ValueError("T_total_days debe ser positivo")
    if r_failures < 0:
        raise ValueError("r_failures no puede ser negativo")

    alpha = 1.0 - confidence

    # Límite inferior: χ²(1−α/2, 2r+2)
    chi2_upper = chi2.ppf(1 - alpha / 2, df=2 * r_failures + 2)
    MTBF_lower = (2.0 * T_total_days) / chi2_upper

    # Límite superior: χ²(α/2, 2r)
    if r_failures == 0:
        MTBF_upper = float("inf")
    else:
        chi2_lower = chi2.ppf(alpha / 2, df=2 * r_failures)
        MTBF_upper = (2.0 * T_total_days) / chi2_lower if chi2_lower > 0 else float("inf")

    MTBF_mle = T_total_days / r_failures if r_failures > 0 else float("inf")

    return {
        "MTBF_lower":     round(MTBF_lower, 1),
        "MTBF_upper":     round(MTBF_upper, 1) if MTBF_upper != float("inf") else "∞",
        "MTBF_mle":       round(MTBF_mle, 1)   if MTBF_mle   != float("inf") else "∞",
        "confidence_pct": round(confidence * 100, 0),
        "r_failures":     r_failures,
        "T_total_days":   T_total_days,
        "interpretation": (
            f"Con {confidence*100:.0f}% de confianza, el MTBF real está entre "
            f"{MTBF_lower:.0f} y "
            f"{'∞' if MTBF_upper == float('inf') else f'{MTBF_upper:.0f}'} días."
        ),
    }


# ══════════════════════════════════════════════════════════════════
#  DETECCIÓN DE SESGO DE SOBREVIVENCIA
# ══════════════════════════════════════════════════════════════════

def survival_bias_check(
    r_failures: int,
    n_total: int,
) -> dict:
    """
    Evalúa si el análisis tiene riesgo de sesgo de sobrevivencia inverso.

    Si < 20% de la población ha fallado, los datos censurados dominan
    y el MTBF estimado puede estar significativamente sesgado.

    Args:
        r_failures : número de fallas observadas
        n_total    : total de equipos en el estudio

    Returns:
        dict con evaluación del sesgo y recomendaciones.
    """
    if n_total == 0:
        return {"error": "n_total debe ser mayor que 0"}

    failure_rate_pct = (r_failures / n_total) * 100.0

    if failure_rate_pct < 5.0:
        level = "ALTO"
        msg   = "Muy pocas fallas. El MTBF está altamente sobreestimado. Extender el período de observación."
    elif failure_rate_pct < 20.0:
        level = "MODERADO"
        msg   = "Menos del 20% han fallado. Usar intervalos de confianza amplios. Reportar límite inferior."
    elif failure_rate_pct < 50.0:
        level = "BAJO"
        msg   = "Datos razonables para estimación. Los IC son manejables."
    else:
        level = "MÍNIMO"
        msg   = "Mayoría de equipos con falla registrada. Estimación robusta."

    return {
        "failure_rate_pct":  round(failure_rate_pct, 1),
        "bias_level":        level,
        "r_failures":        r_failures,
        "n_total":           n_total,
        "recommendation":    msg,
    }
