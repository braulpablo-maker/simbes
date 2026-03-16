"""
SIMBES — Tests del Motor de Simulación
========================================
Ejecutar: cd backend && pytest tests/ -v
"""
import math
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from physics.ipr import calc_aof, ipr_pwf_to_q, ipr_q_to_pwf, find_operating_point
from physics.hydraulics import (
    friction_factor_colebrook, friction_head, affinity_laws,
    specific_speed, impeller_type, pump_head_ft, pump_bep
)
from physics.electrical import (
    cable_resistance_corrected, cable_voltage_drop,
    arrhenius_life_factor, thd_estimate
)
from physics.reliability import (
    mtbf_mle, survival_prob, mtbf_confidence_interval
)


# ══════════════════════════════════════════════════════════════════
#  IPR TESTS
# ══════════════════════════════════════════════════════════════════

class TestIPR:

    def test_aof_above_bubble_point(self):
        """Si Pr > Pb, AOF incluye zona Darcy + zona Vogel."""
        aof = calc_aof(Pr=3500, Pb=1800, IP=1.5)
        qb  = 1.5 * (3500 - 1800)  # 2550 STB/d zona Darcy
        qv  = (1.5 * 1800) / 1.8   # 1500 STB/d zona Vogel
        assert abs(aof - (qb + qv)) < 0.1

    def test_aof_below_bubble_point_pr_equals_pb(self):
        """Si Pr == Pb, toda la producción es Vogel."""
        aof = calc_aof(Pr=2000, Pb=2000, IP=2.0)
        expected = (2.0 * 2000) / 1.8
        assert abs(aof - expected) < 0.1

    def test_darcy_linear_region(self):
        """En zona Darcy (Pwf > Pb), relación debe ser lineal."""
        Pr, Pb, IP = 3000, 1500, 2.0
        Q1 = ipr_pwf_to_q(2500, Pr, Pb, IP)
        Q2 = ipr_pwf_to_q(2000, Pr, Pb, IP)
        Q3 = ipr_pwf_to_q(1600, Pr, Pb, IP)
        # Incrementos deben ser iguales (lineal)
        assert abs((Q2 - Q1) - (Q3 - Q2)) < 0.5

    def test_ipr_inverse_roundtrip(self):
        """ipr_pwf_to_q e ipr_q_to_pwf deben ser inversas."""
        Pr, Pb, IP = 3500, 1800, 1.5
        for Pwf_orig in [3000, 2200, 1500, 800, 200]:
            Q       = ipr_pwf_to_q(Pwf_orig, Pr, Pb, IP)
            Pwf_rec = ipr_q_to_pwf(Q, Pr, Pb, IP)
            assert abs(Pwf_orig - Pwf_rec) < 2.0, f"Roundtrip falló para Pwf={Pwf_orig}"

    def test_ipr_q_zero_at_pr(self):
        """A Pwf = Pr, Q debe ser 0."""
        Q = ipr_pwf_to_q(3500, 3500, 1800, 1.5)
        assert Q == 0.0

    def test_ipr_vogel_max_at_pwf_zero(self):
        """A Pwf = 0, Q debe ser AOF."""
        Pr, Pb, IP = 3500, 1800, 1.5
        Q_at_zero = ipr_pwf_to_q(0, Pr, Pb, IP)
        aof       = calc_aof(Pr, Pb, IP)
        assert abs(Q_at_zero - aof) < 5.0


# ══════════════════════════════════════════════════════════════════
#  HYDRAULICS TESTS
# ══════════════════════════════════════════════════════════════════

class TestHydraulics:

    def test_colebrook_turbulent(self):
        """Factor de fricción debe estar en rango físico para flujo turbulento."""
        f = friction_factor_colebrook(Re=100000, epsilon_D=0.0006)
        assert 0.008 < f < 0.05

    def test_colebrook_laminar(self):
        """Para flujo laminar (Re < 2300), f = 64/Re."""
        Re = 1000
        f  = friction_factor_colebrook(Re=Re, epsilon_D=0.001)
        assert abs(f - 64.0 / Re) < 0.001

    def test_affinity_laws_flow(self):
        """Q escala linealmente con frecuencia."""
        result = affinity_laws(2100, 5000, 100, 60, 50)
        expected_Q = 2100 * (50/60)
        assert abs(result["Q2"] - expected_Q) < 0.1

    def test_affinity_laws_head(self):
        """Altura escala con el cuadrado de la frecuencia."""
        result = affinity_laws(2100, 5000, 100, 60, 50)
        expected_H = 5000 * (50/60)**2
        assert abs(result["H2"] - expected_H) < 0.5

    def test_specific_speed_classification(self):
        """Velocidad específica debe clasificar correctamente."""
        Ns_radial = specific_speed(3500, 500, 80)    # bajo → radial
        Ns_mixed  = specific_speed(3500, 2000, 60)   # medio → mixto
        assert impeller_type(Ns_radial) == "Radial (< 1500)"
        assert "Mixto" in impeller_type(Ns_mixed)

    def test_pump_affinity_head_scaling(self):
        """Cabeza de bomba a 50 Hz debe ser ≈ (50/60)² × cabeza a 60 Hz."""
        H_60 = pump_head_ft(2000, 60)
        H_50 = pump_head_ft(2000 * 50/60, 50)  # Q también escala
        ratio = H_50 / H_60
        assert abs(ratio - (50/60)**2) < 0.05

    def test_bep_scales_with_frequency(self):
        """BEP debe escalar linealmente con frecuencia."""
        bep_60 = pump_bep(60)["Q_bep"]
        bep_50 = pump_bep(50)["Q_bep"]
        assert abs(bep_50 / bep_60 - 50/60) < 0.01


