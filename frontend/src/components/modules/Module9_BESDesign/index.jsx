/**
 * SIMBES — Módulo 9: Flujo de Diseño BES (PASOS 0–11)
 * =====================================================
 * Wizard secuencial con 12 pasos activos.
 * Cada paso es una puerta: no se puede avanzar sin completar el anterior.
 * Ciclos A–F implementados para iteración de diseño.
 */
import { useBESDesign } from './hooks/useBESDesign.js';
import Step0_DataEntry    from './steps/Step0_DataEntry.jsx';
import Step1_Candidacy    from './steps/Step1_Candidacy.jsx';
import Step2_IPR          from './steps/Step2_IPR.jsx';
import Step3_PumpConditions from './steps/Step3_PumpConditions.jsx';
import Step4_TDH_Pump     from './steps/Step4_TDH_Pump.jsx';
import Step5_Motor        from './steps/Step5_Motor.jsx';
import Step6_Cable        from './steps/Step6_Cable.jsx';
import Step7_Mechanical   from './steps/Step7_Mechanical.jsx';
import Step8_Risks        from './steps/Step8_Risks.jsx';
import Step9_Operation    from './steps/Step9_Operation.jsx';
import Step10_Economics   from './steps/Step10_Economics.jsx';
import Step11_DataSheet   from './steps/Step11_DataSheet.jsx';
import { exportToPDF, exportToMD } from './steps/exportDataSheet.js';

import { C } from '../../../theme';

// ── Pasos del wizard completo (beta activa 0–7) ──────────────────
const STEPS = [
  { id: 0,  label: 'PASO 0',   title: 'Datos',         active: true },
  { id: 1,  label: 'PASO 1',   title: 'Candidatura',   active: true },
  { id: 2,  label: 'PASO 2',   title: 'IPR',           active: true },
  { id: 3,  label: 'PASO 3',   title: 'Cond. Bomba',   active: true },
  { id: 4,  label: 'PASO 4',   title: 'TDH / Bomba',   active: true },
  { id: 5,  label: 'PASO 5',   title: 'Motor',         active: true },
  { id: 6,  label: 'PASO 6',   title: 'Cable',         active: true },
  { id: 7,  label: 'PASO 7',   title: 'Mecánica',      active: true },
  { id: 8,  label: 'PASO 8',   title: 'Riesgos',       active: true },
  { id: 9,  label: 'PASO 9',   title: 'Operación',     active: true },
  { id: 10, label: 'PASO 10',  title: 'Económico',     active: true },
  { id: 11, label: 'PASO 11',  title: 'Hoja Selec.',   active: true },
];

