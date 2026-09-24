import React, { useState } from 'react';
import { MathFormula } from './MathFormula';
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  TrendingUp,
  Target,
  SlidersHorizontal,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const DocenteTheoryGuide: React.FC = () => {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const sections = [
    {
      id: 'axiomas',
      title: '1. Fundamento Axiomático & Proceso Estocástico en Tiempo Discreto (DTMC)',
      badge: 'Definición Formal',
      summary: 'Espacio de probabilidad, filtración natural y propiedad de Markov sin memoria.',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          <p>
            Sea <MathFormula math="(\Omega, \mathcal{F}, \mathbb{P})" /> un espacio de probabilidad equipado con una filtración natural{' '}
            <MathFormula math="\mathbb{F} = \{\mathcal{F}_n\}_{n \in \mathbb{N}_0}" />, donde{' '}
            <MathFormula math="\mathcal{F}_n = \sigma(X_0, X_1, \dots, X_n)" /> almacena el historial de trayectorias hasta la etapa <MathFormula math="n" />.
            Sea <MathFormula math="S = \{s_1, s_2, \dots, s_K\}" /> un espacio de estados discreto y finito.
          </p>
          <div className="bg-slate-900 border-l-2 border-sky-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="\mathbb{P}(X_{n+1} = s_j \mid \mathcal{F}_n) = \mathbb{P}(X_{n+1} = s_j \mid X_n = s_i) = P_{ij}"
              block
            />
          </div>
          <p>
            <strong className="text-sky-300">Propiedad Débil de Markov (Falta de Memoria):</strong> Condicional al estado presente{' '}
            <MathFormula math="X_n" />, el estado futuro <MathFormula math="X_{n+1}" /> y el pasado{' '}
            <MathFormula math="\mathcal{F}_{n-1}" /> son condicionalmente independientes.
            Decimos que la cadena es <strong>temporalmente homogénea</strong> si la probabilidad condicional de transición no depende del instante cronológico <MathFormula math="n" />.
          </p>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 font-mono-code flex items-center justify-between">
            <span>Condición Estocástica de Fila:</span>
            <MathFormula math="\forall i \in S: P_{ij} \ge 0, \quad \sum_{j \in S} P_{ij} = 1" />
          </div>
        </div>
      ),
    },
    {
      id: 'etapa1',
      title: '2. Transición de Una Etapa (n = 1): Álgebra Lineal & Probabilidad Total',
      badge: '1 Etapa (n=1)',
      summary: 'Deducción componente a componente de π⁽¹⁾ = π⁽⁰⁾ · P e impacto operativo inmediato.',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          <p>
            Al proyectar el sistema desde el instante <MathFormula math="t=0" /> hacia el siguiente horizonte inmediato{' '}
            <MathFormula math="t=1" />, aplicamos rigurosamente la <strong>Ley de Probabilidad Total</strong> particionando el espacio muestral según los estados iniciales posibles:
          </p>
          <div className="bg-slate-900 border-l-2 border-sky-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="\pi_j^{(1)} = \mathbb{P}(X_1 = s_j) = \sum_{i=1}^K \mathbb{P}(X_0 = s_i) \cdot \mathbb{P}(X_1 = s_j \mid X_0 = s_i) = \sum_{i=1}^K \pi_i^{(0)} P_{ij}"
              block
            />
          </div>
          <p>
            En lenguaje de operadores y álgebra matricial, el vector fila de probabilidades no condicionadas{' '}
            <MathFormula math="\pi^{(1)} \in \mathbb{R}^{1 \times K}" /> resulta de la multiplicación vectorial directa:
          </p>
          <div className="bg-slate-900 border-l-2 border-sky-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula math="\pi^{(1)} = \pi^{(0)} \cdot P" block />
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-1.5">
            <strong className="text-sky-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              Significado en Toma de Decisiones Operativas (Impacto a 1 Etapa):
            </strong>
            <p className="text-[11px] text-slate-400">
              Permite calcular de forma determinística el <em>riesgo operativo al día siguiente</em>.
              Si <MathFormula math="c \in \mathbb{R}^K" /> es el vector de costos unitarios de penalización por estado (parada de máquina, mora bancaria, pudrición en plaza),
              el costo esperado inmediato es:
            </p>
            <div className="text-center font-mono-code text-emerald-400 text-xs">
              <MathFormula math="\mathbb{E}[C_1] = \pi^{(1)} \cdot \mathbf{c} = \sum_{j=1}^K \pi_j^{(1)} c_j" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'etapan',
      title: '3. Transición a n Etapas (n ≥ 1): Ecuaciones de Chapman-Kolmogorov & Perron-Frobenius',
      badge: 'n Etapas (n ≥ 1)',
      summary: 'Potencias Pⁿ, semigrupo discreto, descomposición espectral y cota geométrica de convergencia |λ₂|ⁿ.',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          <p>
            <strong>Teorema de Chapman-Kolmogorov:</strong> Para todo horizonte <MathFormula math="n = m + k" /> con{' '}
            <MathFormula math="m, k \in \mathbb{N}" />, la probabilidad condicional de transición en <MathFormula math="n" /> pasos satisface:
          </p>
          <div className="bg-slate-900 border-l-2 border-indigo-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="P_{ij}^{(m+k)} = \sum_{r \in S} P_{ir}^{(m)} P_{rj}^{(k)} \implies P^{(m+k)} = P^m \cdot P^k"
              block
            />
          </div>
          <p>
            Por inducción matemática estricta sobre <MathFormula math="n" />, la matriz de transición en <MathFormula math="n" /> etapas es exactamente la{' '}
            <strong>n-ésima potencia de la matriz estocástica P</strong>:
          </p>
          <div className="bg-slate-900 border-l-2 border-indigo-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula math="P^{(n)} = P^n \implies \pi^{(n)} = \pi^{(0)} P^n" block />
          </div>
          <p>
            <strong className="text-indigo-300">Convergencia Asintótica & Teorema de Perron-Frobenius:</strong> Si la cadena es regular (irreducible y aperiódica):
          </p>
          <div className="bg-slate-900 border-l-2 border-indigo-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="\lim_{n \to \infty} P^n = \mathbf{1} \pi^* = \begin{pmatrix} \pi_1^* & \pi_2^* & \dots & \pi_K^* \\ \vdots & \vdots & \ddots & \vdots \\ \pi_1^* & \pi_2^* & \dots & \pi_K^* \end{pmatrix}"
              block
            />
          </div>
          <p>
            La tasa de convergencia geométrica está gobernada rigurosamente por el segundo valor propio en valor absoluto{' '}
            <MathFormula math="|\lambda_2| < 1" /> y la brecha espectral <MathFormula math="\gamma = 1 - |\lambda_2|" />:
          </p>
          <div className="bg-slate-900 border-l-2 border-indigo-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula math="\|\pi^{(n)} - \pi^*\|_{TV} = \frac{1}{2}\sum_{j=1}^K |\pi_j^{(n)} - \pi_j^*| \le C \cdot |\lambda_2|^n" block />
          </div>
        </div>
      ),
    },
    {
      id: 'absorbente',
      title: '4. Cadenas Absorbentes: Teorema Canónico de Kemeny & Snell (1960)',
      badge: 'Cadenas Absorbentes',
      summary: 'Forma canónica [Q, R; 0, I], matriz fundamental N = (I - Q)⁻¹, tiempos t = N1 y probabilidades B = NR.',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          <p>
            Una cadena de Markov se define como <strong>absorbente</strong> si contiene al menos un estado absorbente (<MathFormula math="P_{kk} = 1" />)
            y desde cualquier estado transitorio es posible alcanzar al menos un estado absorbente en un número finito de pasos.
          </p>
          <p>
            Reordenando los estados en transitorios (<MathFormula math="T" />, tamaño <MathFormula math="t" />) y absorbentes (<MathFormula math="A" />, tamaño <MathFormula math="r" />),
            se obtiene la <strong>Forma Canónica por Bloques</strong>:
          </p>
          <div className="bg-slate-900 border-l-2 border-purple-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="P = \begin{pmatrix} Q_{t \times t} & R_{t \times r} \\ \mathbf{0}_{r \times t} & I_{r \times r} \end{pmatrix}, \quad Q^n \xrightarrow[n \to \infty]{} \mathbf{0}"
              block
            />
          </div>
          <p>
            <strong>Teorema de Existencia de la Matriz Fundamental:</strong> Puesto que el radio espectral{' '}
            <MathFormula math="\rho(Q) < 1" />, la serie de potencias (serie de Neumann) converge absolutamente e invierte la matriz:
          </p>
          <div className="bg-slate-900 border-l-2 border-purple-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="N = \sum_{k=0}^\infty Q^k = (I - Q)^{-1}"
              block
            />
          </div>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
            <li>
              <strong className="text-purple-300">Significado Físico de N_ij:</strong> Número esperado de veces que el sistema visita el estado transitorio <MathFormula math="s_j" /> habiendo iniciado en <MathFormula math="s_i" /> antes de quedar atrapado.
            </li>
            <li>
              <strong className="text-purple-300">Vector de Tiempo Medio hasta Absorción:</strong>{' '}
              <MathFormula math="\mathbf{t} = N \cdot \mathbf{1}" /> donde cada elemento <MathFormula math="t_i = \sum_{j=1}^t N_{ij}" /> es la esperanza matemática de pasos hasta la absorción.
            </li>
            <li>
              <strong className="text-purple-300">Varianza de los Tiempos de Absorción:</strong>{' '}
              <MathFormula math="\mathbf{v} = (2N - I)\mathbf{t} - \mathbf{t}_{sq}" /> (Teorema 3.3.5 de Kemeny & Snell).
            </li>
            <li>
              <strong className="text-purple-300">Probabilidades de Absorción Terminal:</strong> Por el análisis de primeros pasos (First-Step Analysis):{' '}
              <MathFormula math="B = N \cdot R \in \mathbb{R}^{t \times r}" />, donde <MathFormula math="B_{ik} = \mathbb{P}(\text{absorción en sumidero } k \mid X_0 = i)" />.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'decisiones',
      title: '5. Simulación y Evaluación del Impacto de Decisiones Operativas (MDP & Escenarios)',
      badge: 'Teoría de Decisiones',
      summary: 'Procesos de Decisión de Markov, valor descontado infinito V = (I - γP)⁻¹c y derivadas de sensibilidad.',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          <p>
            En la gestión moderna de la Cadena de Suministro y Operaciones Industriales, el decisor aplica políticas de control{' '}
            <MathFormula math="u \in \mathcal{U}" /> que modifican la matriz de transición <MathFormula math="P \to P(u)" />.
          </p>
          <p>
            <strong>Costo Esperado Acumulado Descontado (Horizonte Infinito):</strong> Con factor de descuento temporal{' '}
            <MathFormula math="\gamma \in (0, 1)" /> y vector de costos <MathFormula math="\mathbf{c}" />:
          </p>
          <div className="bg-slate-900 border-l-2 border-amber-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="V(s_i) = \mathbb{E}\left[ \sum_{t=0}^\infty \gamma^t c(X_t) \,\middle|\, X_0 = s_i \right] \implies \mathbf{V} = (I - \gamma P)^{-1} \mathbf{c}"
              block
            />
          </div>
          <p>
            <strong>Análisis de Sensibilidad de Gradiente:</strong> Cómo cambia el vector estacionario{' '}
            <MathFormula math="\pi^*" /> ante una pequeña inversión que reduce la tasa de fallas o demoras de transporte{' '}
            <MathFormula math="\theta" />:
          </p>
          <div className="bg-slate-900 border-l-2 border-amber-500 p-3 rounded-r-lg font-mono-code text-slate-200">
            <MathFormula
              math="\frac{\partial \pi^*}{\partial \theta} = \pi^* \frac{\partial P}{\partial \theta} (I - P + \mathbf{1}\pi^*)^{-1}"
              block
            />
          </div>
          <p>
            Esta formulación rigurosa garantiza que cada simulación en la plataforma proporcione una estimación matemática exacta del impacto económico y operativo.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Marco Teórico y Fundamentos Analíticos Rigurosos (Nivel MIT / Stanford / Harvard)
            </h3>
            <span className="text-[11px] text-slate-400">
              Separación explícita: 1 Etapa (n=1), n Etapas (n ≥ 1), Cadenas Absorbentes e Impacto de Decisiones
            </span>
          </div>
        </div>

        <span className="text-[11px] text-sky-400 font-mono-code bg-sky-950/60 px-2 py-1 rounded border border-sky-800/80 self-start sm:self-auto">
          5 Módulos Demostrativos
        </span>
      </div>

      {/* Accordion list */}
      <div className="flex flex-col gap-2.5 mt-1">
        {sections.map((sec, idx) => {
          const isOpen = openSection === idx;

          return (
            <div
              key={`theory-sec-${sec.id}`}
              className="bg-slate-950/70 border border-slate-800/80 rounded-lg overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenSection(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-code bg-slate-800 text-sky-300 border border-slate-700">
                    {sec.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-200">{sec.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 hidden lg:inline max-w-sm truncate">
                    {sec.summary}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="p-4 pt-1 border-t border-slate-800/60 bg-slate-950/50">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