# ══════════════════════════════════════════════════════════════════
#  ELECTRICAL TESTS
# ══════════════════════════════════════════════════════════════════

class TestElectrical:

    def test_cable_resistance_increases_with_temperature(self):
        """Resistencia debe aumentar con temperatura (α > 0 para Cu)."""
        r_cold = cable_resistance_corrected(4, 7000, T_bottomhole_C=60)
        r_hot  = cable_resistance_corrected(4, 7000, T_bottomhole_C=150)
        assert r_hot["R_corrected_ohm"] > r_cold["R_corrected_ohm"]

    def test_cable_heavier_gauge_lower_resistance(self):
        """Calibre más grueso (AWG menor) → menor resistencia."""
        r_thin  = cable_resistance_corrected(8, 7000, 100)
        r_thick = cable_resistance_corrected(1, 7000, 100)
        assert r_thick["R_corrected_ohm"] < r_thin["R_corrected_ohm"]

    def test_arrhenius_within_rated(self):
        """A temperatura dentro del límite, factor de vida debe ser 1.0."""
        result = arrhenius_life_factor(120, 130)
        assert result["life_factor"] == 1.0
        assert result["warning"] is False

    def test_arrhenius_10c_over_rated(self):
        """A exactamente 10°C sobre el límite, vida debe ser 0.5."""
        result = arrhenius_life_factor(140, 130)
        assert abs(result["life_factor"] - 0.5) < 0.01

    def test_arrhenius_20c_over_rated(self):
        """A 20°C sobre el límite, vida debe ser 0.25."""
        result = arrhenius_life_factor(150, 130)
        assert abs(result["life_factor"] - 0.25) < 0.01

    def test_thd_standard_vsd_fails_ieee519(self):
        """VSD estándar de 6 pulsos no debe cumplir IEEE 519 (THD > 5%)."""
        result = thd_estimate("standard_6pulse")
        assert result["complies_ieee519"] is False

    def test_thd_afe_complies_ieee519(self):
        """AFE debe cumplir IEEE 519 (THD < 5%)."""
        result = thd_estimate("afe")
        assert result["complies_ieee519"] is True


# ══════════════════════════════════════════════════════════════════
#  RELIABILITY TESTS
# ══════════════════════════════════════════════════════════════════

class TestReliability:

    def test_survival_at_mtbf_is_1_over_e(self):
        """R(MTBF) debe ser e⁻¹ ≈ 0.3679 (resultado fundamental)."""
        MTBF = 500.0
        R    = survival_prob(MTBF, MTBF)
        assert abs(R - math.exp(-1)) < 1e-6

    def test_survival_at_zero_is_one(self):
        """R(0) debe ser 1.0 (equipo nuevo)."""
        assert survival_prob(0, 500) == 1.0

    def test_mtbf_mle_no_censoring(self):
        """Sin censurados, MTBF = promedio de tiempos de falla."""
        failures = [300.0, 400.0, 500.0, 600.0, 700.0]
        result   = mtbf_mle(failures, [])
        expected = sum(failures) / len(failures)
        assert abs(result["MTBF_days"] - expected) < 0.5

    def test_mtbf_mle_with_censored_higher(self):
        """Con censurados, MTBF debe ser mayor que sin censurados."""
        failures  = [300.0, 500.0]
        censored  = [800.0, 900.0, 1000.0]
        r1 = mtbf_mle(failures, [])
        r2 = mtbf_mle(failures, censored)
        assert r2["MTBF_days"] > r1["MTBF_days"]

    def test_mtbf_no_failures(self):
        """Sin fallas, MTBF debe ser infinito y bias_warning True."""
        result = mtbf_mle([], [500.0, 600.0, 700.0])
        assert result["MTBF_days"] == float("inf")
        assert result["bias_warning"] is True

    def test_confidence_interval_lower_lt_mle(self):
        """Límite inferior del IC debe ser menor que el MLE."""
        result = mtbf_confidence_interval(5000.0, 5, 0.90)
        assert result["MTBF_lower"] < result["MTBF_mle"]

    def test_confidence_interval_upper_gt_mle(self):
        """Límite superior del IC debe ser mayor que el MLE."""
        result = mtbf_confidence_interval(5000.0, 5, 0.90)
        assert result["MTBF_upper"] > result["MTBF_mle"]

    def test_wider_ci_for_fewer_failures(self):
        """Menos fallas → intervalo de confianza más amplio."""
        ci_many = mtbf_confidence_interval(10000.0, 20, 0.90)
        ci_few  = mtbf_confidence_interval(10000.0, 3,  0.90)
        width_many = ci_many["MTBF_upper"] - ci_many["MTBF_lower"]
        width_few  = ci_few["MTBF_upper"]  - ci_few["MTBF_lower"]
        assert width_few > width_many
