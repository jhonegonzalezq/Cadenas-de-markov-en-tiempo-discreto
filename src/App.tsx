/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { MARKOV_PRESETS } from './data/presets';
import { MarkovPreset, MarkovState } from './types/markov';
import {
  calculateStationaryDistribution,
  analyzeChain,
  multiplyVectorMatrix,
  matrixPower,
} from './utils/markovMath';
import { GraphCanvas } from './components/GraphCanvas';
import { MatrixEditor } from './components/MatrixEditor';
import { ProbabilityEvolutionChart } from './components/ProbabilityEvolutionChart';
import { MonteCarloSwarm } from './components/MonteCarloSwarm';
import { SpectralAnalysis } from './components/SpectralAnalysis';
import { PythonSandbox } from './components/PythonSandbox';
import { DocenteTheoryGuide } from './components/DocenteTheoryGuide';
import { SupplyChainNetwork } from './components/SupplyChainNetwork';
import { AgroSupplyChainColombia } from './components/AgroSupplyChainColombia';
import { TwoMachinesSimulator } from './components/TwoMachinesSimulator';
import { BankFlowSimulator } from './components/BankFlowSimulator';
import { DecisionImpactAnalysis } from './components/DecisionImpactAnalysis';
import { MarkovStagesExplorer } from './components/MarkovStagesExplorer';
import { MathFormula } from './components/MathFormula';
import {
  Activity,
  Layers,
  Terminal,
  Sparkles,
  BookOpen,
  History,
  RotateCcw,
  Zap,
  Truck,
  MapPin,
  Cpu,
  Building2,
  SlidersHorizontal,
  TrendingUp,
  Target,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  // Preset state - default to Ejercicio 1 (Dos Máquinas)
  const [currentPreset, setCurrentPreset] = useState<MarkovPreset>(MARKOV_PRESETS[0]);
  const [states, setStates] = useState<MarkovState[]>(MARKOV_PRESETS[0].states);
  const [transitionMatrix, setTransitionMatrix] = useState<number[][]>(
    MARKOV_PRESETS[0].transitionMatrix
  );
  const [initialDistribution, setInitialDistribution] = useState<number[]>(
    MARKOV_PRESETS[0].initialDistribution
  );

  // Active walker simulation state
  const [currentStateIndex, setCurrentStateIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [trajectoryHistory, setTrajectoryHistory] = useState<number[]>([0]);

  // Active view tab
  type ActiveTab =
    | 'ejercicio1'
    | 'ejercicio2'
    | 'ejercicio3'
    | 'ejercicio4'
    | 'etapas'
    | 'decisiones'
    | 'overview'
    | 'evolution'
    | 'montecarlo'
    | 'spectral'
    | 'python'
    | 'theory';
  const [activeTab, setActiveTab] = useState<ActiveTab>('ejercicio1');

  // Compute stationary distribution pi*
  const stationaryDistribution = useMemo(() => {
    return calculateStationaryDistribution(transitionMatrix);
  }, [transitionMatrix]);

  // Compute topological and spectral chain properties
  const chainProperties = useMemo(() => {
    return analyzeChain(transitionMatrix);
  }, [transitionMatrix]);

  // Theoretical probability distribution at current step n
  const theoreticalDistribution = useMemo(() => {
    if (currentStep === 0) return [...initialDistribution];
    const Pn = matrixPower(transitionMatrix, currentStep);
    return multiplyVectorMatrix(initialDistribution, Pn);
  }, [transitionMatrix, initialDistribution, currentStep]);

  // Switch preset
  const handlePresetSelect = (preset: MarkovPreset) => {
    setCurrentPreset(preset);
    setStates(preset.states);
    setTransitionMatrix(preset.transitionMatrix);
    setInitialDistribution(preset.initialDistribution);
    setCurrentStateIndex(0);
    setCurrentStep(0);
    setTrajectoryHistory([0]);
  };

  // Helper to load specific exercise by key
  const handleLoadExercise = (exerciseKey: string, targetTab?: ActiveTab) => {
    const found = MARKOV_PRESETS.find(p => p.id === exerciseKey);
    if (found) {
      handlePresetSelect(found);
      if (targetTab) {
        setActiveTab(targetTab);
      }
    }
  };

  // Step handler from GraphCanvas or manual controls
  const handleStep = useCallback((from: number, to: number) => {
    setCurrentStateIndex(to);
    setCurrentStep(prev => prev + 1);
    setTrajectoryHistory(prev => [...prev.slice(-18), to]);
  }, []);

  // Reset walker state
  const handleResetWalker = useCallback(() => {
    // Choose start based on initial distribution or deterministic 0
    let start = 0;
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < initialDistribution.length; i++) {
      cum += initialDistribution[i];
      if (r <= cum) {
        start = i;
        break;
      }
    }
    setCurrentStateIndex(start);
    setCurrentStep(0);
    setTrajectoryHistory([start]);
  }, [initialDistribution]);

  // Normalize matrix rows
  const handleNormalizeMatrix = () => {
    const normalized = transitionMatrix.map(row => {
      const sum = row.reduce((a, b) => a + b, 0);
      if (sum === 0) {
        return new Array(row.length).fill(1 / row.length);
      }
      return row.map(v => v / sum);
    });
    setTransitionMatrix(normalized);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* 1. TOP BAR (Strictly following Top Bar Contract) */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="text-lg font-bold tracking-tight text-slate-100 font-serif-display">
          Markov Lab
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400">
          <div className="flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => handleLoadExercise('ejercicio-1-dos-maquinas', 'ejercicio1')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'ejercicio1'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>1. Dos Máquinas</span>
            </button>
            <button
              onClick={() => handleLoadExercise('ejercicio-2-sucursal-bancaria', 'ejercicio2')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'ejercicio2'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. Banco</span>
            </button>
            <button
              onClick={() => handleLoadExercise('ejercicio-3-cadena-papa-colombia', 'ejercicio3')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'ejercicio3'
                  ? 'bg-amber-600 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>3. Papa Colombia</span>
            </button>
            <button
              onClick={() => handleLoadExercise('ejercicio-4-logistica-inversa', 'ejercicio4')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'ejercicio4'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>4. Logística Inversa</span>
            </button>
          </div>

          {/* New Prominent Stage & Rigor Separator */}
          <button
            onClick={() => setActiveTab('etapas')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              activeTab === 'etapas'
                ? 'bg-gradient-to-r from-sky-500/30 to-purple-500/30 text-sky-200 border-sky-400/80 ring-1 ring-sky-400/50'
                : 'text-sky-300 hover:text-white bg-slate-900 border-sky-800/80 hover:border-sky-500/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>1 Etapa, n Etapas & Absorción</span>
          </button>

          <button
            onClick={() => setActiveTab('decisiones')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === 'decisiones'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'text-amber-400 hover:text-amber-300 bg-slate-900 border-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Impacto de Decisiones</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`hover:text-slate-100 transition-colors px-2 py-1 ${
              activeTab === 'overview' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Grafo & Matriz
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`hover:text-slate-100 transition-colors px-2 py-1 ${
              activeTab === 'evolution' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Evolución
          </button>
          <button
            onClick={() => setActiveTab('montecarlo')}
            className={`hover:text-slate-100 transition-colors px-2 py-1 ${
              activeTab === 'montecarlo' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Monte Carlo
          </button>
          <button
            onClick={() => setActiveTab('spectral')}
            className={`hover:text-slate-100 transition-colors px-2 py-1 ${
              activeTab === 'spectral' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Espectral
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`hover:text-slate-100 transition-colors px-2 py-1 ${
              activeTab === 'python' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Python
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`hover:text-slate-100 transition-colors px-2 py-1 ${
              activeTab === 'theory' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Guía
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetWalker}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
            title="Reiniciar caminante a t=0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </header>

      {/* Hero & Interactive Exercise Hub Header */}
      <section className="border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-slate-950/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Laboratorio Experimental DTMC
                </span>
                <span className="text-xs text-slate-400">Modelación Estocástica & Análisis de Decisiones</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-100 font-serif-display tracking-tight mt-1">
                Cadenas de Markov en Tiempo Discreto
              </h1>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono-code shrink-0">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Paso Actual</span>
                <strong className="text-sky-400 font-bold">n = {currentStep}</strong>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Estado Actual</span>
                <strong className="text-emerald-400 font-bold">
                  {states[currentStateIndex]?.code} ({states[currentStateIndex]?.name})
                </strong>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Régimen</span>
                <strong className={chainProperties.isErgodic ? 'text-sky-300' : 'text-amber-300'}>
                  {chainProperties.isErgodic ? 'Ergódico' : 'Absorb./Periódico'}
                </strong>
              </div>
            </div>
          </div>

          {/* 4 EXERCISE SELECTOR HUB CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Ejercicio 1 */}
            <div
              onClick={() => handleLoadExercise('ejercicio-1-dos-maquinas', 'ejercicio1')}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                activeTab === 'ejercicio1'
                  ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-code bg-cyan-500/20 text-cyan-300">
                  Ejercicio 1 · Sencillo
                </span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="my-1.5">
                <h3 className="text-xs font-bold text-slate-100">Dos Máquinas Industriales</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  0, 1 y 2 máquinas operativas. Confiabilidad y mantenimiento.
                </p>
              </div>
              <div className="text-[10px] font-mono-code text-cyan-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span>3 Estados (0, 1, 2)</span>
                <span className="font-bold">Ver Simulación →</span>
              </div>
            </div>

            {/* Ejercicio 2 */}
            <div
              onClick={() => handleLoadExercise('ejercicio-2-sucursal-bancaria', 'ejercicio2')}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                activeTab === 'ejercicio2'
                  ? 'bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-code bg-indigo-500/20 text-indigo-300">
                  Ejercicio 2 · Intermedio
                </span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="my-1.5">
                <h3 className="text-xs font-bold text-slate-100">Flujo & Riesgo en Banco</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  Caja, Asesoría, Comité de Riesgo, Desembolso y Cartera en Mora.
                </p>
              </div>
              <div className="text-[10px] font-mono-code text-indigo-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span>7 Estados Bancarios</span>
                <span className="font-bold">Ver Simulación →</span>
              </div>
            </div>

            {/* Ejercicio 3 */}
            <div
              onClick={() => handleLoadExercise('ejercicio-3-cadena-papa-colombia', 'ejercicio3')}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                activeTab === 'ejercicio3'
                  ? 'bg-slate-900 border-amber-500/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-code bg-amber-500/20 text-amber-300">
                  Ejercicio 3 · Caso Colombia
                </span>
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-1.5">
                <h3 className="text-xs font-bold text-slate-100">Cadena de Papa Colombia</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  5 Cultivos, 3 Plazas Mayoristas, 10 Tiendas y Mapa Geográfico.
                </p>
              </div>
              <div className="text-[10px] font-mono-code text-amber-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span>18 Estados + Mapa</span>
                <span className="font-bold">Ver Simulación →</span>
              </div>
            </div>

            {/* Ejercicio 4 */}
            <div
              onClick={() => handleLoadExercise('ejercicio-4-logistica-inversa', 'ejercicio4')}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                activeTab === 'ejercicio4'
                  ? 'bg-slate-900 border-purple-500/80 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-code bg-purple-500/20 text-purple-300">
                  Ejercicio 4 · Logística Inversa
                </span>
                <Truck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="my-1.5">
                <h3 className="text-xs font-bold text-slate-100">Devoluciones & Auditoría</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  Retorno de productos defectuosos, diagnóstico y causas a proveedores.
                </p>
              </div>
              <div className="text-[10px] font-mono-code text-purple-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span>16 Nodos Multieslabón</span>
                <span className="font-bold">Ver Simulación →</span>
              </div>
            </div>
          </div>

          {/* Interactive Rigor Bar: 1 Etapa, n Etapas & Cadenas Absorbentes */}
          <div className="mt-3 bg-gradient-to-r from-sky-950/60 via-slate-900 to-purple-950/60 p-3 rounded-xl border border-sky-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 font-mono-code">
                    Rigor Matemático
                  </span>
                  <h4 className="text-xs font-bold text-slate-100">
                    Módulo de Separación: 1 Etapa (n=1) vs n Etapas (n≥1) vs Cadenas Absorbentes
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Deducciones algebraicas paso a paso sin cajas negras: <MathFormula math="\pi^{(1)}=\pi^{(0)}P" />, Chapman-Kolmogorov <MathFormula math="P^n" /> y Matriz Fundamental <MathFormula math="N=(I-Q)^{-1}" /> con simulación de impacto.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('etapas')}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-sky-500/10 transition-all self-start sm:self-auto"
            >
              <span>Explorar Etapas & Absorción</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Trajectory Breadcrumb Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="flex items-center gap-1 text-slate-400 font-medium shrink-0">
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>Trayectoria X_n:</span>
            </span>
            <div className="flex items-center gap-1.5 font-mono-code text-[11px]">
              {trajectoryHistory.map((stIdx, histIdx) => {
                const s = states[stIdx];
                const isLatest = histIdx === trajectoryHistory.length - 1;
                return (
                  <React.Fragment key={`hist-${histIdx}`}>
                    {histIdx > 0 && <span className="text-slate-600">→</span>}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        isLatest
                          ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-400 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {s?.code || `S${stIdx}`}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-500 text-[11px] font-mono-code shrink-0">
            <span>P(X_{currentStep} = {states[currentStateIndex]?.code} | X_{Math.max(0, currentStep - 1)}) =</span>
            <span className="text-sky-400 font-bold">
              {currentStep > 0
                ? (
                    transitionMatrix[
                      trajectoryHistory[trajectoryHistory.length - 2] ?? 0
                    ]?.[currentStateIndex] ?? 0
                  ).toFixed(2)
                : '1.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Header on Mobile / Tablet */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-900 border-b border-slate-800">
        {(
          [
            ['ejercicio1', '1. Máquinas'],
            ['ejercicio2', '2. Banco'],
            ['ejercicio3', '3. Papa Colombia'],
            ['ejercicio4', '4. Logística Inversa'],
            ['etapas', '🔬 1 Etapa / n Etapas / Absorción'],
            ['decisiones', '⚡ Decisiones'],
            ['overview', 'Grafo & Matriz'],
            ['evolution', 'Evolución π^(n)'],
            ['montecarlo', 'Monte Carlo'],
            ['spectral', 'Espectral'],
            ['python', 'Python Lab'],
            ['theory', 'Fundamentos'],
          ] as const
        ).map(([tabKey, label]) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium ${
              activeTab === tabKey
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* EJERCICIO 1: DOS MÁQUINAS (0, 1, 2 Estados) */}
        {activeTab === 'ejercicio1' && (
          <div className="flex flex-col gap-6">
            <TwoMachinesSimulator
              states={states}
              transitionMatrix={transitionMatrix}
              stationaryDistribution={stationaryDistribution}
              currentStateIndex={currentStateIndex}
              currentStep={currentStep}
              onStep={handleStep}
              onReset={handleResetWalker}
              onSelectState={idx => setCurrentStateIndex(idx)}
              onUpdateMatrix={setTransitionMatrix}
            />

            {/* In-view Evolution Preview */}
            <ProbabilityEvolutionChart
              states={states}
              transitionMatrix={transitionMatrix}
              initialDistribution={initialDistribution}
              stationaryDistribution={stationaryDistribution}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>
        )}

        {/* EJERCICIO 2: BANCO Y RIESGO CREDITICIO (7 Estados) */}
        {activeTab === 'ejercicio2' && (
          <div className="flex flex-col gap-6">
            <BankFlowSimulator
              states={states}
              transitionMatrix={transitionMatrix}
              stationaryDistribution={stationaryDistribution}
              currentStateIndex={currentStateIndex}
              currentStep={currentStep}
              onStep={handleStep}
              onReset={handleResetWalker}
              onSelectState={idx => setCurrentStateIndex(idx)}
              onUpdateMatrix={setTransitionMatrix}
            />

            {/* In-view Evolution Preview */}
            <ProbabilityEvolutionChart
              states={states}
              transitionMatrix={transitionMatrix}
              initialDistribution={initialDistribution}
              stationaryDistribution={stationaryDistribution}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>
        )}

        {/* EJERCICIO 3: AGROALIMENTARIA PAPA EN COLOMBIA (5 Cultivos, 3 Plazas, 10 Tiendas) */}
        {activeTab === 'ejercicio3' && (
          <div className="flex flex-col gap-6">
            <AgroSupplyChainColombia
              states={states}
              transitionMatrix={transitionMatrix}
              stationaryDistribution={stationaryDistribution}
              currentStateIndex={currentStateIndex}
              currentStep={currentStep}
              onStep={handleStep}
              onReset={handleResetWalker}
              onSelectState={idx => setCurrentStateIndex(idx)}
            />

            {/* In-view Evolution Preview */}
            <ProbabilityEvolutionChart
              states={states}
              transitionMatrix={transitionMatrix}
              initialDistribution={initialDistribution}
              stationaryDistribution={stationaryDistribution}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>
        )}

        {/* EJERCICIO 4: LOGÍSTICA INVERSA Y DEVOLUCIONES (16 Nodos) */}
        {activeTab === 'ejercicio4' && (
          <div className="flex flex-col gap-6">
            <SupplyChainNetwork
              states={states}
              transitionMatrix={transitionMatrix}
              currentStateIndex={currentStateIndex}
              currentStep={currentStep}
              initialDistribution={initialDistribution}
              stationaryDistribution={stationaryDistribution}
              onSelectPreset={presetId => {
                const found = MARKOV_PRESETS.find(p => p.id === presetId);
                if (found) handlePresetSelect(found);
              }}
              selectedPresetId={currentPreset.id}
              onStep={handleStep}
              onReset={handleResetWalker}
            />

            {/* In-view Evolution Preview */}
            <ProbabilityEvolutionChart
              states={states}
              transitionMatrix={transitionMatrix}
              initialDistribution={initialDistribution}
              stationaryDistribution={stationaryDistribution}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>
        )}

        {/* MÓDULO DE ETAPAS & ABSORCIÓN: 1 ETAPA, n ETAPAS & CADENAS ABSORBENTES */}
        {activeTab === 'etapas' && (
          <div className="flex flex-col gap-6">
            <MarkovStagesExplorer
              currentPreset={currentPreset}
              onSelectPreset={preset => handlePresetSelect(preset)}
            />
          </div>
        )}

        {/* MÓDULO DE DECISIONES Y ANÁLISIS DE ESCENARIOS */}
        {activeTab === 'decisiones' && (
          <div className="flex flex-col gap-6">
            <DecisionImpactAnalysis
              currentExerciseId={currentPreset.id}
              onSelectExercise={exId => {
                handleLoadExercise(exId);
              }}
            />
          </div>
        )}

        {/* TAB 1: OVERVIEW (Graph Canvas & Matrix Editor side-by-side) */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Stage: State Diagram Graph */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <GraphCanvas
                  states={states}
                  transitionMatrix={transitionMatrix}
                  currentStateIndex={currentStateIndex}
                  onStateSelect={idx => setCurrentStateIndex(idx)}
                  onStep={handleStep}
                  onReset={handleResetWalker}
                  onStatesChange={setStates}
                />

                {/* Instant Equation Callout */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-slate-300">
                      Regla de Actualización Probabilística de Markov:
                    </span>
                  </div>
                  <MathFormula
                    math="\pi^{(n+1)} = \pi^{(n)} P = \pi^{(0)} P^{n+1}"
                    className="text-sky-300 font-mono-code text-xs"
                  />
                </div>
              </div>

              {/* Right Stage: Matrix & Initial Distribution Editor */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <MatrixEditor
                  selectedPresetId={currentPreset.id}
                  onPresetSelect={handlePresetSelect}
                  states={states}
                  transitionMatrix={transitionMatrix}
                  onMatrixChange={setTransitionMatrix}
                  initialDistribution={initialDistribution}
                  onInitialDistributionChange={setInitialDistribution}
                  onNormalizeMatrix={handleNormalizeMatrix}
                />
              </div>
            </div>

            {/* In-view Evolution Preview */}
            <ProbabilityEvolutionChart
              states={states}
              transitionMatrix={transitionMatrix}
              initialDistribution={initialDistribution}
              stationaryDistribution={stationaryDistribution}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>
        )}

        {/* TAB 2: PROBABILITY EVOLUTION */}
        {activeTab === 'evolution' && (
          <div className="flex flex-col gap-6">
            <ProbabilityEvolutionChart
              states={states}
              transitionMatrix={transitionMatrix}
              initialDistribution={initialDistribution}
              stationaryDistribution={stationaryDistribution}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Teorema de Convergencia Estacionaria
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para toda cadena aperiódica e irreducible, sin importar la distribución inicial{' '}
                  <MathFormula math="\pi^{(0)}" />, las potencias sucesivas{' '}
                  <MathFormula math="P^n" /> hacen converger las filas de la matriz a un único vector invariante:{' '}
                  <MathFormula math="\lim_{n \to \infty} P^n = \mathbf{1}\pi^*" />.
                </p>
                <div className="mt-2 p-2 bg-slate-950 rounded border border-slate-800 font-mono-code text-xs text-sky-300">
                  Vector Invariante π* = [{stationaryDistribution.map(p => p.toFixed(4)).join(', ')}]
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Distancia de Variación Total (Total Variation)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Medida formal de discrepancia entre la distribución en el paso <MathFormula math="n" /> y la
                  estacionaria:{' '}
                  <MathFormula math="d_{TV}(\pi^{(n)}, \pi^*) = \frac{1}{2} \sum_{i=1}^K |\pi^{(n)}_i - \pi^*_i|" />.
                  Alcanza 0 en el equilibrio.
                </p>
                <div className="mt-2 p-2 bg-slate-950 rounded border border-slate-800 font-mono-code text-xs text-amber-300">
                  Brecha Espectral γ = {chainProperties.spectralGap.toFixed(4)} · Tasa Cota O({chainProperties.eigenvalues[1]?.magnitude.toFixed(3) || '0'}^n)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONTE CARLO SWARM */}
        {activeTab === 'montecarlo' && (
          <div className="flex flex-col gap-6">
            <MonteCarloSwarm
              states={states}
              transitionMatrix={transitionMatrix}
              initialDistribution={initialDistribution}
              theoreticalDistribution={theoreticalDistribution}
              stationaryDistribution={stationaryDistribution}
              step={currentStep}
            />

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Relación Didáctica entre el Enjambre y el Teorema Ergódico
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                En el laboratorio experimental de Monte Carlo, observamos la dualidad estocástica: cada partícula es
                un proceso microscópico errático (caminante no determinista), pero el promedio agregado o macroscópico
                de las frecuencias de ocupación <MathFormula math="\hat{\pi}_n" /> obedece exactamente la ecuación de Kolmogorov{' '}
                <MathFormula math="\pi^{(n)} = \pi^{(0)} P^n" />.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: SPECTRAL ANALYSIS */}
        {activeTab === 'spectral' && (
          <SpectralAnalysis
            states={states}
            transitionMatrix={transitionMatrix}
            stationaryDistribution={stationaryDistribution}
            chainProperties={chainProperties}
          />
        )}

        {/* TAB 5: PYTHON LAB */}
        {activeTab === 'python' && (
          <PythonSandbox
            states={states}
            transitionMatrix={transitionMatrix}
            initialDistribution={initialDistribution}
            stationaryDistribution={stationaryDistribution}
          />
        )}

        {/* TAB 6: DIDACTIC THEORY GUIDE */}
        {activeTab === 'theory' && <DocenteTheoryGuide />}
      </main>

      {/* Minimal Academic Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>Markov Lab · Simulación & Estadística Estocástica</span>
            <span aria-hidden="true"> · </span>
            <span>Teoría de la Medida y Procesos de Markov en Tiempo Discreto</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono-code text-[11px]">
              K={states.length} Estados · ρ(P)=1.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