// ── Barra de pasos sticky ─────────────────────────────────────────
function StepBar({ currentStep, completedSteps, onJump }) {
  return (
    <div style={{
      position: 'sticky', top: 40, zIndex: 100,
      background: C.bg, borderBottom: `1px solid ${C.border}`,
      padding: '8px 24px', overflowX: 'auto',
      display: 'flex', gap: 4, alignItems: 'center',
    }}>
      {STEPS.map((s, i) => {
        const isCompleted = completedSteps.includes(s.id);
        const isCurrent   = currentStep === s.id;
        const isClickable = s.active && (isCompleted || isCurrent);
        const color = !s.active ? C.muted
                    : isCompleted ? C.ok
                    : isCurrent   ? C.indigo
                    : C.muted;

        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => isClickable ? onJump(s.id) : null}
              disabled={!isClickable}
              title={!s.active ? 'Disponible en versión final' : s.title}
              style={{
                background: isCurrent ? `${C.indigo}18` : 'transparent',
                border: `1px solid ${isCurrent ? C.indigo : isCompleted ? C.ok : C.border}`,
                borderRadius: 6, padding: '4px 10px',
                color, fontFamily: C.fontUI, fontSize: 9,
                cursor: isClickable ? 'pointer' : 'not-allowed',
                opacity: !s.active ? 0.3 : 1,
                whiteSpace: 'nowrap', letterSpacing: 0.5,
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
              {isCompleted && <span style={{ fontSize: 9 }}>✓</span>}
              <span style={{ fontWeight: isCurrent ? 700 : 400 }}>{s.label}</span>
              <span style={{ opacity: 0.6 }}>{s.title}</span>
              {!s.active && <span style={{ fontSize: 8, opacity: 0.5 }}>🔒</span>}
            </button>
            {i < STEPS.length - 1 && (
              <span style={{ color: C.border, fontSize: 10 }}>›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function Module9_BESDesign() {
  const {
    state,
    updateInput, validateStep0, advanceStep1, advanceStep2,
    completeStep2,
    advanceStep3, cicloA, completeStep3,
    advanceStep4, cicloB_freq, cicloB_serie, completeStep4,
    advanceStep5, cicloC, completeStep5,
    advanceStep6, cicloD, completeStep6,
    advanceStep7, cicloE, completeStep7,
    advanceStep8, completeStep8,
    advanceStep9, completeStep9,
    advanceStep10, completeStep10,
    advanceStep11,
    jumpToStep,
  } = useBESDesign();

  const {
    inputs, step0, step1, step2, step3, step4, step5, step6, step7,
    step8, step9, step10, step11,
    currentStep, completedSteps,
  } = state;

  return (
    <div style={{
      fontFamily: C.font,
      background: C.bg, minHeight: '100vh', color: C.text,
    }}>

      {/* Header */}
      <div style={{
        padding: '20px 32px 0',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: C.indigo,
            letterSpacing: 2, fontFamily: C.font,
          }}>M09</div>
          <h1 style={{
            margin: 0, fontSize: 21, fontWeight: 800,
            color: '#F1F5F9', letterSpacing: -0.3, lineHeight: 1.1,
            fontFamily: C.fontUI,
          }}>
            Flujo de Diseño BES
          </h1>
          <span style={{ fontSize: 10, color: C.ok, letterSpacing: 1, fontFamily: C.fontUI }}>
            PASOS 0–11 DISPONIBLES
          </span>
        </div>
        <div style={{ fontSize: 11, color: C.muted, paddingBottom: 12, fontFamily: C.fontUI }}>
          Diseño integrado paso a paso · Ciclos A–F de iteración
        </div>
      </div>

      {/* Barra de pasos sticky */}
      <StepBar currentStep={currentStep} completedSteps={completedSteps} onJump={jumpToStep} />

      {/* Contenido del paso activo */}
      <div style={{ padding: '0 32px 48px', maxWidth: 1100 }}>

        {currentStep === 0 && (
          <Step0_DataEntry
            inputs={inputs}
            errors={step0.errors}
            step0Valid={step0.valid}
            onUpdate={updateInput}
            onValidate={validateStep0}
            onAdvance={advanceStep1}
          />
        )}

        {currentStep === 1 && (
          <Step1_Candidacy
            criterios={step1.criterios}
            verdict={step1.verdict}
            sistemasAlternativos={step1.sistemasAlternativos}
            onAdvance={advanceStep2}
            onBack={() => jumpToStep(0)}
          />
        )}

        {currentStep === 2 && (
          <>
            <Step2_IPR
              inputs={inputs}
              step2={step2}
              onAdvance={completeStep2}
              onBack={() => jumpToStep(1)}
            />
            {step2.completado && (
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={advanceStep3}
                  style={{
                    background: `${C.indigo}22`, border: `1px solid ${C.indigo}`,
                    color: C.indigo, fontFamily: C.fontUI,
                    fontSize: 11, padding: '10px 24px', borderRadius: 6,
                    cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
                  }}>
                  CONTINUAR → PASO 3: Condiciones en la bomba
                </button>
              </div>
            )}
          </>
        )}

        {currentStep === 3 && (
          <Step3_PumpConditions
            inputs={inputs}
            step3={step3}
            onCicloA={cicloA}
            onComplete={completeStep3}
            onAdvance={advanceStep4}
            onBack={() => jumpToStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4_TDH_Pump
            inputs={inputs}
            step4={step4}
            onCicloB_freq={cicloB_freq}
            onCicloB_serie={cicloB_serie}
            onComplete={completeStep4}
            onAdvance={advanceStep5}
            onBack={() => jumpToStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5_Motor
            inputs={inputs}
            step5={step5}
            onCicloC={cicloC}
            onComplete={completeStep5}
            onAdvance={advanceStep6}
            onBack={() => jumpToStep(4)}
          />
        )}

        {currentStep === 6 && (
          <Step6_Cable
            inputs={inputs}
            step6={step6}
            onCicloD={cicloD}
            onComplete={completeStep6}
            onAdvance={advanceStep7}
            onBack={() => jumpToStep(5)}
          />
        )}

        {currentStep === 7 && (
          <Step7_Mechanical
            inputs={inputs}
            step7={step7}
            onCicloE={cicloE}
            onComplete={completeStep7}
            onAdvance={advanceStep8}
            onBack={() => jumpToStep(6)}
          />
        )}

        {currentStep === 8 && (
          <Step8_Risks
            inputs={inputs}
            step8={step8}
            onComplete={completeStep8}
            onAdvance={advanceStep9}
            onBack={() => jumpToStep(7)}
          />
        )}

        {currentStep === 9 && (
          <Step9_Operation
            inputs={inputs}
            step9={step9}
            onComplete={completeStep9}
            onAdvance={advanceStep10}
            onBack={() => jumpToStep(8)}
          />
        )}

        {currentStep === 10 && (
          <Step10_Economics
            inputs={inputs}
            step10={step10}
            onComplete={completeStep10}
            onAdvance={advanceStep11}
            onBack={() => jumpToStep(9)}
          />
        )}

        {currentStep === 11 && (
          <>
            <Step11_DataSheet inputs={inputs} state={state} />
            {/* Navegación y exportación — fuera del componente de visualización */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => jumpToStep(10)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  color: C.muted, fontFamily: C.fontUI,
                  fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
                }}>
                ← VOLVER A PASO 10
              </button>

              {/* Separador */}
              <div style={{ flex: 1 }} />

              <button
                onClick={() => exportToMD(state, inputs)}
                style={{
                  background: `${C.green}15`, border: `1px solid ${C.green}50`,
                  color: C.green, fontFamily: C.fontUI,
                  fontSize: 11, padding: '10px 18px', borderRadius: 6,
                  cursor: 'pointer', letterSpacing: 1, fontWeight: 700,
                }}>
                ↓ EXPORTAR .MD
              </button>

              <button
                onClick={() => exportToPDF('step11-sheet')}
                style={{
                  background: `${C.warning}15`, border: `1px solid ${C.warning}50`,
                  color: C.warning, fontFamily: C.fontUI,
                  fontSize: 11, padding: '10px 18px', borderRadius: 6,
                  cursor: 'pointer', letterSpacing: 1, fontWeight: 700,
                }}>
                ↓ EXPORTAR PDF
              </button>

              <button
                onClick={() => jumpToStep(0)}
                style={{
                  background: `${C.indigo}15`, border: `1px solid ${C.indigo}40`,
                  color: C.indigo, fontFamily: C.fontUI,
                  fontSize: 11, padding: '10px 18px', borderRadius: 6,
                  cursor: 'pointer', letterSpacing: 1,
                }}>
                ↩ NUEVO DISEÑO
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
