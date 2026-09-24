import React, { useState, useMemo } from 'react';
import { MarkovState } from '../types/markov';
import { MathFormula } from './MathFormula';
import {
  MapPin,
  Truck,
  Store,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  DollarSign,
  TrendingUp,
  Layers,
  ShieldAlert,
  ArrowRight,
  Clock,
  Compass,
} from 'lucide-react';

interface AgroSupplyChainProps {
  states: MarkovState[];
  transitionMatrix: number[][];
  stationaryDistribution: number[];
  currentStateIndex: number;
  currentStep: number;
  onStep: (from: number, to: number) => void;
  onReset: () => void;
  onSelectState: (index: number) => void;
}

export const AgroSupplyChainColombia: React.FC<AgroSupplyChainProps> = ({
  states,
  transitionMatrix,
  stationaryDistribution,
  currentStateIndex,
  currentStep,
  onStep,
  onReset,
  onSelectState,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<number>(currentStateIndex);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [simulatedScenario, setSimulatedScenario] = useState<'normal' | 'bloqueo_linea' | 'paro_sur'>('normal');

  // Filter 5 crops, 3 wholesale markets, 10 neighborhood stores
  const crops = useMemo(() => states.slice(0, 5), [states]);
  const markets = useMemo(() => states.slice(5, 8), [states]);
  const stores = useMemo(() => states.slice(8, 18), [states]);

  // Dynamic adjusted matrix for scenarios
  const effectiveMatrix = useMemo(() => {
    const copy = transitionMatrix.map(row => [...row]);
    if (simulatedScenario === 'bloqueo_linea') {
      // Bloqueo en La Línea (dificulta paso entre Bogotá y Occidente/Cali)
      // Tunja y Villapinzón envían menos al occidente y más a Corabastos
      copy[0][5] = 0.85; // más a Bogotá
      copy[0][6] = 0.05;
      copy[0][7] = 0.00; // bloqueado a Cali
      // Cavasa debe acopiar más de Cauca y Nariño
      copy[2][7] = 0.80; // Pasto todo a Cali
      copy[2][5] = 0.05; // poco a Bogotá
    } else if (simulatedScenario === 'paro_sur') {
      // Paro en Vía Panamericana (Nariño y Cauca aislados)
      copy[2][2] = 0.70; // queda retenido en finca (riesgo merma severo)
      copy[2][7] = 0.20;
      copy[2][5] = 0.10;
      copy[4][4] = 0.65;
      copy[4][7] = 0.30;
      copy[4][5] = 0.05;
    }
    return copy;
  }, [transitionMatrix, simulatedScenario]);

  // Aggregate stationary mass by tier
  const echelonWip = useMemo(() => {
    const cropsMass = crops.reduce((acc, c) => acc + (stationaryDistribution[c.id] ?? 0), 0);
    const marketsMass = markets.reduce((acc, m) => acc + (stationaryDistribution[m.id] ?? 0), 0);
    const storesMass = stores.reduce((acc, s) => acc + (stationaryDistribution[s.id] ?? 0), 0);
    return {
      crops: cropsMass,
      markets: marketsMass,
      stores: storesMass,
      corabastos: stationaryDistribution[5] ?? 0,
      medellin: stationaryDistribution[6] ?? 0,
      cavasa: stationaryDistribution[7] ?? 0,
    };
  }, [crops, markets, stores, stationaryDistribution]);

  // Perform one step along the Markov chain
  const executeStep = () => {
    const from = currentStateIndex;
    const row = effectiveMatrix[from] || [];
    const r = Math.random();
    let cum = 0;
    let next = from;
    for (let j = 0; j < row.length; j++) {
      cum += row[j];
      if (r <= cum) {
        next = j;
        break;
      }
    }
    onStep(from, next);
    setSelectedNodeId(next);
  };

  // Auto-play interval
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoSimulating) {
      timer = setInterval(() => {
        executeStep();
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isAutoSimulating, currentStateIndex, effectiveMatrix]);

  const activeNode = states[currentStateIndex] || states[0];
  const inspectedNode = states[selectedNodeId] || activeNode;

  // Convert geographic coords (Lat, Lng) to SVG coordinates inside Colombia's bounding box
  // Lat: ~0.5 to 11.5 N, Lng: -78.5 to -71.5 W
  const projectGeoToSvg = (lat: number, lng: number) => {
    const minLat = 0.5;
    const maxLat = 11.5;
    const minLng = -78.5;
    const maxLng = -71.5;

    const x = ((lng - minLng) / (maxLng - minLng)) * 360 + 20;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 480 + 30;
    return { x, y };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Contexto Agroalimentario & Criterio Directivo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cadena Agroalimentaria de Colombia
                </span>
                <span className="text-xs font-mono-code text-slate-400">
                  Tubérculo Papa · 18 Estados Estocásticos
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">
                Evaluación en Tiempo Discreto: 5 Cultivos · 3 Plazas Mayoristas · 10 Tiendas de Barrio
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Modelo estocástico multieslabón que describe el flujo de papa desde las parcelas agrícolas
                (Boyacá, Cundinamarca, Nariño, Antioquia, Cauca) hacia los centros de abasto mayoristas (Corabastos,
                Central de Antioquia, Cavasa) y el despacho final a tenderos de barrio.
              </p>
            </div>
          </div>

          {/* Quick Scenario Selector */}
          <div className="flex flex-col gap-1.5 shrink-0 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              Escenario Logístico
            </span>
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setSimulatedScenario('normal')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  simulatedScenario === 'normal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSimulatedScenario('bloqueo_linea')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  simulatedScenario === 'bloqueo_linea'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
                title="Derrumbe / Cierre de Paso en La Línea"
              >
                Cierre La Línea
              </button>
              <button
                onClick={() => setSimulatedScenario('paro_sur')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  simulatedScenario === 'paro_sur'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
                title="Bloqueo Vía Panamericana en Cauca/Nariño"
              >
                Bloqueo Sur
              </button>
            </div>
          </div>
        </div>

        {/* Real-time simulation bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono-code">
              <span className="text-slate-400">Paso estocástico:</span>
              <span className="font-bold text-amber-400">n = {currentStep}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Ubicación del Envío:</span>
              <span
                className="px-2 py-0.5 rounded font-mono-code font-bold text-slate-950 text-[11px]"
                style={{ backgroundColor: activeNode.color }}
              >
                {activeNode.code}
              </span>
              <span className="text-slate-200 font-semibold">{activeNode.name}</span>
              <span className="text-slate-400 font-mono-code text-[11px]">
                ({activeNode.department || activeNode.city})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeStep}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-colors shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Despachar Lote (1 Paso)</span>
            </button>
            <button
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition-colors ${
                isAutoSimulating
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isAutoSimulating ? 'animate-pulse' : ''}`} />
              <span>{isAutoSimulating ? 'Pausar Flujo' : 'Simulación Continua'}</span>
            </button>
            <button
              onClick={() => {
                setIsAutoSimulating(false);
                onReset();
              }}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Zone Layout: Interactive Colombian Map (Left) + Decision Deck (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map of Colombia (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Geografía Operativa de la Cadena de la Papa en Colombia
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono-code">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> 5 Cultivos
              </span>
              <span className="flex items-center gap-1 text-pink-400">
                <span className="w-2 h-2 rounded-full bg-pink-400" /> 3 Plazas
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> 10 Tiendas
              </span>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full h-[520px] bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
            <svg
              viewBox="0 0 400 540"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.5))' }}
            >
              {/* Background Map Contours of Colombia (Stylized Vector) */}
              <defs>
                <linearGradient id="colombiaBg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Simplified Colombia polygon silhouette */}
              <path
                d="M 120 40 
                   Q 150 25 185 20 
                   Q 220 18 240 45 
                   Q 230 80 260 110 
                   Q 290 140 330 180 
                   Q 350 220 340 280 
                   Q 330 330 310 390 
                   Q 280 460 250 510 
                   Q 220 520 190 470 
                   Q 150 440 120 410 
                   Q 80 390 70 340 
                   Q 60 290 85 240 
                   Q 75 190 90 140 
                   Q 100 90 120 40 Z"
                fill="url(#colombiaBg)"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              {/* Highway Corridors / Traces */}
              {/* Boyacá / Cundinamarca -> Bogotá */}
              <path
                d="M 230 180 Q 215 220 195 250"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              {/* Nariño / Cauca -> Cali (Vía Panamericana) */}
              <path
                d="M 120 440 Q 135 370 145 320"
                fill="none"
                stroke={simulatedScenario === 'paro_sur' ? '#ef4444' : '#38bdf8'}
                strokeWidth={simulatedScenario === 'paro_sur' ? '2' : '1.2'}
                strokeDasharray={simulatedScenario === 'paro_sur' ? '1 4' : '3 3'}
                opacity="0.8"
              />
              {/* Bogotá <-> Medellín <-> Cali (La Línea Corridor) */}
              <path
                d="M 195 250 Q 170 240 155 210 Q 140 270 145 320"
                fill="none"
                stroke={simulatedScenario === 'bloqueo_linea' ? '#ef4444' : '#64748b'}
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.7"
              />

              {/* Transit Packets Animation between Active Node and Target Nodes */}
              {effectiveMatrix[currentStateIndex]?.map((prob, targetIdx) => {
                if (prob < 0.05) return null;
                const source = states[currentStateIndex];
                const target = states[targetIdx];
                if (!source?.geo || !target?.geo) return null;
                const sCoord = projectGeoToSvg(source.geo.lat, source.geo.lng);
                const tCoord = projectGeoToSvg(target.geo.lat, target.geo.lng);

                return (
                  <g key={`flow-${currentStateIndex}-${targetIdx}`}>
                    <line
                      x1={sCoord.x}
                      y1={sCoord.y}
                      x2={tCoord.x}
                      y2={tCoord.y}
                      stroke={source.color}
                      strokeWidth={Math.max(1, prob * 5)}
                      strokeOpacity="0.6"
                      strokeDasharray="4 2"
                    />
                    {/* Animated moving particle */}
                    <circle r="3.5" fill="#fde047">
                      <animateMotion
                        path={`M ${sCoord.x} ${sCoord.y} L ${tCoord.x} ${tCoord.y}`}
                        dur={`${Math.max(0.6, 2 - prob * 1.5)}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Render 5 Crops (Cyan / Blue markers) */}
              {crops.map(c => {
                if (!c.geo) return null;
                const { x, y } = projectGeoToSvg(c.geo.lat, c.geo.lng);
                const isActive = c.id === currentStateIndex;
                const isSelected = c.id === selectedNodeId;

                return (
                  <g
                    key={c.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => {
                      setSelectedNodeId(c.id);
                      onSelectState(c.id);
                    }}
                  >
                    {isActive && (
                      <circle cx={x} cy={y} r="18" fill={c.color} opacity="0.3" className="animate-ping" />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 8 : 6}
                      fill={c.color}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={x + 10}
                      y={y + 3}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      className="select-none font-mono-code"
                    >
                      {c.code}
                    </text>
                  </g>
                );
              })}

              {/* Render 3 Wholesale Hubs (Pink / Purple Markers) */}
              {markets.map(m => {
                if (!m.geo) return null;
                const { x, y } = projectGeoToSvg(m.geo.lat, m.geo.lng);
                const isActive = m.id === currentStateIndex;
                const isSelected = m.id === selectedNodeId;

                return (
                  <g
                    key={m.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => {
                      setSelectedNodeId(m.id);
                      onSelectState(m.id);
                    }}
                  >
                    <circle cx={x} cy={y} r="22" fill="url(#hubGlow)" />
                    {isActive && (
                      <circle cx={x} cy={y} r="20" fill={m.color} opacity="0.4" className="animate-pulse" />
                    )}
                    <rect
                      x={x - 8}
                      y={y - 8}
                      width="16"
                      height="16"
                      rx="3"
                      fill={m.color}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={x}
                      y={y + 3}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="7.5"
                      fontWeight="bold"
                      className="select-none font-mono-code pointer-events-none"
                    >
                      PLZ
                    </text>
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      fill="#f472b6"
                      fontSize="9"
                      fontWeight="bold"
                      className="select-none font-mono-code"
                    >
                      {m.code}
                    </text>
                  </g>
                );
              })}

              {/* Render 10 Neighborhood Stores (Emerald small clusters) */}
              {stores.map(s => {
                if (!s.geo) return null;
                const { x, y } = projectGeoToSvg(s.geo.lat, s.geo.lng);
                // Slight scatter offset to distinguish stores in the same city
                const offsetIdx = s.id - 8;
                const dx = ((offsetIdx % 3) - 1) * 11;
                const dy = (Math.floor(offsetIdx / 3) - 1.5) * 11;
                const px = x + dx;
                const py = y + dy;

                const isActive = s.id === currentStateIndex;
                const isSelected = s.id === selectedNodeId;

                return (
                  <g
                    key={s.id}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => {
                      setSelectedNodeId(s.id);
                      onSelectState(s.id);
                    }}
                  >
                    <circle
                      cx={px}
                      cy={py}
                      r={isActive ? 6 : 4}
                      fill={s.color}
                      stroke={isSelected ? '#ffffff' : '#047857'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating City Reference Badges */}
            <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 p-2 rounded text-[10px] flex flex-col gap-1 backdrop-blur-sm">
              <span className="font-bold text-slate-300">Ciudades Destino:</span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded bg-pink-500" />
                <span>Bogotá D.C. (Corabastos)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded bg-rose-500" />
                <span>Medellín (Central Mayorista)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded bg-purple-500" />
                <span>Cali (Cavasa)</span>
              </div>
            </div>

            {/* Active Node Floating HUD */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: inspectedNode.color }}
                />
                <div>
                  <span className="font-bold text-slate-200">{inspectedNode.name}</span>
                  <span className="text-slate-400 text-[11px] ml-2">
                    {inspectedNode.varietyOrType} · {inspectedNode.capacityOrDemand}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 block">Precio Ref:</span>
                  <span className="font-mono-code font-bold text-emerald-400">
                    ${inspectedNode.pricePerKg?.toLocaleString() || 'N/A'}/kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Estacionario π*:</span>
                  <span className="font-mono-code font-bold text-sky-400">
                    {((stationaryDistribution[inspectedNode.id] ?? 0) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Decision Deck for the Supply Chain Director (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Echelon Aggregate Inventory Bar (WIP) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Acumulación de Inventario Estacionario (WIP)
              </span>
              <span className="font-mono-code text-[11px] text-slate-400">
                <MathFormula math="\sum \pi_i^* = 1.0" />
              </span>
            </div>

            {/* Progress Stack */}
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: `${echelonWip.crops * 100}%` }}
                title={`Cultivos: ${(echelonWip.crops * 100).toFixed(1)}%`}
              />
              <div
                className="bg-pink-500 h-full transition-all duration-300"
                style={{ width: `${echelonWip.markets * 100}%` }}
                title={`Plazas Mayoristas: ${(echelonWip.markets * 100).toFixed(1)}%`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${echelonWip.stores * 100}%` }}
                title={`Tiendas de Barrio: ${(echelonWip.stores * 100).toFixed(1)}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">5 Cultivos</span>
                <strong className="text-cyan-400 font-mono-code">
                  {(echelonWip.crops * 100).toFixed(1)}%
                </strong>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">3 Plazas</span>
                <strong className="text-pink-400 font-mono-code">
                  {(echelonWip.markets * 100).toFixed(1)}%
                </strong>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">10 Tiendas</span>
                <strong className="text-emerald-400 font-mono-code">
                  {(echelonWip.stores * 100).toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Criterios Clave del Director de Supply Chain */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              Decisiones Gerenciales del Director de Supply Chain
            </h3>

            <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
              {/* Criterio 1: Perecibilidad y Riesgo de Merma */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    1. Perecibilidad & Merma Postcosecha
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    Vida útil: 15-21 días
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  La papa no tolera tiempos prolongados de retención. Si la masa en Corabastos o Cavasa{' '}
                  <MathFormula math="\pi_{\text{Plaza}}^*" /> supera el <strong>15%</strong>, la congestión en muelles
                  provoca brotado y pudrición bacteriana, aumentando la merma del 5% al 18%.
                </p>
              </div>

              {/* Criterio 2: Cuello de Botella en Centros de Acopio */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-300 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    2. Margen y Costo Logístico Integrado
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    Flete + Margen
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pasto tiene el menor costo en finca ($1.650/kg) pero el mayor flete hacia Bogotá ($450/kg).
                  El Director evalúa la matriz de transición para garantizar que el precio final al tendero
                  ($3.200 - $3.400/kg) cubra la merma y maximice el retorno del agricultor.
                </p>
              </div>

              {/* Criterio 3: Resiliencia ante Bloqueos Viales */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    3. Resiliencia ante Disrupción de Vías
                  </span>
                  <span className="text-[10px] font-mono-code text-amber-400">
                    {simulatedScenario === 'normal' ? 'Operación Normal' : 'Disrupción Activa'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Un derrumbe en La Línea redistribuye las probabilidades: Bogotá debe abastecerse en un 85% de Boyacá y
                  Cundinamarca, encareciendo el precio por escasez de oferta y saturando las bodegas de Nariño.
                </p>
              </div>
            </div>
          </div>

          {/* Active Node Outgoing Probabilities Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-200">
                Vector Saliente <MathFormula math={`P_{${inspectedNode.id},*}`} /> desde {inspectedNode.name}
              </span>
              <span className="text-[10px] font-mono-code text-slate-400">
                {inspectedNode.tierLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
              {effectiveMatrix[inspectedNode.id]?.map((prob, targetIdx) => {
                if (prob === 0) return null;
                const targetNode = states[targetIdx];
                return (
                  <div
                    key={`p-${inspectedNode.id}-${targetIdx}`}
                    className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-slate-300 truncate max-w-[130px]">
                      {targetNode?.code} - {targetNode?.city || targetNode?.name}
                    </span>
                    <strong className="text-sky-300 font-mono-code">
                      {(prob * 100).toFixed(1)}%
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Structured Comparison Table for the 18 Nodes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Matriz de Parámetros Operativos: 5 Cultivos · 3 Plazas · 10 Tiendas
          </span>
          <span className="text-[11px] text-slate-400 font-mono-code">
            18 Nodos Interconectados en Tiempo Discreto
          </span>
        </div>

        <div className="overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-mono-code text-slate-300 border-collapse">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-2 text-slate-400">Código</th>
                <th className="p-2 text-slate-400">Nombre / Nodo</th>
                <th className="p-2 text-slate-400">Ubicación / Ciudad</th>
                <th className="p-2 text-slate-400">Eslabón</th>
                <th className="p-2 text-slate-400">Capacidad / Demanda</th>
                <th className="p-2 text-slate-400">Precio Ref ($/kg)</th>
                <th className="p-2 text-right text-slate-400">Prob. Estacionaria π*</th>
              </tr>
            </thead>
            <tbody>
              {states.map(s => {
                const prob = stationaryDistribution[s.id] ?? 0;
                const isSelected = s.id === selectedNodeId;
                const isActive = s.id === currentStateIndex;

                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedNodeId(s.id)}
                    className={`border-b border-slate-800/40 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-amber-950/40 text-amber-200'
                        : isSelected
                        ? 'bg-slate-800/60'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="p-2 font-bold flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.code}
                    </td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-slate-400">{s.department || s.city}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {s.tierLabel}
                      </span>
                    </td>
                    <td className="p-2 text-slate-300">{s.capacityOrDemand}</td>
                    <td className="p-2 text-emerald-400">
                      ${s.pricePerKg?.toLocaleString() || '-'}
                    </td>
                    <td className="p-2 text-right font-bold text-sky-400">
                      {(prob * 100).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
