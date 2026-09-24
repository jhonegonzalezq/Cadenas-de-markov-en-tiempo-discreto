import React from 'react';
import { MarkovState, ChainProperties } from '../types/markov';
import { computeAbsorbingChainMetrics } from '../utils/markovMath';
import { MathFormula } from './MathFormula';
import { Network, Zap, CheckCircle2, XCircle, Clock, ShieldCheck, Flame } from 'lucide-react';

interface SpectralAnalysisProps {
  states: MarkovState[];
  transitionMatrix: number[][];
  stationaryDistribution: number[];
  chainProperties: ChainProperties;
}

export const SpectralAnalysis: React.FC<SpectralAnalysisProps> = ({
  states,
  transitionMatrix,
  stationaryDistribution,
  chainProperties,
}) => {
  const {
    isIrreducible,
    isAperiodic,
    isErgodic,
    hasAbsorbingStates,
    absorbingStates,
    transientStates,
    eigenvalues,
    spectralGap,
    mixingTimeEstimate,
  } = chainProperties;

  // Compute absorbing matrix metrics if applicable
  const absorbingMetrics = hasAbsorbingStates
    ? computeAbsorbingChainMetrics(transitionMatrix, absorbingStates, transientStates)
    : null;

  return (
    <div className="flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Análisis Espectral & Clasificación Topológica de la Cadena
          </h3>
          <span className="text-xs text-slate-500 font-mono-code">
            <MathFormula math="\det(\lambda I - P) = 0" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              isErgodic
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : hasAbsorbingStates
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isErgodic
              ? '● Cadena Ergódica Regular'
              : hasAbsorbingStates
              ? '● Cadena Absorbente'
              : '● Cadena No Regular / Periódica'}
          </span>
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Irreducibility */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Irreducibilidad</span>
            {isIrreducible ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sí
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                <XCircle className="w-3.5 h-3.5" /> No
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isIrreducible
              ? 'Todos los estados se comunican entre sí (i ↔ j). El espacio de estados forma una única clase comunicante cerrada.'
              : 'Existen clases cerradas disjuntas o estados transitorios que no pueden regresar una vez abandonados.'}
          </p>
        </div>

        {/* Aperiodicity */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Aperiodicidad</span>
            {isAperiodic ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sí (d = 1)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Periódica (d ≥ 2)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isAperiodic
              ? 'El máximo común divisor de los retornos a cualquier estado es d = 1. La cadena no sufre oscilaciones cíclicas fijas.'
              : 'Los retornos ocurren en múltiplos estrictos de un período d. El límite puntual π^(n) no converge, sólo su promedio de Cesàro.'}
          </p>
        </div>

        {/* Convergence & Perron-Frobenius */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Teorema Perron-Frobenius</span>
            <span className="text-[11px] text-sky-400 font-mono-code font-bold">
              λ₁ = 1.000
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Para matrices estocásticas, el radio espectral es siempre ρ(P) = 1. Si la cadena es regular,
            λ₁ = 1 es simple y para todo k ≥ 2 se cumple |λ_k| &lt; 1.
          </p>
        </div>
      </div>

      {/* Eigenvalues & Mixing Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Eigenvalues table */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Espectro de Autovalores de la Matriz P
            </span>
            <span className="text-[10px] text-slate-500 font-mono-code">
              Ord. por Magnitud |λ|
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono-code text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                  <th className="p-1 text-left">k</th>
                  <th className="p-1 text-left">Autovalor λ_k</th>
                  <th className="p-1 text-right">Magnitud |λ_k|</th>
                  <th className="p-1 text-right">Interpretación Física</th>
                </tr>
              </thead>
              <tbody>
                {eigenvalues.map((ev, idx) => {
                  const isDom = idx === 0;
                  const isSecond = idx === 1;

                  let repr = ev.re.toFixed(4);
                  if (Math.abs(ev.im) > 1e-4) {
                    repr += (ev.im > 0 ? ' + ' : ' - ') + Math.abs(ev.im).toFixed(4) + 'i';
                  }

                  return (
                    <tr
                      key={`ev-${idx}`}
                      className="border-b border-slate-800/40 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="p-1 text-slate-500 font-semibold">{idx + 1}</td>
                      <td className={`p-1 ${isDom ? 'text-sky-300 font-bold' : 'text-slate-300'}`}>
                        {repr}
                      </td>
                      <td className="p-1 text-right tabular-nums text-slate-200">
                        {ev.magnitude.toFixed(4)}
                      </td>
                      <td className="p-1 text-right text-[10px] text-slate-400">
                        {isDom ? (
                          <span className="text-sky-400 font-medium">Modo Invariante (π*)</span>
                        ) : isSecond ? (
                          <span className="text-amber-400 font-medium">Tasa de Decaimiento</span>
                        ) : (
                          'Modo Transitorio Rápido'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mixing Time and Spectral Gap */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">
                Brecha Espectral & Tiempo de Mezcla (Mixing Time)
              </span>
              <Clock className="w-3.5 h-3.5 text-sky-400" />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Brecha Espectral γ
                </span>
                <span className="text-sm font-bold text-amber-400 font-mono-code">
                  γ = {spectralGap.toFixed(4)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  γ = 1 - |λ₂|
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Tiempo de Mezcla Est.
                </span>
                <span className="text-sm font-bold text-sky-400 font-mono-code">
                  τ_mix ≈ {isFinite(mixingTimeEstimate) ? `${mixingTimeEstimate} pasos` : '∞'}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  τ ≈ 1 / γ
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-amber-300">Teorema de la Tasa Geométrica: </strong>
              La distancia de variación total decae exponencialmente según la cota:{' '}
              <MathFormula math="\|\pi^{(n)} - \pi^*\|_{TV} \le C \cdot |\lambda_2|^n" />. Cuanto menor sea{' '}
              <MathFormula math="|\lambda_2|" /> (o mayor sea la brecha espectral <MathFormula math="\gamma" />
              ), más rápida es la mezcla del sistema estocástico hacia el equilibrio térmico o estacionario.
            </p>
          </div>
        </div>
      </div>

      {/* Special Box for Absorbing Chains */}
      {hasAbsorbingStates && absorbingMetrics && (
        <div className="bg-slate-950/80 border border-purple-900/40 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-200">
                Análisis Fundamental de Absorción (Teorema de Kemeny-Snell)
              </span>
            </div>
            <span className="text-[11px] text-purple-300 font-mono-code">
              <MathFormula math="N = (I - Q)^{-1}" />
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Steps to Absorption */}
            <div className="bg-slate-900/80 border border-slate-800 rounded p-2.5">
              <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Número Esperado de Pasos antes de la Absorción:
              </span>
              <div className="flex flex-col gap-1 font-mono-code text-[11px]">
                {transientStates.map((tIdx, i) => (
                  <div key={`exp-step-${tIdx}`} className="flex items-center justify-between">
                    <span className="text-slate-400">
                      Desde {states[tIdx]?.name} ({states[tIdx]?.code}):
                    </span>
                    <strong className="text-purple-300">
                      {absorbingMetrics.expectedStepsToAbsorption[i]?.toFixed(2)} pasos
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Absorption Probabilities B = N * R */}
            <div className="bg-slate-900/80 border border-slate-800 rounded p-2.5">
              <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Probabilidades de Absorción Terminal B = N · R:
              </span>
              <div className="flex flex-col gap-1 font-mono-code text-[11px]">
                {transientStates.map((tIdx, i) => (
                  <div key={`abs-prob-${tIdx}`} className="flex items-center justify-between">
                    <span className="text-slate-400">Desde {states[tIdx]?.code}:</span>
                    <div className="flex items-center gap-2">
                      {absorbingStates.map((aIdx, j) => (
                        <span key={`b-${tIdx}-${aIdx}`} className="text-slate-300">
                          {states[aIdx]?.code}:{' '}
                          <strong className="text-sky-300">
                            {((absorbingMetrics.B[i]?.[j] ?? 0) * 100).toFixed(1)}%
                          </strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
