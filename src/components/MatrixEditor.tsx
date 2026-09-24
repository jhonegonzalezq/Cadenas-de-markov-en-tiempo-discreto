import React from 'react';
import { MarkovPreset, MarkovState } from '../types/markov';
import { MARKOV_PRESETS } from '../data/presets';
import { MathFormula } from './MathFormula';
import { Wand2, AlertTriangle, CheckCircle2, RotateCcw, Compass } from 'lucide-react';

interface MatrixEditorProps {
  selectedPresetId: string;
  onPresetSelect: (preset: MarkovPreset) => void;
  states: MarkovState[];
  transitionMatrix: number[][];
  onMatrixChange: (newMatrix: number[][]) => void;
  initialDistribution: number[];
  onInitialDistributionChange: (newDist: number[]) => void;
  onNormalizeMatrix: () => void;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  selectedPresetId,
  onPresetSelect,
  states,
  transitionMatrix,
  onMatrixChange,
  initialDistribution,
  onInitialDistributionChange,
  onNormalizeMatrix,
}) => {
  const K = states.length;

  // Calculate row sums to verify stochastic condition sum_j P_ij = 1
  const rowSums = transitionMatrix.map(row => row.reduce((sum, v) => sum + v, 0));
  const hasInvalidRows = rowSums.some(s => Math.abs(s - 1.0) > 0.005);

  const handleCellChange = (i: number, j: number, valueStr: string) => {
    const val = parseFloat(valueStr);
    const safeVal = isNaN(val) ? 0 : Math.max(0, Math.min(1, val));
    const nextMatrix = transitionMatrix.map((row, rIdx) =>
      rIdx === i ? row.map((c, cIdx) => (cIdx === j ? safeVal : c)) : [...row]
    );
    onMatrixChange(nextMatrix);
  };

  const handleInitialProbChange = (idx: number, valStr: string) => {
    const val = parseFloat(valStr);
    const safeVal = isNaN(val) ? 0 : Math.max(0, Math.min(1, val));
    const nextDist = initialDistribution.map((p, i) => (i === idx ? safeVal : p));
    // Normalize initial vector
    const sum = nextDist.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      onInitialDistributionChange(nextDist.map(v => v / sum));
    } else {
      onInitialDistributionChange(nextDist);
    }
  };

  const setUniformInitial = () => {
    const uniform = new Array(K).fill(1 / K);
    onInitialDistributionChange(uniform);
  };

  const setDeterministicInitial = (stateIdx: number) => {
    const dist = new Array(K).fill(0);
    dist[stateIdx] = 1;
    onInitialDistributionChange(dist);
  };

  const currentPreset = MARKOV_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header & Presets Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Modelos de Transición & Casos de Estudio
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Modelo Seleccionado:</label>
          <select
            value={selectedPresetId}
            onChange={e => {
              const preset = MARKOV_PRESETS.find(p => p.id === e.target.value);
              if (preset) onPresetSelect(preset);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {MARKOV_PRESETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Didactic Brief */}
      {currentPreset && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-sky-300">{currentPreset.title}</span>
            <span className="text-[10px] text-slate-400 font-mono-code">
              Categoría: {currentPreset.category}
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-1.5">{currentPreset.description}</p>
          <div className="bg-slate-900/90 border-l-2 border-sky-500 pl-2.5 py-1 text-[11px] text-slate-400 italic">
            <strong className="text-sky-300 not-italic">Análisis Teórico & Aplicado: </strong>
            {currentPreset.didacticNote}
          </div>
        </div>
      )}

      {/* Transition Matrix Table P */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Matriz Estocástica de Transición
            </span>
            <MathFormula math="P = [P_{ij}]" className="text-xs text-sky-400 font-mono-code" />
          </div>

          {hasInvalidRows ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Filas no suman 1.0
              </span>
              <button
                onClick={onNormalizeMatrix}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                Normalizar Filas
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Matriz válida estocástica (Filas suman 1.0)
            </span>
          )}
        </div>

        {/* Matrix grid */}
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-slate-800 rounded-lg bg-slate-950/60 p-2 scrollbar-thin">
          <table className="w-full text-xs font-mono-code text-slate-300 border-collapse">
            <thead className="sticky top-0 bg-slate-950 z-10 shadow-sm">
              <tr className="border-b border-slate-800/80">
                <th className="p-1.5 text-left text-slate-500 font-normal whitespace-nowrap">
                  De \ Hacia
                </th>
                {states.map(s => (
                  <th key={s.id} className="p-1 text-center font-semibold text-slate-300 whitespace-nowrap">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.code}
                  </th>
                ))}
                <th className="p-1.5 text-right text-slate-500 font-normal whitespace-nowrap">
                  <MathFormula math="\sum_j P_{ij}" />
                </th>
              </tr>
            </thead>
            <tbody>
              {states.map((fromState, i) => {
                const rSum = rowSums[i];
                const isValidRow = Math.abs(rSum - 1.0) <= 0.005;
                const isLarge = states.length > 6;

                return (
                  <tr
                    key={fromState.id}
                    className="border-b border-slate-800/40 hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="p-1.5 font-semibold text-slate-300 flex items-center gap-1.5 whitespace-nowrap sticky left-0 bg-slate-950/90 z-[5]">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: fromState.color }}
                      />
                      <span className="truncate max-w-[90px]" title={fromState.name}>
                        {fromState.code}
                      </span>
                    </td>

                    {states.map((toState, j) => {
                      const prob = transitionMatrix[i]?.[j] ?? 0;
                      return (
                        <td key={toState.id} className="p-0.5 text-center">
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={prob}
                            onChange={e => handleCellChange(i, j, e.target.value)}
                            className={`${
                              isLarge ? 'w-11 text-[11px] px-1 py-0.5' : 'w-16 text-xs px-1.5 py-1'
                            } bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded text-center font-mono-code text-slate-100 focus:outline-none transition-colors`}
                          />
                        </td>
                      );
                    })}

                    <td className="p-1.5 text-right tabular-nums font-semibold whitespace-nowrap">
                      <span
                        className={
                          isValidRow ? 'text-emerald-400' : 'text-amber-400 font-bold'
                        }
                      >
                        {rSum.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initial Probability Distribution Vector pi^(0) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Distribución Inicial
            </span>
            <MathFormula math="\pi^{(0)} = P(X_0 = s_i)" className="text-xs text-sky-400 font-mono-code" />
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={setUniformInitial}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              Uniforme (1/{K})
            </button>
            <button
              onClick={() => setDeterministicInitial(0)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              100% en {states[0]?.code}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {states.map((s, idx) => {
            const prob = initialDistribution[idx] ?? 0;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-1.5 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs font-mono-code text-slate-300 truncate">
                    {s.code}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={Number(prob.toFixed(3))}
                  onChange={e => handleInitialProbChange(idx, e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs font-mono-code text-sky-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
