"""
SIMBES — API REST (FastAPI)
============================
Motor de simulación expuesto como API. Opcional para MVP.
Útil cuando el frontend React necesita cálculos pesados en Python.

Ejecutar:
    uvicorn api.main:app --reload --port 8000
    Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from physics.ipr import calc_aof, build_ipr_curve, find_operating_point
from physics.hydraulics import (
    pump_head_ft, pump_bep, total_dynamic_head,
    friction_head, affinity_laws, specific_speed, required_stages
)
from physics.electrical import (
    cable_voltage_drop, arrhenius_life_factor, thd_estimate, material_recommendation
)
from physics.reliability import (
    mtbf_mle, survival_prob, survival_curve, mtbf_confidence_interval
)

app = FastAPI(
    title="SIMBES — Motor de Simulación BES",
    description="API del motor de simulación para el Simulador Operativo BES",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
#  SCHEMAS (Pydantic)
# ══════════════════════════════════════════════════════════════════

class IPRRequest(BaseModel):
    Pr: float = Field(3500, description="Presión estática del reservorio (psi)")
    Pb: float = Field(1800, description="Presión de burbuja (psi)")
    IP: float = Field(1.5,  description="Índice de Productividad (STB/d/psi)")
    depth_ft: float  = Field(7000, description="Profundidad de la bomba (ft)")
    Pwh_psi: float   = Field(150,  description="Presión de cabezal (psi)")
    freq_hz: float   = Field(60,   description="Frecuencia del VSD (Hz)")
    grad_psi_ft: float = Field(0.38, description="Gradiente del fluido (psi/ft)")
    n_points: int    = Field(150,  description="Puntos en la curva (para graficar)")

class CableRequest(BaseModel):
    awg: int            = Field(4,    description="Calibre AWG del cable")
    length_ft: float    = Field(7000, description="Longitud del cable (ft)")
    I_amps: float       = Field(40,   description="Corriente del motor (A)")
    T_bottomhole_C: float = Field(120, description="Temperatura fondo del pozo (°C)")
    T_surface_C: float  = Field(20,   description="Temperatura superficie (°C)")

class ArrheniusRequest(BaseModel):
    T_operating_C: float = Field(145, description="Temperatura de operación (°C)")
    T_rated_C: float     = Field(130, description="Temperatura nominal máxima del aislamiento (°C)")

class MTBFRequest(BaseModel):
    failure_times: list[float]   = Field(..., description="Tiempos de falla (días)")
    censored_times: list[float]  = Field(..., description="Tiempos de equipos aún operativos (días)")
    confidence: float = Field(0.90, description="Nivel de confianza para IC (0–1)")

class AffinityRequest(BaseModel):
    Q1: float = Field(..., description="Caudal a frecuencia f1 (STB/d)")
    H1: float = Field(..., description="Altura a frecuencia f1 (ft)")
    P1: float = Field(..., description="Potencia a frecuencia f1 (HP)")
    f1: float = Field(60.0, description="Frecuencia de referencia (Hz)")
    f2: float = Field(...,  description="Frecuencia objetivo (Hz)")


# ══════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"app": "SIMBES Motor de Simulación", "version": "1.0.0", "docs": "/docs"}


@app.post("/ipr/curve", summary="Curva IPR + VLP + Punto de Operación")
def ipr_curve(req: IPRRequest):
    """
    Genera curva IPR (Darcy + Vogel) y curva VLP (bomba BES),
    calcula el punto de operación y diagnostica el estado del sistema.
    """
    try:
        Pb = min(req.Pb, req.Pr - 50)

        # Curva IPR
        ipr_data = build_ipr_curve(req.Pr, Pb, req.IP, req.n_points)

        # Curva VLP
        import numpy as np
        Q_values = np.linspace(0, ipr_data["aof"] * 1.18, req.n_points)

        def vlp(Q):
            pump_psi   = pump_head_ft(Q, req.freq_hz) * req.grad_psi_ft
            static_psi = req.grad_psi_ft * req.depth_ft
            friction_psi = 1.4e-5 * Q**2  # [SIMPLIFIED]
            return max(0.0, req.Pwh_psi + static_psi - pump_psi + friction_psi)

        vlp_values = [round(vlp(q), 1) for q in Q_values]

        # Punto de operación
        op = find_operating_point(req.Pr, Pb, req.IP, vlp)

        # Diagnóstico
        alerts = []
        if op is None:
            alerts.append({"type": "danger", "msg": "Sin punto de operación. Bomba no vence TDH. Aumentar frecuencia VSD."})
        else:
            bep_q = pump_bep(req.freq_hz)["Q_bep"]
            dd = (req.Pr - op["Pwf"]) / req.Pr
            r  = op["Q"] / bep_q

            if op["Pwf"] < Pb * 0.25:
                alerts.append({"type": "warning", "msg": f"Pwf ({op['Pwf']} psi) muy bajo respecto a Pb. Evaluar AGS."})
            if dd > 0.82:
                alerts.append({"type": "danger", "msg": f"Drawdown {dd*100:.0f}% — riesgo de producción de arena."})
            if r < 0.68:
                alerts.append({"type": "warning", "msg": f"Q = {r*100:.0f}% del BEP → recirculación y sobrecalentamiento."})
            if r > 1.32:
                alerts.append({"type": "warning", "msg": f"Q = {r*100:.0f}% del BEP → surging (cavitación)."})
            if not alerts:
                alerts.append({"type": "ok", "msg": f"Sistema óptimo. Q = {r*100:.0f}% BEP · Drawdown = {dd*100:.0f}%."})

        return {
            "ipr": {"Q": ipr_data["Q"], "Pwf": ipr_data["Pwf"]},
            "vlp": {"Q": Q_values.tolist(), "Pwf": vlp_values},
            "operating_point": op,
            "aof": ipr_data["aof"],
            "qb":  ipr_data["qb"],
            "bep": pump_bep(req.freq_hz),
            "alerts": alerts,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/electrical/cable", summary="Caída de voltaje en cable")
def cable_drop(req: CableRequest):
    try:
        return cable_voltage_drop(
            req.awg, req.length_ft, req.I_amps,
            req.T_bottomhole_C, req.T_surface_C
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/electrical/arrhenius", summary="Factor de vida por temperatura (Arrhenius)")
def arrhenius(req: ArrheniusRequest):
    return arrhenius_life_factor(req.T_operating_C, req.T_rated_C)


@app.get("/electrical/thd/{topology}", summary="THD estimado por topología VSD")
def thd(topology: str):
    try:
        return thd_estimate(topology)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/reliability/mtbf", summary="MTBF con datos censurados + intervalos Chi²")
def mtbf(req: MTBFRequest):
    try:
        result    = mtbf_mle(req.failure_times, req.censored_times)
        if result["MTBF_days"] != float("inf"):
            ci    = mtbf_confidence_interval(
                result["T_total_days"], result["r_failures"], req.confidence
            )
            curve = survival_curve(result["MTBF_days"])
        else:
            ci    = None
            curve = None
        return {"mtbf": result, "confidence_interval": ci, "survival_curve": curve}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/hydraulics/affinity", summary="Leyes de Afinidad para variación de frecuencia")
def affinity(req: AffinityRequest):
    return affinity_laws(req.Q1, req.H1, req.P1, req.f1, req.f2)
