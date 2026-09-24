import React, { useState, useMemo } from 'react';
import { DECISION_SCENARIOS, DecisionScenario } from '../data/decisionScenarios';
import { MARKOV_PRESETS } from '../data/presets';
import { calculateStationaryDistribution } from '../utils/markovMath';
import { MathFormula } from './MathFormula';
import {
  SlidersHorizontal,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DecisionImpactAnalysisProps {
  currentExerciseId: string;
  onSelectExercise: (exerciseId: string) => void;
}

export const DecisionImpactAnalysis: React.FC<DecisionImpactAnalysisProps> = ({
  currentExerciseId,
  onSelectExercise,
}) => {
  const [activeExerciseKey, setActiveExerciseKey] = useState<string>(
    currentExerciseId && DECISION_SCENARIOS[currentExerciseId]
      ? currentExerciseId
      : 'ejercicio-1-dos-maquinas'
  );

  const scenarioSet = DECISION_SCENARIOS[activeExerciseKey] || DECISION_SCENARIOS['ejercicio-1-dos-maquinas'];
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarioSet.scenarios[1]?.id || 'base');

  // Find corresponding preset
  const preset = useMemo(() => {
    return MARKOV_PRESETS.find(p => p.id === activeExerciseKey) || MARKOV_PRESETS[0];
  }, [activeExerciseKey]);

  // Selected scenario object
  const activeScenario: DecisionScenario = useMemo(() => {
    return scenarioSet.scenarios.find(s => s.id === selectedScenarioId) || scenarioSet.scenarios[0];
  }, [scenarioSet, selectedScenarioId]);

  // Base stationary distribution
  const baseStationary = useMemo(() => {
    return calculateStationaryDistribution(preset.transitionMatrix);
  }, [preset]);

  // Modified transition matrix for active scenario
  const modifiedMatrix = useMemo(() => {
    return activeScenario.matrixModifier(preset.transitionMatrix);
  }, [activeScenario, preset]);

  // Scenario stationary distribution
  const scenarioStationary = useMemo(() => {
    return calculateStationaryDistribution(modifiedMatrix);
  }, [modifiedMatrix]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Módulo de Simulación Gerencial
                </span>
                <span className="text-xs font-mono-code text-slate-400">
                  Análisis de Efectos e Impactos de Decisiones
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">
                Laboratorio de Sensibilidad y Evaluación de Escenarios What-If
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Permite a los directivos y estudiantes evaluar el impacto estocástico de políticas de inversión,
                mantenimiento, flexibilización de riesgo y contingencias logísticas sobre el vector estacionario
                <MathFormula math="\pi^*" />, los costos operativos y el nivel de servicio.
              </p>
            </div>
          </div>

          {/* Exercise Selector Buttons */}
          <div className="flex flex-col gap-1.5 shrink-0 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Seleccionar Ejercicio a Analizar:
            </span>
            <div className="grid grid-cols-2 gap-1 text-xs font-medium">
              <button
                onClick={() => {
                  setActiveExerciseKey('ejercicio-1-dos-maquinas');
                  setSelectedScenarioId('mantenimiento_predictivo');
                  onSelectExercise('ejercicio-1-dos-maquinas');
                }}
                className={`px-2.5 py-1 rounded text-left transition-colors truncate ${
                  activeExerciseKey === 'ejercicio-1-dos-maquinas'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                1. Dos Máquinas
              </button>
              <button
                onClick={() => {
                  setActiveExerciseKey('ejercicio-2-sucursal-bancaria');
                  setSelectedScenarioId('banca_digital_autoservicio');
                  onSelectExercise('ejercicio-2-sucursal-bancaria');
                }}
                className={`px-2.5 py-1 rounded text-left transition-colors truncate ${
                  activeExerciseKey === 'ejercicio-2-sucursal-bancaria'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                2. Banco & Crédito
              </button>
              <button
                onClick={() => {
                  setActiveExerciseKey('ejercicio-3-cadena-papa-colombia');
                  setSelectedScenarioId('cierre_la_linea');
                  onSelectExercise('ejercicio-3-cadena-papa-colombia');
                }}
                className={`px-2.5 py-1 rounded text-left transition-colors truncate ${
                  activeExerciseKey === 'ejercicio-3-cadena-papa-colombia'
                    ? 'bg-amber-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                3. Papa Colombia
              </button>
              <button
                onClick={() => {
                  setActiveExerciseKey('ejercicio-4-logistica-inversa');
                  setSelectedScenarioId('diagnostico_digital_tienda');
                  onSelectExercise('ejercicio-4-logistica-inversa');
                }}
                className={`px-2.5 py-1 rounded text-left transition-colors truncate ${
                  activeExerciseKey === 'ejercicio-4-logistica-inversa'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                4. Logística Inversa
              </button>
            </div>
          </div>
        </div>

        {/* Roles and Objectives ribbon */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Rol del Decisor:</span>
            <strong className="text-amber-400 font-semibold">{scenarioSet.managerRole}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Objetivo Estratégico:</span>
            <span className="text-slate-200 max-w-xl truncate">{scenarioSet.strategicObjective}</span>
          </div>
        </div>
      </div>

      {/* Scenario Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarioSet.scenarios.map((sc, idx) => {
          const isSelected = sc.id === activeScenario.id;
          return (
            <div
              key={sc.id}
              onClick={() => setSelectedScenarioId(sc.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-code ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {sc.badge}
                </span>
                <span className="text-[11px] font-mono-code text-slate-500">
                  Opción #{idx + 1}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-200">{sc.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  {isSelected ? 'Escenario Activo' : 'Hacer Clic para Simular'}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Grid: Distribution Shifts vs Decision Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Side-by-Side Stationary Distribution Shift (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Desplazamiento del Vector Estacionario: Base vs Escenario
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono-code">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-slate-600" /> Base
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> {activeScenario.badge}
              </span>
            </div>
          </div>

          {/* Comparative Bar Chart */}
          <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {preset.states.map(s => {
              const baseVal = baseStationary[s.id] ?? 0;
              const scenVal = scenarioStationary[s.id] ?? 0;
              const delta = scenVal - baseVal;

              return (
                <div key={s.id} className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono-code text-xs">
                    <span className="text-slate-300 flex items-center gap-2 font-semibold">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} ({s.code})
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-slate-400">
                        Base: {(baseVal * 100).toFixed(1)}%
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-amber-400 font-bold">
                        Nuevo: {(scenVal * 100).toFixed(1)}%
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                          Math.abs(delta) < 0.001
                            ? 'bg-slate-800 text-slate-400'
                            : delta > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {delta > 0 ? `+${(delta * 100).toFixed(1)}%` : `${(delta * 100).toFixed(1)}%`}
                      </span>
                    </div>
                  </div>

                  {/* Dual comparison bars */}
                  <div className="space-y-1">
                    {/* Base bar */}
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(1, baseVal * 100)}%` }}
                      />
                    </div>
                    {/* Scenario bar */}
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(1, scenVal * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quantitative Decision Cards & KPIs (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Action & Impact Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Acción Directiva Ejecutada
            </span>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex flex-col gap-2">
              <p className="text-slate-300 leading-relaxed font-sans">
                {activeScenario.managerialAction}
              </p>
              <div className="p-2 rounded bg-amber-950/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                <strong>Resumen de Impacto:</strong> {activeScenario.impactSummary}
              </div>
            </div>
          </div>

          {/* Quantitative KPI Changes Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Evaluación Cuantitativa de KPIs Operativos
            </span>

            <div className="flex flex-col gap-2">
              {activeScenario.kpiChanges.map((kpi, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{kpi.label}</span>
                    <div className="flex items-center gap-2 font-mono-code font-bold">
                      <span className="text-slate-500 line-through text-[11px]">{kpi.before}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className={kpi.positive ? 'text-emerald-400' : 'text-red-400'}>
                        {kpi.after}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {kpi.explanation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Verdict / Recommendation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Recomendación para la Toma de Decisiones
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Las transiciones de Markov en tiempo discreto demuestran que las decisiones tácticas (cambios en filas de P)
              no tienen un efecto lineal aislado, sino que redistribuyen la masa probabilística en toda la red a través de
              <MathFormula math="\pi^* (I - P + \mathbf{1}\mathbf{1}^T) = \mathbf{1}^T" />. Todo plan de inversión debe
              sustentarse en el vector estacionario resultante antes del despliegue en campo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
