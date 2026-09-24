import React, { useState, useMemo } from 'react';
import { MarkovState } from '../types/markov';
import { MathFormula } from './MathFormula';
import {
  Cpu,
  Wrench,
  AlertOctagon,
  CheckCircle2,
  Play,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity,
  Sliders,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface TwoMachinesSimulatorProps {
  states: MarkovState[];
  transitionMatrix: number[][];
  stationaryDistribution: number[];
  currentStateIndex: number;
  currentStep: number;
  onStep: (from: number, to: number) => void;
  onReset: () => void;
  onSelectState: (index: number) => void;
  onUpdateMatrix?: (matrix: number[][]) => void;
}

export const TwoMachinesSimulator: React.FC<TwoMachinesSimulatorProps> = ({
  states,
  transitionMatrix,
  stationaryDistribution,
  currentStateIndex,
  currentStep,
  onStep,
  onReset,
  onSelectState,
  onUpdateMatrix,
}) => {
  // Machine reliability parameters:
  // p: Failure probability per operating machine in one period
  // r: Repair probability per broken machine in one period
  const [failProbP, setFailProbP] = useState<number>(0.15);
  const [repairProbR, setRepairProbR] = useState<number>(0.70);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Compute theoretical matrix dynamically based on p and r
  const computedMatrix = useMemo(() => {
    const p = failProbP;
    const r = repairProbR;
    return [
      // Desde Estado 0 (0 máquinas funcionando):
      // A 0: ninguna reparada (1-r)^2
      // A 1: exactamente una reparada 2r(1-r)
      // A 2: ambas reparadas r^2
      [
        parseFloat(Math.pow(1 - r, 2).toFixed(4)),
        parseFloat((2 * r * (1 - r)).toFixed(4)),
        parseFloat(Math.pow(r, 2).toFixed(4)),
      ],
      // Desde Estado 1 (1 máquina funcionando, 1 descompuesta):
      // A 0: la operativa falla y la rota NO se repara: p*(1-r)
      // A 1: la operativa sigue y rota sigue rota (1-p)*(1-r) + operativa falla y rota se repara p*r
      // A 2: la operativa sigue y la rota se repara: (1-p)*r
      [
        parseFloat((p * (1 - r)).toFixed(4)),
        parseFloat(((1 - p) * (1 - r) + p * r).toFixed(4)),
        parseFloat(((1 - p) * r).toFixed(4)),
      ],
      // Desde Estado 2 (2 máquinas funcionando):
      // A 0: ambas fallan: p^2
      // A 1: exactamente una falla: 2p(1-p)
      // A 2: ninguna falla: (1-p)^2
      [
        parseFloat(Math.pow(p, 2).toFixed(4)),
        parseFloat((2 * p * (1 - p)).toFixed(4)),
        parseFloat(Math.pow(1 - p, 2).toFixed(4)),
      ],
    ];
  }, [failProbP, repairProbR]);

  // Synchronize matrix with parent when user tweaks sliders
  const handleApplyParameters = (newP: number, newR: number) => {
    setFailProbP(newP);
    setRepairProbR(newR);
    if (onUpdateMatrix) {
      const p = newP;
      const r = newR;
      const m = [
        [Math.pow(1 - r, 2), 2 * r * (1 - r), Math.pow(r, 2)],
        [p * (1 - r), (1 - p) * (1 - r) + p * r, (1 - p) * r],
        [Math.pow(p, 2), 2 * p * (1 - p), Math.pow(1 - p, 2)],
      ];
      onUpdateMatrix(m);
    }
  };

  // Execute one step
  const executeStep = () => {
    const from = currentStateIndex;
    const row = computedMatrix[from] || transitionMatrix[from] || [0.33, 0.33, 0.34];
    const rand = Math.random();
    let cum = 0;
    let next = from;
    for (let j = 0; j < row.length; j++) {
      cum += row[j];
      if (rand <= cum) {
        next = j;
        break;
      }
    }
    onStep(from, next);
  };

  // Auto-play hook
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        executeStep();
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, currentStateIndex, computedMatrix]);

  // State interpretation
  // currentStateIndex: 0 (0 op), 1 (1 op), 2 (2 op)
  const m1Active = currentStateIndex >= 1;
  const m2Active = currentStateIndex === 2;

  const activeState = states[currentStateIndex] || states[0];

  // System availability: pi_1 + pi_2
  const availability = useMemo(() => {
    const p1 = stationaryDistribution[1] ?? 0;
    const p2 = stationaryDistribution[2] ?? 0;
    return p1 + p2;
  }, [stationaryDistribution]);

  const downtime = stationaryDistribution[0] ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Ejercicio 1: Nivel Introductorio
                </span>
                <span className="text-xs font-mono-code text-slate-400">
                  Sistema de Confiabilidad · 3 Estados (0, 1, 2)
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">
                Operación y Mantenimiento de Dos Máquinas Industriales en Paralelo
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                El sistema consta de 2 máquinas idénticas. En cada período discreto (turno de trabajo),
                cada máquina operativa puede averiarse con probabilidad <strong className="text-amber-400 font-mono-code">p</strong>,
                y cada máquina averiada puede ser reparada por el equipo técnico con probabilidad <strong className="text-emerald-400 font-mono-code">r</strong>.
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={executeStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Simular Turno (1 Paso)</span>
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs transition-colors ${
                isAutoPlaying
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isAutoPlaying ? 'animate-pulse' : ''}`} />
              <span>{isAutoPlaying ? 'Pausar' : 'Simulación Continua'}</span>
            </button>
            <button
              onClick={() => {
                setIsAutoPlaying(false);
                onReset();
              }}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current State Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Turno de Operación:</span>
            <span className="font-mono-code font-bold text-cyan-400 text-sm">n = {currentStep}</span>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Estado Actual del Sistema:</span>
              <span
                className="px-2 py-0.5 rounded font-mono-code font-bold text-slate-950 text-xs"
                style={{ backgroundColor: activeState.color }}
              >
                {activeState.code}
              </span>
              <span className="text-slate-200 font-semibold">{activeState.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono-code text-[11px]">
            <span className="text-slate-400">
              Disponibilidad Planta: <strong className="text-emerald-400">{(availability * 100).toFixed(1)}%</strong>
            </span>
            <span className="text-slate-400">
              Riesgo Parada Total π₀*: <strong className="text-red-400">{(downtime * 100).toFixed(2)}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Zone Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Zone: Physical Twin Representation of the 2 Machines (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Gemelo Visual de Planta: Estado Físico en el Turno n={currentStep}
              </span>
            </div>
            <span className="text-[11px] font-mono-code text-slate-400">
              Capacidad: {currentStateIndex === 2 ? '100%' : currentStateIndex === 1 ? '50%' : '0% (Paro)'}
            </span>
          </div>

          {/* Two Machines Physical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
            {/* Máquina 1 */}
            <div
              className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                m1Active
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      m1Active ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <h4 className="text-sm font-bold text-slate-200">Máquina Industrial #1</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-code ${
                    m1Active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {m1Active ? 'OPERATIVA' : 'AVERÍA / TALLER'}
                </span>
              </div>

              {/* Graphic Machine Visual */}
              <div className="my-5 flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="relative">
                  <Cpu
                    className={`w-16 h-16 transition-all duration-500 ${
                      m1Active ? 'text-emerald-400 animate-pulse' : 'text-red-400/50'
                    }`}
                  />
                  {m1Active ? (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-red-500 rounded-full text-white">
                      <Wrench className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono-code text-slate-400 mt-2">
                  {m1Active ? 'Producción: 50 Ton/turno' : 'En espera de repuesto'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono-code">
                <span>P(Falla): {(failProbP * 100).toFixed(0)}%</span>
                <span>P(Reparación): {(repairProbR * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Máquina 2 */}
            <div
              className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                m2Active
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      m2Active ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <h4 className="text-sm font-bold text-slate-200">Máquina Industrial #2</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-code ${
                    m2Active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {m2Active ? 'OPERATIVA' : 'AVERÍA / TALLER'}
                </span>
              </div>

              {/* Graphic Machine Visual */}
              <div className="my-5 flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="relative">
                  <Cpu
                    className={`w-16 h-16 transition-all duration-500 ${
                      m2Active ? 'text-emerald-400 animate-pulse' : 'text-red-400/50'
                    }`}
                  />
                  {m2Active ? (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-red-500 rounded-full text-white">
                      <Wrench className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono-code text-slate-400 mt-2">
                  {m2Active ? 'Producción: 50 Ton/turno' : 'En espera de repuesto'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono-code">
                <span>P(Falla): {(failProbP * 100).toFixed(0)}%</span>
                <span>P(Reparación): {(repairProbR * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Interactive State Selector Row */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Forzar Estado Inicial:</span>
            <div className="flex items-center gap-2">
              {states.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSelectState(s.id)}
                  className={`px-3 py-1.5 rounded font-mono-code font-bold transition-all text-xs flex items-center gap-1.5 ${
                    s.id === currentStateIndex
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>Estado {s.id} ({s.code})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Inspector 3x3 */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-200 uppercase tracking-wider">
                Matriz de Transición P (3×3) Derivada
              </span>
              <span className="text-[11px] font-mono-code text-cyan-400">
                P(i, j) = Probabilidad de pasar de i a j máquinas
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-center font-mono-code text-xs pt-1">
              <div className="p-1 text-slate-500 text-[10px] font-bold">Estado \ Destino</div>
              <div className="p-1 text-red-400 font-bold text-[11px]">j = 0 (0 Máq)</div>
              <div className="p-1 text-amber-400 font-bold text-[11px]">j = 1 (1 Máq)</div>
              <div className="p-1 text-emerald-400 font-bold text-[11px]">j = 2 (2 Máq)</div>

              {computedMatrix.map((row, i) => (
                <React.Fragment key={`row-${i}`}>
                  <div
                    className={`p-1.5 font-bold rounded flex items-center justify-center text-[11px] ${
                      i === currentStateIndex ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800' : 'text-slate-400'
                    }`}
                  >
                    i = {i} ({states[i]?.code})
                  </div>
                  {row.map((val, j) => (
                    <div
                      key={`cell-${i}-${j}`}
                      className={`p-1.5 rounded text-xs transition-colors flex items-center justify-center font-bold ${
                        i === currentStateIndex
                          ? 'bg-slate-800 text-sky-300 border border-sky-600/40'
                          : 'bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      {val.toFixed(3)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Right Zone: Managerial Levers & Stationary Vector (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Parameter Tuning Levers */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Palancas de Confiabilidad Operativa
              </span>
              <span className="text-[10px] font-mono-code text-slate-400">
                p: Falla | r: Reparación
              </span>
            </div>

            {/* Slider p */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tasa de Falla por Máquina (p):</span>
                <span className="font-mono-code font-bold text-amber-400">
                  {(failProbP * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.45"
                step="0.01"
                value={failProbP}
                onChange={e => handleApplyParameters(parseFloat(e.target.value), repairProbR)}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
              />
              <span className="text-[10px] text-slate-500">
                Representa desgaste mecánico, fatiga térmica y calidad de lubricantes.
              </span>
            </div>

            {/* Slider r */}
            <div className="flex flex-col gap-1.5 text-xs pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tasa de Reparación Técnica (r):</span>
                <span className="font-mono-code font-bold text-emerald-400">
                  {(repairProbR * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.95"
                step="0.05"
                value={repairProbR}
                onChange={e => handleApplyParameters(failProbP, parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
              />
              <span className="text-[10px] text-slate-500">
                Representa disponibilidad de cuadrilla técnica y stock de repuestos críticos.
              </span>
            </div>
          </div>

          {/* Stationary Distribution Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Distribución Estacionaria π* (Largo Plazo)
              </span>
              <span className="font-mono-code text-[11px] text-slate-400">
                <MathFormula math="\pi^* = \pi^* P" />
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              {states.map(s => {
                const prob = stationaryDistribution[s.id] ?? 0;
                return (
                  <div key={s.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-mono-code text-[11px]">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name} ({s.code})
                      </span>
                      <strong className="text-slate-100">{(prob * 100).toFixed(2)}%</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(1, prob * 100)}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Managerial Takeaway */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed mt-1 flex flex-col gap-1">
              <span className="font-semibold text-cyan-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Criterio del Director de Planta
              </span>
              <p>
                Si <MathFormula math="\pi_0^* > 0.05" />, el riesgo de paro total excede el estándar industrial.
                El costo de contratar un técnico auxiliar ($3,000/mes) se amortiza si reduce el tiempo de parada
                en más de 4 horas al mes.
              </p>
            </div>
          </div>

          {/* Mathematical Formulation Reference */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-2 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Formulación Analítica de Transición
            </span>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 font-mono-code text-[11px] space-y-1">
              <div><MathFormula math="P_{2,2} = (1-p)^2" /> <span className="text-slate-500">(ambas operan)</span></div>
              <div><MathFormula math="P_{2,1} = 2p(1-p)" /> <span className="text-slate-500">(falla una sola)</span></div>
              <div><MathFormula math="P_{1,2} = (1-p)r" /> <span className="text-slate-500">(se repara la rota)</span></div>
              <div><MathFormula math="P_{0,0} = (1-r)^2" /> <span className="text-slate-500">(ninguna reparada)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
