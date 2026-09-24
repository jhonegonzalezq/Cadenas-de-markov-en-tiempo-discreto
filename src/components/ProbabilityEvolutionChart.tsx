import React, { useMemo, useState } from 'react';
import { MarkovState } from '../types/markov';
import { matrixPower, multiplyVectorMatrix, calculateTotalVariationDistance } from '../utils/markovMath';
import { MathFormula } from './MathFormula';
import { TrendingUp, Layers, Info } from 'lucide-react';

interface ProbabilityEvolutionChartProps {
  states: MarkovState[];
  transitionMatrix: number[][];
  initialDistribution: number[];
  stationaryDistribution: number[];
  currentStep: number;
  onStepChange?: (step: number) => void;
}

export const ProbabilityEvolutionChart: React.FC<ProbabilityEvolutionChartProps> = ({
  states,
  transitionMatrix,
  initialDistribution,
  stationaryDistribution,
  currentStep,
  onStepChange,
}) => {
  const [maxSteps, setMaxSteps] = useState<number>(25);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Compute evolution trajectories: step 0 to maxSteps
  const evolutionData = useMemo(() => {
    const K = states.length;
    const steps: { step: number; dist: number[]; dTV: number }[] = [];

    let current = [...initialDistribution];
    const dTV0 = calculateTotalVariationDistance(current, stationaryDistribution);
    steps.push({ step: 0, dist: current, dTV: dTV0 });

    for (let s = 1; s <= maxSteps; s++) {
      current = multiplyVectorMatrix(current, transitionMatrix);
      const dTV = calculateTotalVariationDistance(current, stationaryDistribution);
      steps.push({ step: s, dist: current, dTV });
    }

    return steps;
  }, [states, transitionMatrix, initialDistribution, stationaryDistribution, maxSteps]);

  const activeStep = hoveredStep !== null ? hoveredStep : Math.min(currentStep, maxSteps);
  const activeDist = evolutionData[activeStep]?.dist || initialDistribution;
  const activeDTV = evolutionData[activeStep]?.dTV ?? 0;

  // Chart coordinate geometry
  const chartWidth = 600;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (step: number) => padding.left + (step / maxSteps) * innerWidth;
  const getY = (prob: number) => padding.top + (1 - Math.max(0, Math.min(1, prob))) * innerHeight;

  return (
    <div className="flex flex-col gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Evolución Temporal de Probabilidades de Estado
          </h3>
          <span className="text-xs text-slate-500 font-mono-code">
            <MathFormula math="\pi^{(n)} = \pi^{(0)} P^n" />
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Max steps selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Horizonte n:</span>
            <select
              value={maxSteps}
              onChange={e => setMaxSteps(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value={15}>15 pasos</option>
              <option value={25}>25 pasos</option>
              <option value={40}>40 pasos</option>
              <option value={60}>60 pasos</option>
            </select>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full overflow-hidden bg-slate-950/60 border border-slate-800/80 rounded-lg p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto select-none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map(val => {
            const y = getY(val);
            return (
              <g key={`grid-${val}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  className="text-[10px] font-mono-code"
                >
                  {(val * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* X axis ticks */}
          {Array.from({ length: 6 }, (_, i) => Math.round((i * maxSteps) / 5)).map(step => {
            const x = getX(step);
            return (
              <g key={`x-tick-${step}`}>
                <line
                  x1={x}
                  y1={chartHeight - padding.bottom}
                  x2={x}
                  y2={chartHeight - padding.bottom + 4}
                  stroke="#475569"
                />
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  className="text-[10px] font-mono-code"
                >
                  n={step}
                </text>
              </g>
            );
          })}

          {/* Dotted lines for stationary probabilities pi* */}
          {states.map((s, i) => {
            const statProb = stationaryDistribution[i] ?? 0;
            const y = getY(statProb);
            return (
              <line
                key={`stat-line-${s.id}`}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke={s.color}
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                strokeWidth={1.2}
              />
            );
          })}

          {/* Trajectory Curves for each state */}
          {states.map((s, i) => {
            const points = evolutionData.map(pt => `${getX(pt.step)},${getY(pt.dist[i])}`).join(' ');
            return (
              <g key={`path-${s.id}`}>
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {/* Data points */}
                {evolutionData
                  .filter((_, idx) => idx % Math.max(1, Math.floor(maxSteps / 12)) === 0)
                  .map(pt => (
                    <circle
                      key={`pt-${s.id}-${pt.step}`}
                      cx={getX(pt.step)}
                      cy={getY(pt.dist[i])}
                      r={3}
                      fill="#0f172a"
                      stroke={s.color}
                      strokeWidth={1.8}
                    />
                  ))}
              </g>
            );
          })}

          {/* Active Step Indicator Line */}
          {activeStep !== null && (
            <g>
              <line
                x1={getX(activeStep)}
                y1={padding.top}
                x2={getX(activeStep)}
                y2={chartHeight - padding.bottom}
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(activeStep)}
                cy={chartHeight - padding.bottom + 4}
                r={3}
                fill="#38bdf8"
              />
            </g>
          )}

          {/* Hover interactive overlay rects */}
          {evolutionData.map(pt => {
            const x = getX(pt.step);
            const w = innerWidth / maxSteps;
            return (
              <rect
                key={`hover-zone-${pt.step}`}
                x={x - w / 2}
                y={padding.top}
                width={w}
                height={innerHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredStep(pt.step)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => onStepChange?.(pt.step)}
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            {states.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-mono-code text-slate-300 font-medium">{s.code}</span>
                <span className="text-slate-500 text-[11px]">
                  ({s.name}):{' '}
                  <strong className="text-slate-200">
                    {(activeDist[idx] * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-mono-code text-[11px]">
            <span>Línea discontinua (- - -) = Distribución Estacionaria π*</span>
          </div>
        </div>
      </div>

      {/* Probability Simplex Bar at Current Step */}
      <div className="flex flex-col gap-1.5 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Descomposición del Vector de Estado en Paso n = {activeStep}</span>
          </div>

          <div className="flex items-center gap-2 font-mono-code text-[11px]">
            <span className="text-slate-400">
              Distancia de Variación Total <MathFormula math="d_{TV}(\pi^{(n)}, \pi^*)" />:
            </span>
            <span
              className={`font-bold ${
                activeDTV < 0.01
                  ? 'text-emerald-400'
                  : activeDTV < 0.1
                  ? 'text-sky-400'
                  : 'text-amber-400'
              }`}
            >
              {activeDTV.toFixed(4)}
            </span>
            {activeDTV < 0.005 && (
              <span className="text-emerald-400 text-[10px] font-semibold">
                (¡CONVERGENCIA ALCANZADA!)
              </span>
            )}
          </div>
        </div>

        {/* Stacked bar */}
        <div className="w-full h-4 rounded-md overflow-hidden flex bg-slate-800 border border-slate-700/60 shadow-inner">
          {states.map((s, idx) => {
            const prob = activeDist[idx] ?? 0;
            return (
              <div
                key={`bar-${s.id}`}
                style={{
                  width: `${prob * 100}%`,
                  backgroundColor: s.color,
                }}
                className="h-full transition-all duration-300 relative group"
                title={`${s.name} (${s.code}): ${(prob * 100).toFixed(2)}%`}
              />
            );
          })}
        </div>

        {/* Numeric values */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {states.map((s, idx) => (
            <div
              key={`stat-metric-${s.id}`}
              className="flex items-center justify-between text-[11px] font-mono-code bg-slate-900/60 px-2 py-1 rounded border border-slate-800"
            >
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400">{s.code}:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">
                  {(activeDist[idx] * 100).toFixed(1)}%
                </span>
                <span className="text-slate-500 text-[10px]">
                  (π*={(stationaryDistribution[idx] * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
