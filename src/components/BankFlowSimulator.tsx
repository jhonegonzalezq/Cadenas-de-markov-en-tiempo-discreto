import React, { useState, useMemo } from 'react';
import { MarkovState } from '../types/markov';
import { MathFormula } from './MathFormula';
import {
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BankFlowSimulatorProps {
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

export const BankFlowSimulator: React.FC<BankFlowSimulatorProps> = ({
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
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [bankingPolicy, setBankingPolicy] = useState<'normal' | 'digital' | 'estricto'>('normal');

  // Policy-modified matrix
  const effectiveMatrix = useMemo(() => {
    const copy = transitionMatrix.map(row => [...row]);
    if (bankingPolicy === 'digital') {
      // Kioscos de autoservicio: menos gente en ventanilla CAJ, casi nula deserción en lobby
      if (copy[0]) {
        copy[0][1] = 0.20; // baja carga en caja
        copy[0][2] = 0.65; // más asesoría comercial
        copy[0][6] = 0.02; // casi cero abandono en lobby
        copy[0][0] = 0.13;
      }
      if (copy[2]) {
        copy[2][3] = 0.75; // solicitudes mejor perfiladas van a riesgo
        copy[2][6] = 0.10;
      }
    } else if (bankingPolicy === 'estricto') {
      // Política de riesgo estricta: comite de riesgo rechaza fuertemente pero morosidad colapsa
      if (copy[3]) {
        copy[3][4] = 0.30; // solo 30% aprobado
        copy[3][6] = 0.50; // 50% rechazado
        copy[3][3] = 0.20;
      }
      if (copy[4]) {
        copy[4][5] = 0.05; // morosidad casi nula
        copy[4][6] = 0.85;
      }
    }
    return copy;
  }, [transitionMatrix, bankingPolicy]);

  const executeStep = () => {
    const from = currentStateIndex;
    const row = effectiveMatrix[from] || transitionMatrix[from] || [];
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

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        executeStep();
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, currentStateIndex, effectiveMatrix]);

  const activeState = states[currentStateIndex] || states[0];

  // Specific banking KPIs calculated from stationary distribution
  const kpis = useMemo(() => {
    const pLleg = stationaryDistribution[0] ?? 0;
    const pCaj = stationaryDistribution[1] ?? 0;
    const pAses = stationaryDistribution[2] ?? 0;
    const pRies = stationaryDistribution[3] ?? 0;
    const pDesb = stationaryDistribution[4] ?? 0;
    const pMora = stationaryDistribution[5] ?? 0;
    const pSal = stationaryDistribution[6] ?? 0;

    return {
      lobbyCongestion: pLleg + pCaj,
      creditEngineWeight: pAses + pRies + pDesb,
      delinquencyRisk: pMora,
      effectiveConversion: pDesb / (pAses + pRies + 0.0001),
      cashFlowThroughput: pCaj,
    };
  }, [stationaryDistribution]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Ejercicio 2: Nivel Intermedio
                </span>
                <span className="text-xs font-mono-code text-slate-400">
                  Servicios Financieros & Banca · 7 Estados Estocásticos
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">
                Dinámica de Clientes, Colocación de Créditos y Riesgo en Sucursal Bancaria
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Modela la trayectoria completa del cliente bancario: desde su llegada al lobby y ventanilla,
                pasando por la postulación a créditos, evaluación en el comité de riesgo, desembolso efectivo,
                hasta la contingencia de cartera en mora y la recirculación de nuevos clientes.
              </p>
            </div>
          </div>

          {/* Quick Policy Selector */}
          <div className="flex flex-col gap-1.5 shrink-0 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-indigo-400" />
              Política Operativa
            </span>
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setBankingPolicy('normal')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  bankingPolicy === 'normal'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                Tradicional
              </button>
              <button
                onClick={() => setBankingPolicy('digital')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  bankingPolicy === 'digital'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
                title="Kioscos de autoservicio biométricos"
              >
                Autoservicio Digital
              </button>
              <button
                onClick={() => setBankingPolicy('estricto')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  bankingPolicy === 'estricto'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
                title="Política de riesgo crediticio restrictiva"
              >
                Riesgo Estricto
              </button>
            </div>
          </div>
        </div>

        {/* Real-time simulation bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono-code">
              <span className="text-slate-400">Paso Estocástico:</span>
              <span className="font-bold text-indigo-400">n = {currentStep}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Ubicación del Cliente:</span>
              <span
                className="px-2 py-0.5 rounded font-mono-code font-bold text-slate-950 text-[11px]"
                style={{ backgroundColor: activeState.color }}
              >
                {activeState.code}
              </span>
              <span className="text-slate-200 font-semibold">{activeState.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeStep}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Avanzar Turno (1 Paso)</span>
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition-colors ${
                isAutoPlaying
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isAutoPlaying ? 'animate-pulse' : ''}`} />
              <span>{isAutoPlaying ? 'Pausar Flujo' : 'Simulación Continua'}</span>
            </button>
            <button
              onClick={() => {
                setIsAutoPlaying(false);
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

      {/* Main 2-Zone Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Zone: Visual Banking Floorplan & Flow Animation (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Plano Operativo de la Sucursal & Flujo de Clientes
              </span>
            </div>
            <span className="text-[11px] font-mono-code text-slate-400">
              7 Áreas Funcionales Interconectadas
            </span>
          </div>

          {/* SVG Branch Map */}
          <div className="relative w-full h-[460px] bg-slate-950 rounded-lg border border-slate-800 p-3 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 700 460" className="w-full h-full">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Branch architectural zones */}
              {/* Lobby Area */}
              <rect x="30" y="30" width="180" height="380" rx="10" fill="url(#areaGradient)" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <text x="120" y="55" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">ZONA 1: LOBBY & ACCESO</text>

              {/* Service Desks (Caja & Asesores) */}
              <rect x="250" y="30" width="200" height="380" rx="10" fill="url(#areaGradient)" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <text x="350" y="55" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">ZONA 2: ATENCIÓN & CRÉDITO</text>

              {/* Backoffice (Riesgo, Desembolso, Cobranzas) */}
              <rect x="490" y="30" width="180" height="380" rx="10" fill="url(#areaGradient)" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <text x="580" y="55" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">ZONA 3: COMITÉ & CARTERA</text>

              {/* Transition lines with flow packets */}
              {effectiveMatrix[currentStateIndex]?.map((prob, targetIdx) => {
                if (prob < 0.05) return null;
                const s = states[currentStateIndex];
                const t = states[targetIdx];
                if (!s || !t) return null;
                const sx = s.x * 640 + 30;
                const sy = s.y * 380 + 40;
                const tx = t.x * 640 + 30;
                const ty = t.y * 380 + 40;

                return (
                  <g key={`flow-${currentStateIndex}-${targetIdx}`}>
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke={s.color}
                      strokeWidth={Math.max(1.5, prob * 6)}
                      strokeOpacity="0.6"
                      strokeDasharray="4 2"
                    />
                    <circle r="4" fill="#a5b4fc">
                      <animateMotion
                        path={`M ${sx} ${sy} L ${tx} ${ty}`}
                        dur={`${Math.max(0.6, 2 - prob * 1.5)}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Render the 7 States */}
              {states.map(s => {
                const px = s.x * 640 + 30;
                const py = s.y * 380 + 40;
                const isActive = s.id === currentStateIndex;

                return (
                  <g
                    key={s.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => onSelectState(s.id)}
                  >
                    {isActive && (
                      <circle
                        cx={px}
                        cy={py}
                        r="32"
                        fill={s.color}
                        opacity="0.3"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={px}
                      cy={py}
                      r={isActive ? 22 : 18}
                      fill={isActive ? s.color : '#0f172a'}
                      stroke={s.color}
                      strokeWidth={isActive ? 3 : 2}
                      filter={isActive ? 'url(#glow)' : undefined}
                    />
                    <text
                      x={px}
                      y={py + 4}
                      fill={isActive ? '#020617' : '#ffffff'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono-code select-none pointer-events-none"
                    >
                      {s.code}
                    </text>
                    <text
                      x={px}
                      y={py + (py > 220 ? -28 : 32)}
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none font-sans"
                    >
                      {s.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Active State Floating Pill */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeState.color }}
                />
                <div>
                  <span className="font-bold text-slate-200">{activeState.name}</span>
                  <span className="text-slate-400 text-[11px] ml-2 font-mono-code">
                    (Estado #{activeState.id})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right font-mono-code text-[11px]">
                <div>
                  <span className="text-slate-400">Ocupación Estacionaria π*:</span>{' '}
                  <strong className="text-indigo-400">
                    {((stationaryDistribution[activeState.id] ?? 0) * 100).toFixed(2)}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Zone: Decision Metrics & Managerial Rules (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Executive KPIs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Métricas Asintóticas de la Sucursal
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" /> Congestión Lobby & Caja
                </span>
                <strong className="text-cyan-400 font-mono-code text-sm">
                  {(kpis.lobbyCongestion * 100).toFixed(1)}%
                </strong>
                <span className="text-[10px] text-slate-500">Masa en espera o ventanilla</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-emerald-400" /> Motor de Crédito
                </span>
                <strong className="text-emerald-400 font-mono-code text-sm">
                  {(kpis.creditEngineWeight * 100).toFixed(1)}%
                </strong>
                <span className="text-[10px] text-slate-500">En asesoría, riesgo o desembolso</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-400" /> Tasa Morosidad (π_MORA)
                </span>
                <strong className="text-red-400 font-mono-code text-sm">
                  {(kpis.delinquencyRisk * 100).toFixed(2)}%
                </strong>
                <span className="text-[10px] text-slate-500">Cartera vencida no subsanada</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" /> Desembolso Exitoso
                </span>
                <strong className="text-indigo-400 font-mono-code text-sm">
                  {((stationaryDistribution[4] ?? 0) * 100).toFixed(1)}%
                </strong>
                <span className="text-[10px] text-slate-500">Créditos liquidados a clientes</span>
              </div>
            </div>
          </div>

          {/* Decision Rules for Bank Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              Criterios del Gerente de Operaciones Bancarias
            </h3>

            <div className="flex flex-col gap-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded flex flex-col gap-0.5">
                <strong className="text-amber-300 text-[11px]">1. Cuello de Botella en Caja (Ventanilla)</strong>
                <p className="text-[11px] text-slate-400">
                  Si <MathFormula math="\pi_{\text{CAJ}}^* > 0.25" />, los cajeros están saturados con transacciones de bajo valor (pagos de servicios). El gerente debe instalar kioscos de autoservicio para derivar clientes a Asesoría Comercial.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded flex flex-col gap-0.5">
                <strong className="text-sky-300 text-[11px]">2. Trade-Off Riesgo vs Colocación</strong>
                <p className="text-[11px] text-slate-400">
                  Aprobar con mayor laxitud en <MathFormula math="P_{\text{RIES} \to \text{DESB}}" /> incrementa la cuota de mercado en el corto plazo, pero eleva asintóticamente la probabilidad de cartera vencida <MathFormula math="\pi_{\text{MORA}}^*" /> obligando a constituir mayores provisiones.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded flex flex-col gap-0.5">
                <strong className="text-emerald-300 text-[11px]">3. Retención y Fidelización Post-Desembolso</strong>
                <p className="text-[11px] text-slate-400">
                  Tras recibir el crédito en DESB, el 75% amortiza y concluye. Un programa de cross-selling (tarjetas, seguros) recircula clientes directamente a Asesoría sin pasar por la fila del Lobby.
                </p>
              </div>
            </div>
          </div>

          {/* Outgoing Transitions Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col gap-2 text-xs">
            <span className="font-semibold text-slate-200">
              Rutas Salientes desde {activeState.name}:
            </span>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1 font-mono-code text-[11px]">
              {effectiveMatrix[activeState.id]?.map((p, idx) => {
                if (p === 0) return null;
                const target = states[idx];
                return (
                  <div
                    key={`p-${activeState.id}-${idx}`}
                    className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-slate-300">
                      → {target?.code} ({target?.name})
                    </span>
                    <strong className="text-indigo-400">{(p * 100).toFixed(1)}%</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
