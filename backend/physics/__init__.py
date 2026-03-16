"""
SIMBES — Motor de Simulación BES
Todas las funciones son puras (sin side effects, sin estado global).
Cada función documenta su fuente y las unidades de sus parámetros.
"""
from .ipr import calc_aof, ipr_pwf_to_q, ipr_q_to_pwf
from .hydraulics import total_dynamic_head, friction_head, specific_speed, affinity_laws
from .electrical import cable_voltage_drop, arrhenius_life_factor, thd_estimate
from .reliability import mtbf_mle, survival_prob, mtbf_confidence_interval

__all__ = [
    "calc_aof", "ipr_pwf_to_q", "ipr_q_to_pwf",
    "total_dynamic_head", "friction_head", "specific_speed", "affinity_laws",
    "cable_voltage_drop", "arrhenius_life_factor", "thd_estimate",
    "mtbf_mle", "survival_prob", "mtbf_confidence_interval",
]
