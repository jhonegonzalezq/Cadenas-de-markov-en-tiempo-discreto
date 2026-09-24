import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MarkovState } from '../types/markov';
import { sampleNextState } from '../utils/markovMath';
import { Play, Pause, StepForward, RotateCcw, Sparkles } from 'lucide-react';

interface GraphCanvasProps {
  states: MarkovState[];
  transitionMatrix: number[][];
  currentStateIndex: number;
  onStateSelect: (index: number) => void;
  onStep: (from: number, to: number) => void;
  onReset: () => void;
  onStatesChange?: (states: MarkovState[]) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  states,
  transitionMatrix,
  currentStateIndex,
  onStateSelect,
  onStep,
  onReset,
  onStatesChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 420 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(700); // ms per step
  const [draggedNode, setDraggedNode] = useState<number | null>(null);

  // Measure container width
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setDimensions({
          width: clientWidth || 640,
          height: Math.max(380, Math.min(500, clientWidth * 0.58)),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const nextState = sampleNextState(currentStateIndex, transitionMatrix);
      onStep(currentStateIndex, nextState);
    }, simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, currentStateIndex, transitionMatrix, simulationSpeed, onStep]);

  // Handle single manual step
  const handleSingleStep = () => {
    const nextState = sampleNextState(currentStateIndex, transitionMatrix);
    onStep(currentStateIndex, nextState);
  };

  // Node drag handlers
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNode(index);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (draggedNode === null || !containerRef.current || !onStatesChange) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const normX = Math.max(0.1, Math.min(0.9, clientX / dimensions.width));
      const normY = Math.max(0.12, Math.min(0.88, clientY / dimensions.height));

      const updated = states.map((s, idx) =>
        idx === draggedNode ? { ...s, x: normX, y: normY } : s
      );
      onStatesChange(updated);
    },
    [draggedNode, dimensions, states, onStatesChange]
  );

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const nodeRadius = Math.max(26, Math.min(34, dimensions.width * 0.045));

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Grafo Dirigido de Transiciones
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">
            Estado Actual:{' '}
            <strong className="text-sky-300">
              {states[currentStateIndex]?.name} ({states[currentStateIndex]?.code})
            </strong>
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSimulating
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-sky-600 text-white hover:bg-sky-500 shadow-sm'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Pausar' : 'Simular Trayectoria'}</span>
          </button>

          <button
            onClick={handleSingleStep}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Paso (+1)</span>
          </button>

          <button
            onClick={() => {
              setIsSimulating(false);
              onReset();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            title="Reiniciar al paso 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Speed selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Velocidad:</span>
            <select
              value={simulationSpeed}
              onChange={e => setSimulationSpeed(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value={1200}>Lenta (1.2s)</option>
              <option value={700}>Normal (0.7s)</option>
              <option value={300}>Rápida (0.3s)</option>
              <option value={100}>Turbo (0.1s)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none bg-gradient-to-b from-slate-950/40 to-slate-900/60"
        style={{ height: dimensions.height }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full cursor-default"
        >
          <defs>
            {/* Arrowhead marker */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-hover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#facc15" />
            </marker>

            {/* Subtle radial glow for active walker */}
            <radialGradient id="walkerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Render Transitions (Edges) */}
          {states.map((source, i) =>
            states.map((target, j) => {
              const prob = transitionMatrix[i]?.[j] ?? 0;
              if (prob < 0.001) return null;

              const isFromActive = i === currentStateIndex;
              const isHovered = hoveredNode === i;
              const isTwoWay = i !== j && (transitionMatrix[j]?.[i] ?? 0) > 0.001;

              const x1 = source.x * dimensions.width;
              const y1 = source.y * dimensions.height;
              const x2 = target.x * dimensions.width;
              const y2 = target.y * dimensions.height;

              // Self-loop
              if (i === j) {
                // Loop upward or away from center
                const loopRadius = 26;
                const loopCenterY = y1 - nodeRadius - 10;
                const loopPath = `M ${x1 - 10} ${y1 - nodeRadius + 3} 
                  C ${x1 - loopRadius - 8} ${loopCenterY - 14}, 
                    ${x1 + loopRadius + 8} ${loopCenterY - 14}, 
                    ${x1 + 10} ${y1 - nodeRadius + 3}`;

                return (
                  <g key={`loop-${i}`}>
                    <path
                      d={loopPath}
                      fill="none"
                      stroke={isFromActive ? '#38bdf8' : isHovered ? '#facc15' : '#475569'}
                      strokeWidth={isFromActive ? 2.5 : isHovered ? 2 : Math.max(1.2, prob * 3)}
                      strokeDasharray={isFromActive ? '4 2' : 'none'}
                      markerEnd={isFromActive ? 'url(#arrow-active)' : isHovered ? 'url(#arrow-hover)' : 'url(#arrow)'}
                      className="transition-colors duration-200"
                    />
                    {/* Prob label */}
                    <rect
                      x={x1 - 18}
                      y={loopCenterY - 26}
                      width={36}
                      height={18}
                      rx={4}
                      fill="#0f172a"
                      stroke={isFromActive ? '#38bdf8' : '#334155'}
                      strokeWidth={1}
                    />
                    <text
                      x={x1}
                      y={loopCenterY - 13}
                      textAnchor="middle"
                      fill={isFromActive ? '#38bdf8' : '#cbd5e1'}
                      className="text-[10px] font-mono-code font-medium select-none"
                    >
                      {prob.toFixed(2)}
                    </text>
                  </g>
                );
              }

              // Directed Edge between distinct nodes
              const dx = x2 - x1;
              const dy = y2 - y1;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;

              // Unit vector
              const ux = dx / dist;
              const uy = dy / dist;

              // Perpendicular vector for curving
              const px = -uy;
              const py = ux;

              // Curvature offset
              const curveMagnitude = isTwoWay ? Math.min(40, dist * 0.22) : 12;
              const cx = (x1 + x2) / 2 + px * curveMagnitude;
              const cy = (y1 + y2) / 2 + py * curveMagnitude;

              // Start and end points clamped to node perimeter
              const startX = x1 + ux * (nodeRadius + 2) + px * (isTwoWay ? 6 : 0);
              const startY = y1 + uy * (nodeRadius + 2) + py * (isTwoWay ? 6 : 0);
              const endX = x2 - ux * (nodeRadius + 6) + px * (isTwoWay ? 6 : 0);
              const endY = y2 - uy * (nodeRadius + 6) + py * (isTwoWay ? 6 : 0);

              const path = `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;

              // Midpoint for probability pill
              const midX = 0.25 * startX + 0.5 * cx + 0.25 * endX;
              const midY = 0.25 * startY + 0.5 * cy + 0.25 * endY;

              const strokeColor = isFromActive
                ? '#38bdf8'
                : isHovered
                ? '#facc15'
                : '#475569';

              return (
                <g key={`edge-${i}-${j}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isFromActive ? 2.5 : isHovered ? 2 : Math.max(1.2, prob * 3.2)}
                    markerEnd={
                      isFromActive
                        ? 'url(#arrow-active)'
                        : isHovered
                        ? 'url(#arrow-hover)'
                        : 'url(#arrow)'
                    }
                    className="transition-all duration-200"
                  />
                  {/* Probability tag */}
                  <rect
                    x={midX - 16}
                    y={midY - 9}
                    width={32}
                    height={18}
                    rx={4}
                    fill="#090d16"
                    stroke={isFromActive ? '#38bdf8' : isHovered ? '#facc15' : '#334155'}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill={isFromActive ? '#38bdf8' : '#cbd5e1'}
                    className="text-[10px] font-mono-code font-medium select-none"
                  >
                    {prob.toFixed(2)}
                  </text>
                </g>
              );
            })
          )}

          {/* Render State Nodes */}
          {states.map((state, index) => {
            const x = state.x * dimensions.width;
            const y = state.y * dimensions.height;
            const isActive = index === currentStateIndex;
            const isHovered = hoveredNode === index;

            return (
              <g
                key={state.id}
                transform={`translate(${x}, ${y})`}
                onMouseDown={e => handleMouseDown(index, e)}
                onClick={() => onStateSelect(index)}
                onMouseEnter={() => setHoveredNode(index)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
              >
                {/* Active glow ring */}
                {isActive && (
                  <circle
                    r={nodeRadius + 8}
                    fill="url(#walkerGlow)"
                    className="animate-pulse"
                  />
                )}

                {/* Node circle */}
                <circle
                  r={nodeRadius}
                  fill="#0f172a"
                  stroke={isActive ? '#38bdf8' : isHovered ? '#facc15' : state.color}
                  strokeWidth={isActive ? 3.5 : 2}
                  className="transition-all duration-200 shadow-md group-hover:scale-105"
                />

                {/* Inner color indicator dot */}
                <circle
                  cx={0}
                  cy={-nodeRadius + 10}
                  r={4}
                  fill={state.color}
                />

                {/* State Code / Abbreviation */}
                <text
                  x={0}
                  y={1}
                  textAnchor="middle"
                  fill="#f8fafc"
                  className="text-xs font-bold font-mono-code select-none pointer-events-none"
                >
                  {state.code}
                </text>

                {/* State full name */}
                <text
                  x={0}
                  y={15}
                  textAnchor="middle"
                  fill="#94a3b8"
                  className="text-[9px] font-medium select-none pointer-events-none truncate max-w-[50px]"
                >
                  {state.name.length > 8 ? state.name.slice(0, 8) + '…' : state.name}
                </text>

                {/* Active State Badge */}
                {isActive && (
                  <g transform={`translate(0, ${nodeRadius + 14})`}>
                    <rect
                      x={-34}
                      y={-8}
                      width={68}
                      height={16}
                      rx={3}
                      fill="#0284c7"
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="text-[9px] font-bold tracking-wider uppercase select-none"
                    >
                      ● OCUPADO
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating guidance helper */}
        <div className="absolute bottom-2 left-3 text-[11px] text-slate-500 pointer-events-none flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>Arrastra los nodos para moverlos · Haz clic en un nodo para posicionar el caminante</span>
        </div>
      </div>
    </div>
  );
};
