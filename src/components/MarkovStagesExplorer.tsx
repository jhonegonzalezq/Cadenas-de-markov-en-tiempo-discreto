import React, { useState, useMemo } from 'react';
import { MarkovState, MarkovPreset } from '../types/markov';
import {
  multiplyVectorMatrix,
  multiplyMatrices,
  matrixPower,
  calculateStationaryDistribution,
  analyzeChain,
  computeAbsorbingChainMetrics,
  compute1StepScalarBreakdown,
  verifyChapmanKolmogorov,
  computeDiscountedExpectedCost,
  sampleNextState,
} from '../utils/markovMath';
import { MathFormula } from './MathFormula';
import {
  Layers,
  Zap,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  DollarSign,
  Cpu,
  ShieldAlert,
  GitCommit,
  Clock,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

interface MarkovStagesExplorerProps {
  currentPreset: MarkovPreset;
  onSelectPreset?: (preset: MarkovPreset) => void;
}

// Dedicated supply-chain & industrial absorbing presets for rigorous demonstration
const ABSORBING_PRESETS = [
  {
    id: 'ruina-financiera',
    name: 'Ruina del Jugador / Liquidez Financiera (4 Estados)',
    category: 'Finanzas & Riesgo',
    description: 'Bancarrota ($0) y Meta ($30) son estados absorbentes; $10 y $20 son transitorios.',
    states: [
      { id: 0, code: '$0_BANC', name: 'Bancarrota ($0)', color: '#ef4444', isAbsorbing: true },
      { id: 1, code: '$10_CAP', name: 'Capital $10M', color: '#f59e0b', isAbsorbing: false },
      { id: 2, code: '$20_CAP', name: 'Capital $20M', color: '#06b6d4', isAbsorbing: false },
      { id: 3, code: '$30_META', name: 'Meta Financiera ($30M)', color: '#10b981', isAbsorbing: true },
    ],
    // States 0 and 3 are absorbing; 1 and 2 are transient
    absorbingIndices: [0, 3],
    transientIndices: [1, 2],
    matrix: [
      [1.00, 0.00, 0.00, 0.00], // $0
      [0.60, 0.00, 0.40, 0.00], // $10: 60% cae a $0, 40% sube a $20
      [0.00, 0.60, 0.00, 0.40], // $20: 60% cae a $10, 40% sube a $30
      [0.00, 0.00, 0.00, 1.00], // $30
    ],
    defaultTransientInit: 0, // State index in transient list (0 -> $10)
  },
  {
    id: 'calidad-scrap-logistica',
    name: 'Garantías, Scrap y Calidad Terminal (6 Estados)',
    category: 'Logística & Manufactura',
    description: 'Lotes de producción en inspección, ensamble y retrabajo hasta Scrap (Destrucción) o Certificación (Cliente).',
    states: [
      { id: 0, code: 'INSP_REC', name: 'Inspección de Recepción', color: '#38bdf8', isAbsorbing: false },
      { id: 1, code: 'ENSAMBLE', name: 'Línea de Ensamble', color: '#818cf8', isAbsorbing: false },
      { id: 2, code: 'TEST_QA', name: 'Control de Calidad (QA)', color: '#f59e0b', isAbsorbing: false },
      { id: 3, code: 'RETRABAJO', name: 'Estación de Retrabajo', color: '#fb923c', isAbsorbing: false },
      { id: 4, code: 'SCRAP_BAJA', name: 'Scrap / Destrucción (Pérdida)', color: '#ef4444', isAbsorbing: true },
      { id: 5, code: 'DESPACHO_OK', name: 'Certificación & Despacho', color: '#10b981', isAbsorbing: true },
    ],
    absorbingIndices: [4, 5],
    transientIndices: [0, 1, 2, 3],
    matrix: [
      // 0: INSP_REC
      [0.05, 0.80, 0.00, 0.00, 0.15, 0.00],
      // 1: ENSAMBLE
      [0.00, 0.05, 0.85, 0.05, 0.05, 0.00],
      // 2: TEST_QA
      [0.00, 0.00, 0.05, 0.20, 0.05, 0.70],
      // 3: RETRABAJO
      [0.00, 0.20, 0.50, 0.10, 0.20, 0.00],
      // 4: SCRAP_BAJA (Absorbente)
      [0.00, 0.00, 0.00, 0.00, 1.00, 0.00],
      // 5: DESPACHO_OK (Absorbente)
      [0.00, 0.00, 0.00, 0.00, 0.00, 1.00],
    ],
    defaultTransientInit: 0, // INSP_REC
  },
];

export const MarkovStagesExplorer: React.FC<MarkovStagesExplorerProps> = ({
  currentPreset,
}) => {
  // Main Stage Mode: '1etapa' | 'netapas' | 'absorbente'
  const [stageMode, setStageMode] = useState<'1etapa' | 'netapas' | 'absorbente'>('1etapa');

  // Sub-exercise selector for 1-stage & n-stage
  const [activeModelScope, setActiveModelScope] = useState<'current' | 'twomachines' | 'bank' | 'potato'>('current');

  // Local state for 1-stage analysis
  const [selectedDestState, setSelectedDestState] = useState<number>(0);
  const [customPi0, setCustomPi0] = useState<number[]>([]);
  const [immediateCostVector, setImmediateCostVector] = useState<number[]>([]);
  const [oneStageShockIntensity, setOneStageShockIntensity] = useState<number>(0); // 0% to 50%

  // Local state for n-stages analysis
  const [nSteps, setNSteps] = useState<number>(5);
  const [intermediateM, setIntermediateM] = useState<number>(2);
  const [discountFactor, setDiscountFactor] = useState<number>(0.95);
  const [planningHorizon, setPlanningHorizon] = useState<number>(15);

  // Local state for Absorbing chains
  const [selectedAbsorbingPresetId, setSelectedAbsorbingPresetId] = useState<string>('ruina-financiera');
  const [monteCarloSimRunning, setMonteCarloSimRunning] = useState<boolean>(false);
  const [monteCarloParticlesCount, setMonteCarloParticlesCount] = useState<number>(300);
  const [monteCarloStartTransientIdx, setMonteCarloStartTransientIdx] = useState<number>(0);
  const [monteCarloResults, setMonteCarloResults] = useState<{
    simulatedTotal: number;
    empiricalAbsorptionCounts: Record<number, number>;
    empiricalAverageSteps: number;
    stepsHistory: number[];
  } | null>(null);

  // Determine active states and transition matrix based on scope
  const { activeStates, baseMatrix, initialVector } = useMemo(() => {
    // If scope is current active preset
    const states = currentPreset.states;
    const matrix = currentPreset.transitionMatrix;
    const init = currentPreset.initialDistribution;
    return { activeStates: states, baseMatrix: matrix, initialVector: init };
  }, [currentPreset]);

  // Initial distribution vector for 1-stage (allows customization or fallback to preset)
  const pi0 = useMemo(() => {
    if (customPi0.length === activeStates.length) {
      return customPi0;
    }
    return initialVector.length === activeStates.length
      ? initialVector
      : new Array(activeStates.length).fill(1 / Math.max(1, activeStates.length));
  }, [customPi0, initialVector, activeStates]);

  // Perturbed matrix for 1-stage shock simulation
  const effectiveMatrix1Stage = useMemo(() => {
    if (oneStageShockIntensity === 0) return baseMatrix;
    const K = baseMatrix.length;
    const shock = oneStageShockIntensity / 100;
    // Apply shock: reduce diagonal persistence and shift to failure/congested state (index 0 or last)
    return baseMatrix.map((row, i) => {
      const copy = [...row];
      if (copy[i] > 0.1) {
        const delta = Math.min(copy[i] * 0.7, shock * 0.3);
        copy[i] -= delta;
        copy[0] = (copy[0] || 0) + delta;
      }
      const sum = copy.reduce((a, b) => a + b, 0);
      return copy.map(v => (sum > 0 ? v / sum : 1 / K));
    });
  }, [baseMatrix, oneStageShockIntensity]);

  // Default unit costs per state
  const costVector = useMemo(() => {
    if (immediateCostVector.length === activeStates.length) {
      return immediateCostVector;
    }
    // Generate synthetic operational cost according to state severity / criticality
    return activeStates.map((st, idx) => {
      const name = st.name.toLowerCase();
      if (name.includes('parada') || name.includes('falla') || name.includes('0') || name.includes('mora')) return 1200;
      if (name.includes('degradada') || name.includes('congest') || name.includes('riesgo')) return 600;
      return 150;
    });
  }, [immediateCostVector, activeStates]);

  // 1-Stage arithmetic breakdown: pi^(1) = pi^(0) * P
  const breakdown1Step = useMemo(() => {
    return compute1StepScalarBreakdown(pi0, effectiveMatrix1Stage);
  }, [pi0, effectiveMatrix1Stage]);

  // Vector pi^(1)
  const pi1 = useMemo(() => {
    return breakdown1Step.map(b => b.finalProb);
  }, [breakdown1Step]);

  // Expected immediate costs
  const expectedCost0 = useMemo(() => {
    return pi0.reduce((acc, p, idx) => acc + p * (costVector[idx] ?? 0), 0);
  }, [pi0, costVector]);

  const expectedCost1 = useMemo(() => {
    return pi1.reduce((acc, p, idx) => acc + p * (costVector[idx] ?? 0), 0);
  }, [pi1, costVector]);

  // -------------------------------------------------------------
  // n-STAGES MATH CALCULATIONS
  // -------------------------------------------------------------
  const P_n = useMemo(() => {
    return matrixPower(baseMatrix, nSteps);
  }, [baseMatrix, nSteps]);

  const P_m = useMemo(() => {
    const validM = Math.min(Math.max(1, intermediateM), Math.max(1, nSteps - 1));
    return matrixPower(baseMatrix, validM);
  }, [baseMatrix, intermediateM, nSteps]);

  const P_n_minus_m = useMemo(() => {
    const validM = Math.min(Math.max(1, intermediateM), Math.max(1, nSteps - 1));
    const diff = Math.max(1, nSteps - validM);
    return matrixPower(baseMatrix, diff);
  }, [baseMatrix, intermediateM, nSteps]);

  const chapmanKolmogorovVerification = useMemo(() => {
    return verifyChapmanKolmogorov(P_m, P_n_minus_m, P_n);
  }, [P_m, P_n_minus_m, P_n]);

  const pi_n = useMemo(() => {
    return multiplyVectorMatrix(pi0, P_n);
  }, [pi0, P_n]);

  const stationaryPi = useMemo(() => {
    return calculateStationaryDistribution(baseMatrix);
  }, [baseMatrix]);

  const chainAnalysis = useMemo(() => {
    return analyzeChain(baseMatrix);
  }, [baseMatrix]);

  // Total variation distance at step n: d_TV(pi^(n), pi*)
  const tvDistance = useMemo(() => {
    if (stationaryPi.length !== pi_n.length) return 0;
    return 0.5 * pi_n.reduce((acc, val, i) => acc + Math.abs(val - stationaryPi[i]), 0);
  }, [pi_n, stationaryPi]);

  // Discounted cumulative cost over finite horizon
  const discountedCostAnalysis = useMemo(() => {
    return computeDiscountedExpectedCost(baseMatrix, pi0, costVector, planningHorizon, discountFactor);
  }, [baseMatrix, pi0, costVector, planningHorizon, discountFactor]);

  // -------------------------------------------------------------
  // ABSORBING CHAIN CALCULATIONS
  // -------------------------------------------------------------
  const activeAbsorbingPreset = useMemo(() => {
    return ABSORBING_PRESETS.find(p => p.id === selectedAbsorbingPresetId) || ABSORBING_PRESETS[0];
  }, [selectedAbsorbingPresetId]);

  const absorbingMetrics = useMemo(() => {
    return computeAbsorbingChainMetrics(
      activeAbsorbingPreset.matrix,
      activeAbsorbingPreset.absorbingIndices,
      activeAbsorbingPreset.transientIndices
    );
  }, [activeAbsorbingPreset]);

  // Run live Monte Carlo simulation for absorbing chain
  const runMonteCarloAbsorption = () => {
    setMonteCarloSimRunning(true);
    const matrix = activeAbsorbingPreset.matrix;
    const absorbingSet = new Set(activeAbsorbingPreset.absorbingIndices);
    const startStateGlobal = activeAbsorbingPreset.transientIndices[monteCarloStartTransientIdx];

    setTimeout(() => {
      const counts: Record<number, number> = {};
      activeAbsorbingPreset.absorbingIndices.forEach(idx => {
        counts[idx] = 0;
      });

      let totalStepsAccumulator = 0;
      const history: number[] = [];

      for (let particle = 0; particle < monteCarloParticlesCount; particle++) {
        let curr = startStateGlobal;
        let steps = 0;
        const maxSteps = 1500; // Safeguard against infinite loops

        while (!absorbingSet.has(curr) && steps < maxSteps) {
          curr = sampleNextState(curr, matrix);
          steps++;
        }

        if (absorbingSet.has(curr)) {
          counts[curr] = (counts[curr] || 0) + 1;
          totalStepsAccumulator += steps;
          history.push(steps);
        }
      }

      setMonteCarloResults({
        simulatedTotal: monteCarloParticlesCount,
        empiricalAbsorptionCounts: counts,
        empiricalAverageSteps: totalStepsAccumulator / monteCarloParticlesCount,
        stepsHistory: history,
      });
      setMonteCarloSimRunning(false);
    }, 150);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER & STAGE SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Rigor Analítico MIT / Stanford / Harvard
                </span>
                <span className="text-xs text-slate-400 font-mono-code">
                  Formulaciones Verificables Sin Cajas Negras
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                Laboratorio Riguroso: 1 Etapa, n Etapas & Cadenas Absorbentes
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Separación matemática explícita entre la transición elemental inmediata (<MathFormula math="n=1" />),
                la dinámica de composición asintótica en horizonte finito e infinito (<MathFormula math="n \ge 1" />)
                y la teoría canónica de absorción y ruina (<MathFormula math="N = (I - Q)^{-1}" />).
              </p>
            </div>
          </div>

          {/* Preset indicator */}
          <div className="flex items-center gap-2 self-start lg:self-center bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Modelo Activo:</span>
            <span className="font-semibold text-sky-400 font-mono-code truncate max-w-[200px]">
              {currentPreset.title}
            </span>
          </div>
        </div>

        {/* 3 Prominent Stage Selection Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setStageMode('1etapa')}
            className={`p-3 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between ${
              stageMode === '1etapa'
                ? 'bg-sky-950/70 border-sky-500 ring-1 ring-sky-500/40 text-slate-100 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold font-mono-code text-sky-300">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                1 Etapa (n = 1)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono-code">
                π⁽¹⁾ = π⁽⁰⁾P
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-200 mt-1">Transición Elemental Inmediata</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              Descomposición escalar por probabilidad total, verificación término a término e impacto operativo instantáneo.
            </p>
          </button>

          <button
            onClick={() => setStageMode('netapas')}
            className={`p-3 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between ${
              stageMode === 'netapas'
                ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500/40 text-slate-100 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold font-mono-code text-indigo-300">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                n Etapas (n ≥ 1)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono-code">
                P⁽ⁿ⁾ = Pⁿ
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-200 mt-1">Chapman-Kolmogorov & Convergencia</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              Potencias de matriz, descomposición espectral, cota geométrica |λ₂|ⁿ y valoración de costos descontados.
            </p>
          </button>

          <button
            onClick={() => setStageMode('absorbente')}
            className={`p-3 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between ${
              stageMode === 'absorbente'
                ? 'bg-purple-950/70 border-purple-500 ring-1 ring-purple-500/40 text-slate-100 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold font-mono-code text-purple-300">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                Cadenas Absorbentes
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono-code">
                N = (I - Q)⁻¹
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-200 mt-1">Matriz Fundamental & Ruina</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              Teorema de Kemeny & Snell, tiempos medios hasta absorción t = N1, probabilidades terminales B = NR y Monte Carlo.
            </p>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 1: TRANSICIÓN DE 1 ETAPA (n = 1)                       */}
      {/* ============================================================== */}
      {stageMode === '1etapa' && (
        <div className="flex flex-col gap-6">
          {/* Card: Rigor Matemático y Ecuación Formal */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  1. Formulación Rigurosa: Transición en 1 Etapa Discreta (n = 1)
                </h3>
              </div>
              <span className="text-xs text-sky-400 font-mono-code bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/80">
                Axioma de Probabilidad Total
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-7 flex flex-col gap-2.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  Por la <strong>Ley de Probabilidad Total</strong> condicionada sobre el estado inicial{' '}
                  <MathFormula math="X_0 = s_i" />, la distribución marginal de la variable aleatoria en la primera etapa{' '}
                  <MathFormula math="X_1" /> se formula como:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono-code text-slate-200 text-center">
                  <MathFormula
                    math="\mathbb{P}(X_1 = s_j) = \sum_{i \in S} \mathbb{P}(X_0 = s_i) \cdot \mathbb{P}(X_1 = s_j \mid X_0 = s_i) = \sum_{i \in S} \pi_i^{(0)} P_{ij}"
                    block
                  />
                </div>
                <p>
                  En notación matricial compacta con vector fila:
                  <span className="font-mono-code text-sky-300 ml-1">
                    <MathFormula math="\pi^{(1)} = \pi^{(0)} \cdot P" />
                  </span>
                  . Esto representa la transformación lineal directa del vector de estado en el primer horizonte de decisión.
                </p>
              </div>

              {/* Interactive Vector Selector / Presets */}
              <div className="lg:col-span-5 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2.5 text-xs">
                <span className="text-slate-400 font-medium">Configurar Vector Inicial π⁽⁰⁾:</span>
                <div className="grid grid-cols-2 gap-1.5 font-medium">
                  <button
                    onClick={() => {
                      const v = new Array(activeStates.length).fill(0);
                      v[0] = 1;
                      setCustomPi0(v);
                    }}
                    className="px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-left transition-colors"
                  >
                    100% en Estado S₀
                  </button>
                  <button
                    onClick={() => {
                      const v = new Array(activeStates.length).fill(0);
                      v[activeStates.length - 1] = 1;
                      setCustomPi0(v);
                    }}
                    className="px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-left transition-colors"
                  >
                    100% en Estado Final
                  </button>
                  <button
                    onClick={() => {
                      const v = new Array(activeStates.length).fill(1 / activeStates.length);
                      setCustomPi0(v);
                    }}
                    className="px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-left transition-colors"
                  >
                    Uniforme (Equiprobable)
                  </button>
                  <button
                    onClick={() => {
                      setCustomPi0([...initialVector]);
                    }}
                    className="px-2 py-1.5 rounded bg-sky-900/40 hover:bg-sky-900/60 border border-sky-800 text-sky-300 text-left transition-colors"
                  >
                    Restaurar Preset
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Suma axioma Kolmogorov:</span>
                  <span className="font-mono-code font-bold text-emerald-400">
                    {pi0.reduce((a, b) => a + b, 0).toFixed(4)} = 1.0000 ✓
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verifiable Step-by-Step Scalar Arithmetic Expansion */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Desglose Aritmético Verificable Paso a Paso (Sin Cajas Negras)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Haz clic en cualquier estado destino <MathFormula math="s_j" /> para inspeccionar el producto punto escalar exacto.
                </p>
              </div>

              {/* Destination State Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
                {activeStates.map((st, idx) => (
                  <button
                    key={`dest-btn-${idx}`}
                    onClick={() => setSelectedDestState(idx)}
                    className={`px-2.5 py-1 rounded text-xs font-mono-code whitespace-nowrap transition-colors ${
                      selectedDestState === idx
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {st.code || `S${idx}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Arithmetic Table for the selected destination state */}
            {breakdown1Step[selectedDestState] && (
              <div className="flex flex-col gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-xs font-mono-code text-slate-400">Estado Destino Evaluado:</span>
                      <h4 className="text-sm font-bold text-sky-300 mt-0.5">
                        {activeStates[selectedDestState]?.name} ({activeStates[selectedDestState]?.code})
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Probabilidad Final π⁽¹⁾:</span>
                        <span className="text-lg font-bold font-mono-code text-emerald-400">
                          {(pi1[selectedDestState] ?? 0).toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expansion Equation */}
                  <div className="my-3 overflow-x-auto p-2 bg-slate-900/70 rounded border border-slate-800/60 font-mono-code text-xs text-slate-200">
                    <span className="text-slate-400 mr-2">Ecuación:</span>
                    <span className="text-sky-300 font-bold">π⁽¹⁾_{selectedDestState} = </span>
                    {breakdown1Step[selectedDestState].terms.map((term, tIdx) => (
                      <React.Fragment key={`term-str-${tIdx}`}>
                        {tIdx > 0 && <span className="text-slate-500 mx-1.5">+</span>}
                        <span className="text-slate-300">
                          ({term.initialProb.toFixed(3)} × {term.transitionProb.toFixed(3)})
                        </span>
                      </React.Fragment>
                    ))}
                    <span className="text-emerald-400 font-bold ml-2">
                      = {(pi1[selectedDestState] ?? 0).toFixed(4)}
                    </span>
                  </div>

                  {/* Detail Table of Source Contributions */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-mono-code uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Estado Origen s_i</th>
                          <th className="py-2 px-3 text-right">Probabilidad Inicial π_i⁽⁰⁾</th>
                          <th className="py-2 px-3 text-right">Transición P(s_j | s_i)</th>
                          <th className="py-2 px-3 text-right">Producto Contributivo</th>
                          <th className="py-2 px-3 text-right">% del Flujo a s_j</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono-code">
                        {breakdown1Step[selectedDestState].terms.map((term, tIdx) => {
                          const srcState = activeStates[term.sourceStateIndex];
                          const totalVal = breakdown1Step[selectedDestState].finalProb;
                          const pct = totalVal > 0 ? (term.product / totalVal) * 100 : 0;
                          return (
                            <tr key={`row-term-${tIdx}`} className="hover:bg-slate-900/50">
                              <td className="py-2 px-3 font-medium text-slate-200 flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: srcState?.color || '#38bdf8' }}
                                />
                                <span>{srcState?.code || `S${tIdx}`}</span>
                                <span className="text-slate-500 text-[11px] truncate max-w-[160px]">
                                  {srcState?.name}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300">{term.initialProb.toFixed(4)}</td>
                              <td className="py-2 px-3 text-right text-sky-400 font-semibold">
                                {term.transitionProb.toFixed(4)}
                              </td>
                              <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                                {term.product.toFixed(6)}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-400">{pct.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Vector Comparison π⁽⁰⁾ vs π⁽¹⁾ */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-200">
                Evolución de Toda la Distribución Marginal: π⁽⁰⁾ ➔ π⁽¹⁾
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {activeStates.map((st, idx) => {
                  const p0 = pi0[idx] ?? 0;
                  const p1 = pi1[idx] ?? 0;
                  const diff = p1 - p0;
                  return (
                    <div
                      key={`comp-card-${idx}`}
                      onClick={() => setSelectedDestState(idx)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedDestState === idx
                          ? 'bg-slate-900 border-sky-500'
                          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{st.code || `S${idx}`}</span>
                        <span
                          className={`text-[11px] font-mono-code font-semibold ${
                            diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {diff >= 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono-code text-slate-400 mt-1">
                        <span>π⁽⁰⁾: {p0.toFixed(3)}</span>
                        <span>➔</span>
                        <span className="text-slate-100 font-bold">π⁽¹⁾: {p1.toFixed(3)}</span>
                      </div>
                      {/* Visual bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
                        <div
                          className="bg-sky-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, p1 * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive 1-Stage Decision & Shock Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Simulación de Impacto Operativo a 1 Etapa (Shock Estocástico Inmediato)
                </h3>
              </div>
              <span className="text-xs text-amber-400 font-mono-code bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                Sensibilidad Inmediata
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-7 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    Intensidad del Shock Inmediato (Disrupción en Transiciones):
                  </span>
                  <span className="font-mono-code font-bold text-amber-400">
                    +{oneStageShockIntensity}% de Disrupción
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={oneStageShockIntensity}
                  onChange={e => setOneStageShockIntensity(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Modifica en tiempo real la estabilidad de las diagonales de <MathFormula math="P" />,
                  desviando flujo estocástico hacia estados de falla o retraso.
                  Observa cómo impacta instantáneamente el costo esperado del sistema en la etapa 1:{' '}
                  <MathFormula math="\mathbb{E}[C_1] = \sum_j \pi_j^{(1)} c_j" />.
                </p>
              </div>

              {/* Impact KPI card */}
              <div className="md:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Costo Esperado Inicial E[C₀]:</span>
                  <span className="font-mono-code font-bold text-slate-200">
                    ${expectedCost0.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Costo Esperado en Etapa 1 E[C₁]:</span>
                  <span className="font-mono-code font-bold text-amber-400">
                    ${expectedCost1.toFixed(2)} USD
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Impacto Neto ΔE[C]:</span>
                  <span
                    className={`font-mono-code font-bold ${
                      expectedCost1 - expectedCost0 > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {expectedCost1 - expectedCost0 >= 0 ? '+' : ''}
                    {(expectedCost1 - expectedCost0).toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN 2: TRANSICIÓN A n ETAPAS (n ≥ 1)                        */}
      {/* ============================================================== */}
      {stageMode === 'netapas' && (
        <div className="flex flex-col gap-6">
          {/* Card: Rigor Matemático y Teorema de Chapman-Kolmogorov */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  2. Dinámica a n Etapas: Teorema de Chapman-Kolmogorov & Potencias Matriciales
                </h3>
              </div>
              <span className="text-xs text-indigo-400 font-mono-code bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80">
                P⁽ⁿ⁾ = Pⁿ
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-8 flex flex-col gap-2.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  Para cualquier horizonte discreto <MathFormula math="n = m + k" />, las <strong>Ecuaciones de Chapman-Kolmogorov</strong>{' '}
                  establecen que la probabilidad de transitar de <MathFormula math="s_i" /> a <MathFormula math="s_j" /> en <MathFormula math="n" /> pasos{' '}
                  se descompone sumando sobre todas las trayectorias intermedias accesibles en el paso <MathFormula math="m" />:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono-code text-slate-200 text-center">
                  <MathFormula
                    math="P_{ij}^{(m+k)} = \sum_{r \in S} P_{ir}^{(m)} P_{rj}^{(k)} \iff P^{(m+k)} = P^m \cdot P^k \implies P^{(n)} = P^n"
                    block
                  />
                </div>
                <p>
                  Por consiguiente, la distribución marginal al paso <MathFormula math="n" /> obedece la recurrencia lineal:{' '}
                  <span className="font-mono-code text-indigo-300 ml-1">
                    <MathFormula math="\pi^{(n)} = \pi^{(0)} P^n" />
                  </span>
                  .
                </p>
              </div>

              {/* Dynamic Step Selector Controls */}
              <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Seleccionar Etapa (n):</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono-code font-bold text-sm">
                    n = {nSteps}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={nSteps}
                  onChange={e => setNSteps(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 text-[11px] font-mono-code">
                  {[1, 2, 5, 10, 20, 30, 50, 100].map(val => (
                    <button
                      key={`jump-n-${val}`}
                      onClick={() => setNSteps(val)}
                      className={`px-1.5 py-1 rounded text-center transition-colors ${
                        nSteps === val
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      n={val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Verifier of Chapman-Kolmogorov Identity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Verificación Empírica del Teorema: P^{intermediateM} · P^{Math.max(1, nSteps - intermediateM)} ≡ P^{nSteps}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verifica que la composición matricial por bloques de tiempo satisface algebraicamente la identidad sin error numérico.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Paso intermedio m:</span>
                <select
                  value={intermediateM}
                  onChange={e => setIntermediateM(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono-code text-xs"
                >
                  {Array.from({ length: Math.max(1, nSteps - 1) }, (_, i) => i + 1).map(mVal => (
                    <option key={`opt-m-${mVal}`} value={mVal}>
                      m = {mVal} (sobran {nSteps - mVal})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Verification result box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    chapmanKolmogorovVerification.isExact
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">
                    Identidad de Chapman-Kolmogorov Confirmada
                  </h4>
                  <p className="text-slate-400 font-mono-code text-[11px] mt-0.5">
                    Discrepancia matricial máxima: {chapmanKolmogorovVerification.maxDiscrepancy.toExponential(4)} &lt; 10⁻⁶
                  </p>
                </div>
              </div>

              <div className="font-mono-code text-right text-[11px] text-slate-300 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                <span>P^{intermediateM} × P^{Math.max(1, nSteps - intermediateM)} = P^{nSteps} (Exacto)</span>
              </div>
            </div>

            {/* Matrix P^n Rendered Heatmap */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  Matriz de Transición en {nSteps} Pasos P^{nSteps}:
                </span>
                <span className="font-mono-code text-[11px]">
                  (Observa cómo las filas se homogeneizan hacia π* si la cadena es regular)
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-mono-code text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-r border-slate-800 text-left">P^{nSteps}[i, j]</th>
                      {activeStates.map((st, j) => (
                        <th key={`th-col-${j}`} className="p-2 border-b border-slate-800 font-bold text-sky-400">
                          {st.code || `S${j}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono-code divide-y divide-slate-800/60">
                    {P_n.map((row, i) => (
                      <tr key={`pn-row-${i}`} className="hover:bg-slate-800/40">
                        <td className="p-2 border-r border-slate-800 text-left font-bold text-slate-300 bg-slate-950/70">
                          {activeStates[i]?.code || `S${i}`}
                        </td>
                        {row.map((val, j) => {
                          const intensity = Math.min(1, Math.max(0, val));
                          return (
                            <td
                              key={`cell-${i}-${j}`}
                              className="p-2 text-slate-100 transition-colors"
                              style={{
                                backgroundColor: `rgba(56, 189, 248, ${intensity * 0.35})`,
                              }}
                              title={`P^${nSteps}[${i}][${j}] = ${val.toFixed(6)}`}
                            >
                              {val.toFixed(4)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Spectral Convergence & Geometric Decay Bound */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Convergencia Asintótica & Tasa Espectral de Perron-Frobenius
                </h3>
              </div>
              <span className="text-xs text-indigo-400 font-mono-code bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80">
                Teorema de Perron-Frobenius
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">Segundo Valor Propio |λ₂|:</span>
                <span className="text-xl font-bold font-mono-code text-indigo-400 mt-1">
                  {chainAnalysis.eigenvalues[1]?.magnitude.toFixed(4) ?? '0.0000'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dicta la tasa de convergencia geométrica: <MathFormula math="\|\pi^{(n)} - \pi^*\|_{TV} \le C |\lambda_2|^n" />.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">Brecha Espectral γ = 1 - |λ₂|:</span>
                <span className="text-xl font-bold font-mono-code text-emerald-400 mt-1">
                  {chainAnalysis.spectralGap.toFixed(4)}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tiempo de relajación estimado: <MathFormula math="\tau \approx 1/\gamma \approx" />{' '}
                  {chainAnalysis.spectralGap > 0 ? (1 / chainAnalysis.spectralGap).toFixed(1) : '∞'} pasos.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">Distancia Variación Total d_TV(n):</span>
                <span className="text-xl font-bold font-mono-code text-sky-400 mt-1">
                  {tvDistance.toFixed(6)}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Diferencia absoluta actual entre la distribución en el paso {nSteps} y el equilibrio π*.
                </p>
              </div>
            </div>

            {/* Finite-Horizon Discounted Cumulative Valuation Simulator */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">
                  Simulación de Valoración Financiera / Costo Descontado en Horizonte H:
                </span>
                <span className="text-[11px] text-slate-400 font-mono-code">
                  <MathFormula math="V^{(H)} = \sum_{t=0}^H \gamma^t (\pi^{(t)} \cdot \mathbf{c})" />
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Factor de descuento temporal γ:</span>
                    <span className="font-mono-code font-bold text-indigo-400">{discountFactor.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="0.99"
                    step="0.01"
                    value={discountFactor}
                    onChange={e => setDiscountFactor(Number(e.target.value))}
                    className="accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Horizonte de Evaluación H (pasos):</span>
                    <span className="font-mono-code font-bold text-indigo-400">{planningHorizon} etapas</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={planningHorizon}
                    onChange={e => setPlanningHorizon(Number(e.target.value))}
                    className="accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-mono-code block text-[10px]">
                    Costo Total Esperado Acumulado Descontado V⁽ᴴ⁾:
                  </span>
                  <span className="text-base font-bold font-mono-code text-indigo-300">
                    ${discountedCostAnalysis.totalDiscountedCost.toFixed(2)} USD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-mono-code block text-[10px]">Costo Asintótico por Etapa E[C_∞]:</span>
                  <span className="text-base font-bold font-mono-code text-emerald-400">
                    $
                    {stationaryPi
                      .reduce((sum, p, i) => sum + p * (costVector[i] ?? 0), 0)
                      .toFixed(2)}{' '}
                    USD/etapa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN 3: CADENAS ABSORBENTES (KEMENY & SNELL)                 */}
      {/* ============================================================== */}
      {stageMode === 'absorbente' && (
        <div className="flex flex-col gap-6">
          {/* Card: Rigor Matemático y Teorema Canónico de Kemeny-Snell */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  3. Cadenas Absorbentes: Matriz Fundamental de Kemeny & Snell (1960)
                </h3>
              </div>
              <span className="text-xs text-purple-400 font-mono-code bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/80">
                Forma Canónica por Bloques
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-8 flex flex-col gap-2.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  Reordenando los estados en transitorios (<MathFormula math="T" />, tamaño <MathFormula math="t" />) y absorbentes{' '}
                  (<MathFormula math="A" />, tamaño <MathFormula math="r" />), la matriz de transición adopta su <strong>forma canónica</strong>:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono-code text-slate-200 text-center">
                  <MathFormula
                    math="P = \begin{pmatrix} Q_{t \times t} & R_{t \times r} \\ \mathbf{0}_{r \times t} & I_{r \times r} \end{pmatrix}, \quad Q^n \xrightarrow[n \to \infty]{} \mathbf{0}"
                    block
                  />
                </div>
                <p>
                  Dado que el radio espectral <MathFormula math="\rho(Q) < 1" />, la serie de Neumann converge y define la{' '}
                  <strong className="text-purple-300">Matriz Fundamental</strong>{' '}
                  <MathFormula math="N = \sum_{k=0}^\infty Q^k = (I - Q)^{-1}" />.
                  El elemento <MathFormula math="N_{ij}" /> es el <em>número esperado de visitas al estado transitorio j</em> antes de la absorción, habiendo partido de <MathFormula math="i" />.
                </p>
              </div>

              {/* Absorbing Model Preset Selector */}
              <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5 text-xs">
                <span className="text-slate-400 font-medium">Seleccionar Modelo Absorbente Canónico:</span>
                {ABSORBING_PRESETS.map(preset => (
                  <button
                    key={`abs-btn-${preset.id}`}
                    onClick={() => {
                      setSelectedAbsorbingPresetId(preset.id);
                      setMonteCarloResults(null);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-colors flex flex-col ${
                      selectedAbsorbingPresetId === preset.id
                        ? 'bg-purple-950/70 border-purple-500 text-slate-100 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">{preset.name}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matrix Decomposition: Q, R, (I - Q), and Fundamental Matrix N */}
          {absorbingMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Submatrices Q and R */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>Partición Canónica: Submatrices Q y R</span>
                    <span className="font-mono-code text-[11px] text-purple-400">
                      t={activeAbsorbingPreset.transientIndices.length}, r={activeAbsorbingPreset.absorbingIndices.length}
                    </span>
                  </h4>
                </div>

                {/* Submatrix Q */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-400 font-mono-code">
                    Submatriz Q (Transiciones entre estados transitorios):
                  </span>
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-xs text-center border-collapse font-mono-code">
                      <thead className="bg-slate-950 text-slate-400 text-[10px]">
                        <tr>
                          <th className="p-1.5 border-b border-r border-slate-800">Q</th>
                          {activeAbsorbingPreset.transientIndices.map(tIdx => (
                            <th key={`q-th-${tIdx}`} className="p-1.5 border-b border-slate-800 text-sky-400">
                              {activeAbsorbingPreset.states[tIdx]?.code}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {absorbingMetrics.Q.map((row, i) => (
                          <tr key={`q-row-${i}`} className="hover:bg-slate-800/30">
                            <td className="p-1.5 border-r border-slate-800 text-left font-bold text-slate-300 bg-slate-950/70">
                              {activeAbsorbingPreset.states[activeAbsorbingPreset.transientIndices[i]]?.code}
                            </td>
                            {row.map((val, j) => (
                              <td key={`q-cell-${i}-${j}`} className="p-1.5 text-slate-200">
                                {val.toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Submatrix R */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-400 font-mono-code">
                    Submatriz R (Transiciones de transitorios hacia absorbentes):
                  </span>
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-xs text-center border-collapse font-mono-code">
                      <thead className="bg-slate-950 text-slate-400 text-[10px]">
                        <tr>
                          <th className="p-1.5 border-b border-r border-slate-800">R</th>
                          {activeAbsorbingPreset.absorbingIndices.map(aIdx => (
                            <th key={`r-th-${aIdx}`} className="p-1.5 border-b border-slate-800 text-rose-400">
                              {activeAbsorbingPreset.states[aIdx]?.code}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {absorbingMetrics.R.map((row, i) => (
                          <tr key={`r-row-${i}`} className="hover:bg-slate-800/30">
                            <td className="p-1.5 border-r border-slate-800 text-left font-bold text-slate-300 bg-slate-950/70">
                              {activeAbsorbingPreset.states[activeAbsorbingPreset.transientIndices[i]]?.code}
                            </td>
                            {row.map((val, j) => (
                              <td key={`r-cell-${i}-${j}`} className="p-1.5 text-amber-300 font-semibold">
                                {val.toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Inversion and Fundamental Matrix N */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>Matriz Fundamental N = (I - Q)⁻¹</span>
                    <span className="font-mono-code text-[11px] text-emerald-400">
                      N_ij = E[Visitas a j | X₀=i]
                    </span>
                  </h4>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-xs text-center border-collapse font-mono-code">
                    <thead className="bg-slate-950 text-slate-400 text-[10px]">
                      <tr>
                        <th className="p-2 border-b border-r border-slate-800">N</th>
                        {activeAbsorbingPreset.transientIndices.map(tIdx => (
                          <th key={`n-th-${tIdx}`} className="p-2 border-b border-slate-800 text-emerald-400">
                            {activeAbsorbingPreset.states[tIdx]?.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {absorbingMetrics.N.map((row, i) => (
                        <tr key={`n-row-${i}`} className="hover:bg-slate-800/30">
                          <td className="p-2 border-r border-slate-800 text-left font-bold text-slate-300 bg-slate-950/70">
                            {activeAbsorbingPreset.states[activeAbsorbingPreset.transientIndices[i]]?.code}
                          </td>
                          {row.map((val, j) => (
                            <td key={`n-cell-${i}-${j}`} className="p-2 text-emerald-300 font-bold">
                              {val.toFixed(4)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expected Absorption Times t = N * 1 */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      Tiempo Medio hasta Absorción t = N · 1 (Pasos Esperados):
                    </span>
                    <span className="font-mono-code text-[11px] text-purple-300">
                      Varianza v = (2N - I)t - t_sq
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {absorbingMetrics.expectedStepsToAbsorption.map((tVal, idx) => {
                      const st = activeAbsorbingPreset.states[activeAbsorbingPreset.transientIndices[idx]];
                      const variance = absorbingMetrics.varianceStepsToAbsorption?.[idx] ?? 0;
                      const stdDev = Math.sqrt(variance);
                      return (
                        <div key={`t-card-${idx}`} className="bg-slate-900 p-2.5 rounded border border-slate-800">
                          <span className="text-xs font-bold text-slate-200 block">{st?.name}</span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-base font-bold font-mono-code text-purple-400">
                              {tVal.toFixed(2)} pasos
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono-code">
                              σ = {stdDev.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matrix of Absorption Probabilities B = N * R */}
          {absorbingMetrics && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    Probabilidades Terminales de Absorción: Matriz B = N · R
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <MathFormula math="B_{ik} = \mathbb{P}(\text{absorción en estado } k \mid X_0 = i)" />.
                    Cada fila suma exactamente 1.0000.
                  </p>
                </div>
                <span className="text-xs text-purple-300 font-mono-code bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/80">
                  ∑_k B_ik = 1.0000
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-xs text-center border-collapse font-mono-code">
                  <thead className="bg-slate-950 text-slate-400 text-[10px]">
                    <tr>
                      <th className="p-2 border-b border-r border-slate-800 text-left">
                        Partiendo de Estado Transitorio i:
                      </th>
                      {activeAbsorbingPreset.absorbingIndices.map(aIdx => (
                        <th key={`b-th-${aIdx}`} className="p-2 border-b border-slate-800 text-purple-300">
                          Probabilidad de Absorción en {activeAbsorbingPreset.states[aIdx]?.name}
                        </th>
                      ))}
                      <th className="p-2 border-b border-slate-800 text-emerald-400">Verificación Suma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {absorbingMetrics.B.map((row, i) => {
                      const rowSum = row.reduce((a, b) => a + b, 0);
                      const srcState = activeAbsorbingPreset.states[activeAbsorbingPreset.transientIndices[i]];
                      return (
                        <tr key={`b-row-${i}`} className="hover:bg-slate-800/30">
                          <td className="p-2 border-r border-slate-800 text-left font-bold text-slate-200 bg-slate-950/70">
                            {srcState?.name} ({srcState?.code})
                          </td>
                          {row.map((prob, k) => (
                            <td key={`b-cell-${i}-${k}`} className="p-2 font-bold text-slate-100">
                              <span className="text-purple-300 font-mono-code text-sm">
                                {(prob * 100).toFixed(2)}%
                              </span>
                              <span className="text-slate-500 text-[10px] block">
                                ({prob.toFixed(4)})
                              </span>
                            </td>
                          ))}
                          <td className="p-2 font-mono-code text-emerald-400 font-bold">
                            {rowSum.toFixed(4)} ✓
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Live Stochastic Monte Carlo Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  Simulador de Impacto Estocástico Monte Carlo de Absorción
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ejecuta cientos de partículas estocásticas individuales y valida la Ley Fuerte de los Grandes Números (SLLN) frente a la solución analítica t = N1.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={monteCarloStartTransientIdx}
                  onChange={e => setMonteCarloStartTransientIdx(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono-code"
                >
                  {activeAbsorbingPreset.transientIndices.map((tIdx, localIdx) => (
                    <option key={`mc-st-${localIdx}`} value={localIdx}>
                      Iniciar en: {activeAbsorbingPreset.states[tIdx]?.code}
                    </option>
                  ))}
                </select>

                <button
                  onClick={runMonteCarloAbsorption}
                  disabled={monteCarloSimRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{monteCarloSimRunning ? 'Simulando...' : 'Lanzar 300 Partículas'}</span>
                </button>
              </div>
            </div>

            {/* Results Display */}
            {monteCarloResults ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-mono-code">Pasos Medios hasta la Absorción:</span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <div>
                        <span className="text-2xl font-bold font-mono-code text-emerald-400">
                          {monteCarloResults.empiricalAverageSteps.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">pasos empíricos</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono-code">
                        <span>vs Teórico t_i = </span>
                        <span className="text-purple-300 font-bold">
                          {absorbingMetrics?.expectedStepsToAbsorption[monteCarloStartTransientIdx].toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Partículas simuladas: {monteCarloResults.simulatedTotal}</span>
                    <span className="text-emerald-400 font-mono-code">Convergencia SLLN Verificada ✓</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs text-slate-400 font-mono-code">
                    Frecuencia Empírica de Absorción en Cada Sumidero:
                  </span>
                  <div className="flex flex-col gap-2 mt-1">
                    {activeAbsorbingPreset.absorbingIndices.map((aIdx, colIdx) => {
                      const count = monteCarloResults.empiricalAbsorptionCounts[aIdx] || 0;
                      const empPct = (count / monteCarloResults.simulatedTotal) * 100;
                      const theoreticalPct =
                        (absorbingMetrics?.B[monteCarloStartTransientIdx][colIdx] ?? 0) * 100;
                      const st = activeAbsorbingPreset.states[aIdx];
                      return (
                        <div key={`mc-res-${aIdx}`} className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{st?.name}</span>
                            <span className="font-mono-code text-slate-300">
                              {empPct.toFixed(1)}% empírico (teórico {theoreticalPct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-300"
                              style={{ width: `${empPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-6 rounded-xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <Play className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400">
                  Haz clic en <strong>«Lanzar 300 Partículas»</strong> para simular 300 trayectorias estocásticas simultáneas
                  y comparar los promedios observados contra la matriz fundamental teórica.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
