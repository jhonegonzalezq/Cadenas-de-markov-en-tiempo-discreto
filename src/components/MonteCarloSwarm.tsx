import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MarkovState } from '../types/markov';
import { sampleNextState } from '../utils/markovMath';
import { MathFormula } from './MathFormula';
import { Users, Play, Pause, RotateCcw, Shuffle, Sparkles, Activity } from 'lucide-react';

interface MonteCarloSwarmProps {
  states: MarkovState[];
  transitionMatrix: number[][];
  initialDistribution: number[];
  theoreticalDistribution: number[];
  stationaryDistribution: number[];
  step: number;
}

export const MonteCarloSwarm: React.FC<MonteCarloSwarmProps> = ({
  states,
  transitionMatrix,
  initialDistribution,
  theoreticalDistribution,
  stationaryDistribution,
  step,
}) => {
  const K = states.length;
  const [swarmSize, setSwarmSize] = useState<number>(600);
  const [particles, setParticles] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  // Initialize swarm according to initial distribution pi^(0)
  const initializeSwarm = useCallback((size: number, initDist: number[]) => {
    const newParticles: number[] = new Array(size);
    for (let i = 0; i < size; i++) {
      const r = Math.random();
      let cum = 0;
      let chosen = initDist.length - 1;
      for (let j = 0; j < initDist.length; j++) {
        cum += initDist[j];
        if (r <= cum) {
          chosen = j;
          break;
        }
      }
      newParticles[i] = chosen;
    }
    setParticles(newParticles);
    setSimStep(0);
  }, []);

  // Initialize on mount or when states/initial dist change
  useEffect(() => {
    initializeSwarm(swarmSize, initialDistribution);
  }, [swarmSize, initialDistribution, initializeSwarm]);

  // Advance swarm one step
  const stepSwarm = useCallback(() => {
    setParticles(prev => {
      const next = new Array(prev.length);
      for (let i = 0; i < prev.length; i++) {
        next[i] = sampleNextState(prev[i], transitionMatrix);
      }
      return next;
    });
    setSimStep(s => s + 1);
  }, [transitionMatrix]);

  // Swarm simulation interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(stepSwarm, 400);
    return () => clearInterval(interval);
  }, [isRunning, stepSwarm]);

  // Calculate empirical counts and frequencies
  const empiricalCounts = new Array(K).fill(0);
  particles.forEach(stateIdx => {
    if (stateIdx >= 0 && stateIdx < K) {
      empiricalCounts[stateIdx]++;
    }
  });

  const empiricalFreqs = empiricalCounts.map(count =>
    particles.length > 0 ? count / particles.length : 0
  );

  // Compute empirical error |empirical - theoretical|
  const totalEmpiricalError = empiricalFreqs.reduce(
    (acc, f, i) => acc + Math.abs(f - (theoreticalDistribution[i] || 0)),
    0
  ) * 0.5;

  return (
    <div className="flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Simulación Monte Carlo Masiva (Enjambre Estocástico)
          </h3>
          <span className="text-xs text-slate-500 font-mono-code">
            <MathFormula math="\hat{\pi}_n \xrightarrow{M \to \infty} \pi^{(n)}" />
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pausar' : 'Iniciar Enjambre'}</span>
          </button>

          <button
            onClick={stepSwarm}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <span>Paso (+1)</span>
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              initializeSwarm(swarmSize, initialDistribution);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            title="Reiniciar partículas a distribución inicial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Swarm Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Caminantes (M):</span>
            <select
              value={swarmSize}
              onChange={e => setSwarmSize(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value={200}>200 partículas</option>
              <option value={600}>600 partículas</option>
              <option value={1200}>1,200 partículas</option>
              <option value={2000}>2,000 partículas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Didactic explanation banner */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-emerald-300">Principio del Orden Macroscópico: </strong>
          Cada caminante individual salta de forma puramente aleatoria e independiente. Sin embargo, por la
          <strong> Ley de los Grandes Números</strong>, la proporción agregada de partículas en cada estado{' '}
          <MathFormula math="\hat{\pi}_n(s_i) = \frac{N_i}{M}" /> converge con una cota de error{' '}
          <MathFormula math="\mathcal{O}(1/\sqrt{M})" /> hacia la probabilidad analítica{' '}
          <MathFormula math="\pi^{(n)}_i = (\pi^{(0)} P^n)_i" />.
        </div>
      </div>

      {/* Visual State Buckets with Particle Density */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {states.map((s, idx) => {
          const count = empiricalCounts[idx] || 0;
          const empFreq = empiricalFreqs[idx] || 0;
          const theoProb = theoreticalDistribution[idx] || 0;
          const statProb = stationaryDistribution[idx] || 0;

          // Maximum particle dots to render in bucket (capped for performance)
          const displayedDots = Math.min(count, 120);

          return (
            <div
              key={`bucket-${s.id}`}
              className="flex flex-col bg-slate-950/70 border border-slate-800 rounded-lg p-3 overflow-hidden shadow-inner"
            >
              {/* Bucket Header */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-semibold text-xs text-slate-200 font-mono-code">
                    {s.code}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[70px]">
                    {s.name}
                  </span>
                </div>
                <span className="text-xs font-mono-code font-bold text-slate-200">
                  {count} <span className="text-[10px] text-slate-500 font-normal">pts</span>
                </span>
              </div>

              {/* Particle Dots Container */}
              <div className="h-20 bg-slate-900/80 border border-slate-800/60 rounded p-1.5 overflow-hidden flex flex-wrap gap-1 content-start mb-2.5">
                {Array.from({ length: displayedDots }, (_, dIdx) => (
                  <span
                    key={`dot-${s.id}-${dIdx}`}
                    className="w-1.5 h-1.5 rounded-full inline-block transition-transform duration-200 hover:scale-150"
                    style={{ backgroundColor: s.color }}
                  />
                ))}
                {count > displayedDots && (
                  <span className="text-[9px] text-slate-500 font-mono-code self-center pl-1">
                    +{count - displayedDots} más
                  </span>
                )}
              </div>

              {/* Comparison Stats */}
              <div className="flex flex-col gap-1 text-[11px] font-mono-code">
                {/* Empirical vs Theoretical */}
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Empírico (M):</span>
                  <strong className="text-emerald-400">{(empFreq * 100).toFixed(1)}%</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Teórico π^(n):</span>
                  <span className="text-sky-300">{(theoProb * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Estacionario π*:</span>
                  <span className="text-slate-400">{(statProb * 100).toFixed(1)}%</span>
                </div>

                {/* Progress bar comparison */}
                <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${empFreq * 100}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <div>
            <span className="text-slate-500">Paso de Simulación: </span>
            <strong className="text-sky-400 font-mono-code font-bold">n = {simStep}</strong>
          </div>
          <div>
            <span className="text-slate-500">Población Total: </span>
            <strong className="text-slate-200 font-mono-code">{particles.length} caminantes</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono-code text-[11px]">
          <span className="text-slate-400">Error Empírico Total Variation:</span>
          <span
            className={`font-bold ${
              totalEmpiricalError < 0.03
                ? 'text-emerald-400'
                : totalEmpiricalError < 0.08
                ? 'text-sky-400'
                : 'text-amber-400'
            }`}
          >
            {totalEmpiricalError.toFixed(4)}
          </span>
          <span className="text-[10px] text-slate-500">
            (Cota teórica 1/√M ≈ {(1 / Math.sqrt(particles.length)).toFixed(3)})
          </span>
        </div>
      </div>
    </div>
  );
};
