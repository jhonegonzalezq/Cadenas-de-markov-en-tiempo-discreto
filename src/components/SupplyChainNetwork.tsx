import React, { useState } from 'react';
import { MarkovState } from '../types/markov';
import { MathFormula } from './MathFormula';
import {
  Truck,
  Factory,
  Building2,
  Store,
  Users,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface SupplyChainNetworkProps {
  states: MarkovState[];
  transitionMatrix: number[][];
  currentStateIndex: number;
  currentStep: number;
  initialDistribution: number[];
  stationaryDistribution: number[];
  onSelectPreset: (presetId: string) => void;
  selectedPresetId: string;
  onStep: (from: number, to: number) => void;
  onReset: () => void;
}

export const SupplyChainNetwork: React.FC<SupplyChainNetworkProps> = ({
  states,
  transitionMatrix,
  currentStateIndex,
  currentStep,
  initialDistribution,
  stationaryDistribution,
  onSelectPreset,
  selectedPresetId,
  onStep,
  onReset,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<number>(currentStateIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Group states by echelon
  const suppliers = states.slice(0, 3); // P1, P2, P3
  const plant = states[3]; // PLT
  const wholesaler = states[4]; // MAY
  const retailer = states[5]; // MIN
  const customers = states.slice(6, 16); // C1 to C10

  // Calculate echelon aggregates for stationary distribution
  const echelonStationary = {
    suppliers: (stationaryDistribution[0] ?? 0) + (stationaryDistribution[1] ?? 0) + (stationaryDistribution[2] ?? 0),
    plant: stationaryDistribution[3] ?? 0,
    wholesaler: stationaryDistribution[4] ?? 0,
    retailer: stationaryDistribution[5] ?? 0,
    customers: customers.reduce((acc, _, idx) => acc + (stationaryDistribution[6 + idx] ?? 0), 0),
  };

  // Perform one step
  const executeStep = () => {
    const from = currentStateIndex;
    const row = transitionMatrix[from] || [];
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
    if (isPlaying) {
      timer = setInterval(() => {
        executeStep();
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentStateIndex, transitionMatrix]);

  const activeNode = states[currentStateIndex] || states[0];
  const inspectedNode = states[selectedNodeId] || activeNode;

  return (
    <div className="flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header & Exercise Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Red Completa de Cadena de Suministro (3 Prov · 1 Planta · 1 Mayorista · 1 Minorista · 10 Clientes)
            </h3>
            <span className="text-[11px] text-slate-400">
              Visualización topológica multieslabón del proceso estocástico discreto
            </span>
          </div>
        </div>

        {/* Exercises Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onSelectPreset('cadena-suministro-flujo-directo')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              selectedPresetId === 'cadena-suministro-flujo-directo'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ejercicio 1: Flujo Directo de Pedidos
          </button>
          <button
            onClick={() => onSelectPreset('cadena-suministro-logistica-inversa')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              selectedPresetId === 'cadena-suministro-logistica-inversa'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ejercicio 2: Logística Inversa & Devoluciones
          </button>
        </div>
      </div>

      {/* Simulator Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Paso actual:</span>
            <span className="font-mono-code font-bold text-sky-400">n = {currentStep}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ubicación del Lote:</span>
            <span
              className="px-2 py-0.5 rounded font-mono-code font-bold text-slate-950"
              style={{ backgroundColor: activeNode.color }}
            >
              {activeNode.code}
            </span>
            <span className="text-slate-300 font-medium">{activeNode.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={executeStep}
            className="flex items-center gap-1 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Avanzar 1 Paso (P_{currentStateIndex}j)</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1 px-3 py-1 rounded font-medium transition-colors ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
            <span>{isPlaying ? 'Pausar' : 'Simulación Automática'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              onReset();
            }}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reiniciar al inicio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5 ECHELONS DIAGRAM */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
        {/* Echelon 1: 3 Suppliers */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
              <Factory className="w-3.5 h-3.5" />
              1. Proveedores (3)
            </span>
            <span className="text-[10px] font-mono-code text-cyan-300 font-semibold">
              {(echelonStationary.suppliers * 100).toFixed(1)}% WIP
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {suppliers.map(s => {
              const isActive = s.id === currentStateIndex;
              const isSelected = s.id === selectedNodeId;
              const probStationary = stationaryDistribution[s.id] ?? 0;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedNodeId(s.id)}
                  className={`w-full text-left p-2 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/50 shadow-md'
                      : isSelected
                      ? 'bg-slate-800/80 border-slate-600'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono-code text-xs font-bold text-cyan-300">
                      {s.code}
                    </span>
                    <span className="text-[10px] font-mono-code text-slate-400">
                      π*={(probStationary * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-tight truncate">
                    {s.name}
                  </div>
                  {isActive && (
                    <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider text-cyan-400 animate-pulse">
                      ● Lote Presente
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Echelon 2: 1 Plant */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              2. Planta (1)
            </span>
            <span className="text-[10px] font-mono-code text-purple-300 font-semibold">
              {(echelonStationary.plant * 100).toFixed(1)}% WIP
            </span>
          </div>

          <div className="h-full flex flex-col justify-center">
            {plant && (
              <button
                onClick={() => setSelectedNodeId(plant.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  plant.id === currentStateIndex
                    ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-400/50 shadow-md'
                    : plant.id === selectedNodeId
                    ? 'bg-slate-800/80 border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-code text-xs font-bold text-purple-300">
                    {plant.code}
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    π*={((stationaryDistribution[plant.id] ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 font-medium mb-1">
                  {plant.name}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Centro de manufactura, ensamble y control de calidad.
                </p>
                {plant.id === currentStateIndex && (
                  <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wider text-purple-400 animate-pulse">
                    ● En Producción
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Echelon 3: 1 Wholesaler */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              3. Mayorista (1)
            </span>
            <span className="text-[10px] font-mono-code text-pink-300 font-semibold">
              {(echelonStationary.wholesaler * 100).toFixed(1)}% WIP
            </span>
          </div>

          <div className="h-full flex flex-col justify-center">
            {wholesaler && (
              <button
                onClick={() => setSelectedNodeId(wholesaler.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  wholesaler.id === currentStateIndex
                    ? 'bg-pink-950/80 border-pink-400 ring-2 ring-pink-400/50 shadow-md'
                    : wholesaler.id === selectedNodeId
                    ? 'bg-slate-800/80 border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-code text-xs font-bold text-pink-300">
                    {wholesaler.code}
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    π*={((stationaryDistribution[wholesaler.id] ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 font-medium mb-1">
                  {wholesaler.name}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Centro de Distribución (CD) de alta capacidad y cross-docking.
                </p>
                {wholesaler.id === currentStateIndex && (
                  <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wider text-pink-400 animate-pulse">
                    ● En Almacén Central
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Echelon 4: 1 Retailer */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              4. Minorista (1)
            </span>
            <span className="text-[10px] font-mono-code text-amber-300 font-semibold">
              {(echelonStationary.retailer * 100).toFixed(1)}% WIP
            </span>
          </div>

          <div className="h-full flex flex-col justify-center">
            {retailer && (
              <button
                onClick={() => setSelectedNodeId(retailer.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  retailer.id === currentStateIndex
                    ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                    : retailer.id === selectedNodeId
                    ? 'bg-slate-800/80 border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-code text-xs font-bold text-amber-300">
                    {retailer.code}
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    π*={((stationaryDistribution[retailer.id] ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 font-medium mb-1">
                  {retailer.name}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Punto de venta y distribución capilar al consumidor.
                </p>
                {retailer.id === currentStateIndex && (
                  <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wider text-amber-400 animate-pulse">
                    ● En Tienda Retail
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Echelon 5: 10 Customers */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              5. Clientes (10)
            </span>
            <span className="text-[10px] font-mono-code text-emerald-300 font-semibold">
              {(echelonStationary.customers * 100).toFixed(1)}% WIP
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {customers.map((c, idx) => {
              const nodeIdx = 6 + idx;
              const isActive = nodeIdx === currentStateIndex;
              const isSelected = nodeIdx === selectedNodeId;
              const probStationary = stationaryDistribution[nodeIdx] ?? 0;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedNodeId(nodeIdx)}
                  className={`w-full text-left px-2 py-1 rounded border text-[11px] transition-all ${
                    isActive
                      ? 'bg-emerald-950/90 border-emerald-400 ring-1 ring-emerald-400 shadow-sm'
                      : isSelected
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-slate-950/40 border-slate-800/70 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code font-bold text-emerald-300">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-mono-code text-slate-400">
                      {(probStationary * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 truncate">
                    {c.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aggregate Echelon WIP / Probability Mass Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200">
            Distribución Estacionaria Agregada por Eslabón (Acumulación de WIP en Estado Estable)
          </span>
          <span className="text-[11px] text-slate-400 font-mono-code">
            <MathFormula math="\sum_{k=1}^5 \Pi_k = 1.0" />
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
          <div
            className="bg-cyan-500 h-full transition-all duration-300"
            style={{ width: `${echelonStationary.suppliers * 100}%` }}
            title={`Proveedores: ${(echelonStationary.suppliers * 100).toFixed(1)}%`}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-300"
            style={{ width: `${echelonStationary.plant * 100}%` }}
            title={`Planta: ${(echelonStationary.plant * 100).toFixed(1)}%`}
          />
          <div
            className="bg-pink-500 h-full transition-all duration-300"
            style={{ width: `${echelonStationary.wholesaler * 100}%` }}
            title={`Mayorista: ${(echelonStationary.wholesaler * 100).toFixed(1)}%`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${echelonStationary.retailer * 100}%` }}
            title={`Minorista: ${(echelonStationary.retailer * 100).toFixed(1)}%`}
          />
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${echelonStationary.customers * 100}%` }}
            title={`Clientes: ${(echelonStationary.customers * 100).toFixed(1)}%`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono-code text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>Proveedores: {(echelonStationary.suppliers * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Planta: {(echelonStationary.plant * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span>Mayorista: {(echelonStationary.wholesaler * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Minorista: {(echelonStationary.retailer * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>10 Clientes: {(echelonStationary.customers * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Selected Node Transition Probabilities Inspector */}
      {inspectedNode && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-200">
                Vector de Transición Saliente desde {inspectedNode.name} ({inspectedNode.code})
              </span>
            </div>
            <span className="text-[11px] font-mono-code text-slate-400">
              Fila P_{inspectedNode.id},*
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {transitionMatrix[inspectedNode.id]?.map((prob, targetIdx) => {
              if (prob === 0) return null;
              const targetNode = states[targetIdx];
              return (
                <div
                  key={`trans-${inspectedNode.id}-${targetIdx}`}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 text-center"
                >
                  <span className="text-[10px] text-slate-400 block font-mono-code truncate">
                    Hacia {targetNode?.code}
                  </span>
                  <strong className="text-xs font-bold text-sky-300 font-mono-code">
                    {(prob * 100).toFixed(1)}%
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mathematical Evaluation Callout for Students */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 text-xs leading-relaxed text-slate-300">
        <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Evaluación Teórica & Formal en Cadena de Suministro Multieslabón
        </h4>
        <p>
          En este modelo de 16 estados, el sistema de balance global{' '}
          <MathFormula math="\pi = \pi P" /> equivale a un sistema algebraico lineal de 17 ecuaciones con 16 incógnitas:
        </p>
        <div className="p-2 bg-slate-900 rounded font-mono-code text-[11px] text-sky-300">
          <MathFormula
            math="\pi_j = \sum_{i=0}^{15} \pi_i P_{ij}, \quad \forall j \in \{0, \dots, 15\} \quad \text{con} \quad \sum_{j=0}^{15} \pi_j = 1"
            block
          />
        </div>
        <p>
          <strong className="text-sky-300">Interpretación en Operaciones & Logística:</strong>
          {' '}El vector estacionario <MathFormula math="\pi^*" /> no representa únicamente probabilidades abstractas, sino la{' '}
          <strong>fracción de inventario en proceso (Work-In-Process)</strong> que reside en cada estación a largo plazo por la Ley de Little. Si{' '}
          <MathFormula math="\pi_{\text{PLT}}^* > \pi_{\text{MAY}}^*" />, la planta de manufactura acumula más tiempo de ciclo y constituye el cuello de botella estructural del sistema.
        </p>
      </div>
    </div>
  );
};
