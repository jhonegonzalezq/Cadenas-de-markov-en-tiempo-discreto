export interface DecisionScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  managerialAction: string;
  impactSummary: string;
  matrixModifier: (base: number[][]) => number[][];
  kpiChanges: {
    label: string;
    before: string;
    after: string;
    positive: boolean;
    explanation: string;
  }[];
}

export interface ExerciseScenarioSet {
  exerciseId: string;
  title: string;
  managerRole: string;
  strategicObjective: string;
  scenarios: DecisionScenario[];
}

export const DECISION_SCENARIOS: Record<string, ExerciseScenarioSet> = {
  'ejercicio-1-dos-maquinas': {
    exerciseId: 'ejercicio-1-dos-maquinas',
    title: 'Confiabilidad y Disponibilidad de Dos Máquinas Industriales',
    managerRole: 'Director de Planta / Gerente de Mantenimiento',
    strategicObjective: 'Maximizar el OEE (Overall Equipment Effectiveness) y minimizar el tiempo en Estado 0 (parada total de planta por falla de ambas máquinas).',
    scenarios: [
      {
        id: 'base',
        name: 'Escenario 1: Operación Estándar (Línea Base)',
        badge: 'Línea Base',
        description: 'Mantenimiento correctivo ordinario con 1 técnico de turno. Tasa de falla p=0.15 por máquina, tasa de reparación r=0.70.',
        managerialAction: 'Sin intervención adicional. Se atienden averías a medida que ocurren con repuestos estándar.',
        impactSummary: 'Parada no planificada de la planta estimada en un 3.5% del tiempo total. Costo de parada: $5,000/hora.',
        matrixModifier: (base) => base.map(row => [...row]),
        kpiChanges: [
          { label: 'Disponibilidad (X ≥ 1)', before: '96.5%', after: '96.5%', positive: true, explanation: 'Operación con al menos una máquina activa.' },
          { label: 'Parada Total (X = 0)', before: '3.5%', after: '3.5%', positive: false, explanation: 'Planta paralizada completamente.' },
          { label: 'Costo Anual Parada', before: '$153,300', after: '$153,300', positive: false, explanation: 'Pérdida por lucro cesante y mano de obra ociosa.' },
        ],
      },
      {
        id: 'mantenimiento_predictivo',
        name: 'Escenario 2: Mantenimiento Predictivo 4.0 (IoT & Sensores)',
        badge: 'Inversión Tecnológica',
        description: 'Instalación de sensores de vibración y temperatura que reducen la probabilidad de falla p del 15% al 5%.',
        managerialAction: 'Inversión en monitoreo continuo en tiempo real. Permite detectar fatiga de rodamientos antes de la rotura catastrófica.',
        impactSummary: 'La probabilidad de parada total (Estado 0) colapsa al 0.4%, elevando la disponibilidad total al 99.6%.',
        matrixModifier: (base) => {
          // p=0.05, r=0.75
          const p = 0.05;
          const r = 0.75;
          return [
            // Desde 0:
            [Math.pow(1 - r, 2), 2 * r * (1 - r), Math.pow(r, 2)],
            // Desde 1:
            [p * (1 - r), (1 - p) * (1 - r) + p * r, (1 - p) * r],
            // Desde 2:
            [Math.pow(p, 2), 2 * p * (1 - p), Math.pow(1 - p, 2)],
          ];
        },
        kpiChanges: [
          { label: 'Disponibilidad (X ≥ 1)', before: '96.5%', after: '99.6%', positive: true, explanation: '+3.1% de tiempo productivo neto.' },
          { label: 'Parada Total (X = 0)', before: '3.5%', after: '0.4%', positive: true, explanation: 'Reducción del 88% en paradas catastróficas.' },
          { label: 'Ahorro Neto Anual', before: '$0', after: '+$132,000', positive: true, explanation: 'Ahorro neto tras deducir la suscripción de sensores IoT.' },
        ],
      },
      {
        id: 'sobrecarga_produccion',
        name: 'Escenario 3: Sobrecarga por Temporada Alta (Horas Extra)',
        badge: 'Riesgo Operativo',
        description: 'Se incrementa la cadencia de producción sin dar ventanas de enfriamiento, elevando p al 30% mientras el técnico está saturado (r baja a 0.50).',
        managerialAction: 'Aceptar pedidos urgentes postergando paradas programadas.',
        impactSummary: 'El sistema colapsa en el Estado 0 el 13.8% del tiempo, generando pérdidas y retrasos en pedidos comprometidos.',
        matrixModifier: (base) => {
          const p = 0.30;
          const r = 0.50;
          return [
            [Math.pow(1 - r, 2), 2 * r * (1 - r), Math.pow(r, 2)],
            [p * (1 - r), (1 - p) * (1 - r) + p * r, (1 - p) * r],
            [Math.pow(p, 2), 2 * p * (1 - p), Math.pow(1 - p, 2)],
          ];
        },
        kpiChanges: [
          { label: 'Disponibilidad (X ≥ 1)', before: '96.5%', after: '86.2%', positive: false, explanation: 'Caída de más de 10 puntos en disponibilidad.' },
          { label: 'Parada Total (X = 0)', before: '3.5%', after: '13.8%', positive: false, explanation: 'Casi 4 veces más paradas críticas.' },
          { label: 'Costo Adicional Parada', before: '$0', after: '+$450,000', positive: false, explanation: 'Penalizaciones por incumplimiento de entrega.' },
        ],
      },
    ],
  },

  'ejercicio-2-sucursal-bancaria': {
    exerciseId: 'ejercicio-2-sucursal-bancaria',
    title: 'Flujo de Clientes y Riesgo Crediticio en Sucursal Bancaria',
    managerRole: 'Gerente Zonal de Operaciones Bancarias & Riesgo',
    strategicObjective: 'Optimizar el embudo de colocación de crédito, reducir el tiempo de espera y mitigar la morosidad y cartera castigada.',
    scenarios: [
      {
        id: 'base',
        name: 'Escenario 1: Atención Presencial Tradicional',
        badge: 'Línea Base',
        description: 'Ventanilla física saturada, tiempos de espera de 25 min en lobby y un 10% de deserción de clientes en fila.',
        managerialAction: 'Modelo convencional sin filtros de autoservicio ni scoring algorítmico acelerado.',
        impactSummary: 'La morosidad se mantiene en 7.8% y un 10% de los clientes potenciales abandonan antes de ser atendidos.',
        matrixModifier: (base) => base.map(row => [...row]),
        kpiChanges: [
          { label: 'Tasa Deserción en Lobby', before: '10.0%', after: '10.0%', positive: false, explanation: 'Clientes que abandonan por fila excesiva.' },
          { label: 'Tasa Morosidad π_MORA*', before: '7.8%', after: '7.8%', positive: false, explanation: 'Porcentaje de cartera en mora temprana.' },
          { label: 'Desembolsos Efectivos', before: '18.4%', after: '18.4%', positive: true, explanation: 'Conversión final en créditos colocados.' },
        ],
      },
      {
        id: 'banca_digital_autoservicio',
        name: 'Escenario 2: Kioscos Digitales de Autoservicio & Turnero Inteligente',
        badge: 'Transformación Digital',
        description: 'Migración del 60% de trámites menores a kioscos biométricos. La deserción cae al 2% y los asesores disponen de más tiempo.',
        managerialAction: 'Instalación de tótems de autoservicio y precalificación en la app móvil.',
        impactSummary: 'Aumenta el flujo directo a Asesoría Comercial (del 35% al 55%) y los desembolsos crecen un 32%.',
        matrixModifier: (base) => {
          const copy = base.map(row => [...row]);
          // En LLEG (0): menos a CAJ (1), más directo a ASES (2), menos abandono (6)
          copy[0][1] = 0.20; // baja carga en ventanilla
          copy[0][2] = 0.65; // sube perfil comercial
          copy[0][6] = 0.02; // casi cero deserción
          copy[0][0] = 0.13;
          // En ASES (2): mayor pre-calificación digital, aprueba más rápido a RIES (3)
          copy[2][3] = 0.75;
          copy[2][6] = 0.10;
          return copy;
        },
        kpiChanges: [
          { label: 'Tasa Deserción en Lobby', before: '10.0%', after: '2.0%', positive: true, explanation: 'Reducción masiva en clientes insatisfechos.' },
          { label: 'Conversión a Desembolso', before: '18.4%', after: '26.8%', positive: true, explanation: 'Mayor volumen de colocación de créditos.' },
          { label: 'NPS de Sucursal', before: '+28', after: '+64', positive: true, explanation: 'Satisfacción por atención ágil.' },
        ],
      },
      {
        id: 'scoring_estricto',
        name: 'Escenario 3: Política de Riesgo Restrictiva (Credit Tightening)',
        badge: 'Blindaje Financiero',
        description: 'Endurecimiento de políticas crediticias ante incertidumbre macroeconómica. RIES rechaza el 50% de solicitudes.',
        managerialAction: 'Aumento de exigencias de historial crediticio e ingresos mínimos para frenar la cartera vencida.',
        impactSummary: 'La morosidad cae al 2.5%, pero el volumen de colocación de crédito se contrae un 40%.',
        matrixModifier: (base) => {
          const copy = base.map(row => [...row]);
          // En RIES (3): pasa solo 0.30 a DESB (4), y 0.50 va a rechazo SAL (6)
          copy[3][4] = 0.30;
          copy[3][6] = 0.50;
          copy[3][3] = 0.20;
          // En DESB (4): clientes más solventes, casi no caen en mora (5)
          copy[4][5] = 0.05;
          copy[4][6] = 0.85;
          return copy;
        },
        kpiChanges: [
          { label: 'Tasa Morosidad π_MORA*', before: '7.8%', after: '2.1%', positive: true, explanation: 'Blindaje exitoso frente a impagos.' },
          { label: 'Colocación Total Cartera', before: '100%', after: '61.5%', positive: false, explanation: 'Contracción severa del negocio crediticio.' },
          { label: 'Riesgo de Pérdida Esperada', before: '$850k', after: '$180k', positive: true, explanation: 'Provisiones bancarias mínimas.' },
        ],
      },
    ],
  },

  'ejercicio-3-cadena-papa-colombia': {
    exerciseId: 'ejercicio-3-cadena-papa-colombia',
    title: 'Cadena Agroalimentaria de la Papa en Colombia (18 Nodos)',
    managerRole: 'Director Nacional de Supply Chain Agroindustrial',
    strategicObjective: 'Garantizar el abastecimiento continuo a tenderos, mitigar pérdidas por merma postcosecha y neutralizar riesgos de bloqueos viales.',
    scenarios: [
      {
        id: 'base',
        name: 'Escenario 1: Flujo Normal sin Bloqueos',
        badge: 'Operación Óptima',
        description: 'Corredores viales despejados. Boyacá y Cundinamarca abastecen a Bogotá, Antioquia a Medellín y Nariño/Cauca a Cali vía Panamericana.',
        managerialAction: 'Operación rutinaria con despachos nocturnos y rotación rápida en plazas de mercado.',
        impactSummary: 'Nivel de servicio a las 10 tiendas del 98.2%. Merma promedio en plazas controlada en 5.2%.',
        matrixModifier: (base) => base.map(row => [...row]),
        kpiChanges: [
          { label: 'Nivel Servicio a Tenderos', before: '98.2%', after: '98.2%', positive: true, explanation: 'Entregas a tiempo y completas (OTIF).' },
          { label: 'Merma en Plazas Mayoristas', before: '5.2%', after: '5.2%', positive: true, explanation: 'Pérdida por pudrición y manipulación.' },
          { label: 'Costo Flete Ponderado', before: '$280/kg', after: '$280/kg', positive: true, explanation: 'Costo logístico de transporte en ruta directa.' },
        ],
      },
      {
        id: 'cierre_la_linea',
        name: 'Escenario 2: Cierre de la Cordillera Central (Paso de La Línea)',
        badge: 'Disrupción Crítica',
        description: 'Derrumbe bloquea el túnel y paso de La Línea. Se corta el intercambio entre Bogotá y el Suroccidente (Cali).',
        managerialAction: 'Reruteo de emergencia. Boyacá y Cundinamarca vuelcan toda la papa a Corabastos, mientras Cali depende 100% de Pasto y Cauca.',
        impactSummary: 'Sobreoferta y caída de precios en Bogotá; déficit agudo y alza de precios del 45% en Cavasa y tiendas de Cali.',
        matrixModifier: (base) => {
          const copy = base.map(row => [...row]);
          // Tunja (0) y Villapinzón (1) no pueden cruzar a Cali (7)
          copy[0][5] = 0.85; copy[0][6] = 0.10; copy[0][7] = 0.00;
          copy[1][5] = 0.88; copy[1][6] = 0.07; copy[1][7] = 0.00;
          // Pasto (2) y Silvia (4) concentran despachos hacia Cavasa (7)
          copy[2][7] = 0.75; copy[2][5] = 0.05; copy[2][6] = 0.05;
          copy[4][7] = 0.80; copy[4][5] = 0.05; copy[4][6] = 0.00;
          return copy;
        },
        kpiChanges: [
          { label: 'Nivel Servicio en Cali', before: '98.0%', after: '74.5%', positive: false, explanation: 'Quiebre de stock frecuente en tiendas de Cali.' },
          { label: 'Costo Flete Desvío', before: '$280/kg', after: '$460/kg', positive: false, explanation: 'Ruta alterna por Letras y Manizales.' },
          { label: 'Merma por Mayor Tránsito', before: '5.2%', after: '11.8%', positive: false, explanation: 'Horas adicionales de viaje en camiones estaca.' },
        ],
      },
      {
        id: 'bloqueo_panamericana',
        name: 'Escenario 3: Bloqueo de la Vía Panamericana (Paro en Cauca y Nariño)',
        badge: 'Parálisis Agrícola',
        description: 'Taponamiento de la carretera Panamericana. La papa de Pasto y Silvia no puede salir a Cali ni a Bogotá.',
        managerialAction: 'Acopio forzado en parcelas agrícolas y activación de subsidios de almacenamiento refrigerado.',
        impactSummary: 'Pérdida inminente de 220 toneladas en fincas de Nariño/Cauca (retención > 70%). Cavasa entra en desabastecimiento severo.',
        matrixModifier: (base) => {
          const copy = base.map(row => [...row]);
          // Pasto (2) y Silvia (4) quedan retenidos en finca
          copy[2][2] = 0.75; copy[2][7] = 0.15; copy[2][5] = 0.05; copy[2][6] = 0.05;
          copy[4][4] = 0.70; copy[4][7] = 0.20; copy[4][5] = 0.05; copy[4][6] = 0.05;
          // Cavasa (7) intenta recibir desesperadamente de Boyacá y Cundinamarca
          copy[0][7] = 0.20; copy[0][5] = 0.55;
          copy[1][7] = 0.18; copy[1][5] = 0.65;
          return copy;
        },
        kpiChanges: [
          { label: 'Retención en Finca (Riesgo)', before: '10.0%', after: '72.5%', positive: false, explanation: 'Riesgo inminente de pudrición en parcela.' },
          { label: 'Desabastecimiento en Cali', before: '2.0%', after: '38.0%', positive: false, explanation: 'Tiendas de Aguablanca y San Fernando sin stock.' },
          { label: 'Inflación Precio Papa Cali', before: '$3,300/kg', after: '$5,100/kg', positive: false, explanation: 'Especulación por escasez de oferta.' },
        ],
      },
    ],
  },

  'ejercicio-4-logistica-inversa': {
    exerciseId: 'ejercicio-4-logistica-inversa',
    title: 'Logística Inversa, Devoluciones y Auditoría de Proveedores (16 Nodos)',
    managerRole: 'Director de Calidad y Postventa de Cadena de Suministro',
    strategicObjective: 'Acelerar el ciclo de resolución de garantías, atribuir responsabilidades a proveedores y recuperar valor de piezas devueltas.',
    scenarios: [
      {
        id: 'base',
        name: 'Escenario 1: Proceso de Garantías Estándar',
        badge: 'Línea Base',
        description: 'Devoluciones tardan en promedio 18 días en ser diagnosticadas en planta y atribuidas a los proveedores.',
        managerialAction: 'Trámite manual en tiendas y centros de acopio.',
        impactSummary: 'El 42% del inventario defectuoso permanece estancado en el Minorista y Mayorista antes de llegar a Planta.',
        matrixModifier: (base) => base.map(row => [...row]),
        kpiChanges: [
          { label: 'Tiempo de Resolución', before: '18 días', after: '18 días', positive: true, explanation: 'Desde que el cliente devuelve hasta la reposición.' },
          { label: 'Tasa de Recuperación', before: '55%', after: '55%', positive: true, explanation: 'Porcentaje de producto reacondicionado con éxito.' },
          { label: 'Costo por Reclamo', before: '$85/ud', after: '$85/ud', positive: false, explanation: 'Costos administrativos y fletes inversos.' },
        ],
      },
      {
        id: 'diagnostico_digital_tienda',
        name: 'Escenario 2: Diagnóstico Rápido en Tienda & Despacho Directo',
        badge: 'Optimización de Flujo',
        description: 'La tienda minorista cuenta con software de tele-diagnóstico y envía directamente a Planta, saltándose el depósito mayorista.',
        managerialAction: 'Eliminar eslabón intermedio en el flujo inverso para productos críticos.',
        impactSummary: 'El tiempo de ciclo cae a 7 días y la satisfacción del cliente en postventa sube al 94%.',
        matrixModifier: (base) => {
          const copy = base.map(row => [...row]);
          // Tiendas (6 a 15) van directo a Planta (3) con 0.70 en vez de ir a Minorista (5)
          for (let c = 6; c <= 15; c++) {
            copy[c][3] = 0.75;
            copy[c][5] = 0.15;
            copy[c][c] = 0.10;
          }
          return copy;
        },
        kpiChanges: [
          { label: 'Tiempo de Resolución', before: '18 días', after: '7 días', positive: true, explanation: 'Reducción de más del 60% en días de ciclo.' },
          { label: 'Inventario Inverso Inmovilizado', before: '42%', after: '14%', positive: true, explanation: 'Menos capital de trabajo atrapado en garantías.' },
          { label: 'Costo por Reclamo', before: '$85/ud', after: '$42/ud', positive: true, explanation: 'Ahorro masivo en bodegaje y doble flete.' },
        ],
      },
      {
        id: 'penalizacion_proveedores',
        name: 'Escenario 3: Política de Calidad Cero Defectos (SLA Estricto)',
        badge: 'Gobernanza de Calidad',
        description: 'Auditoría severa a Proveedores 1, 2 y 3. El proveedor con defectos paga el 100% de los costos y reposición inmediata.',
        managerialAction: 'Cláusulas contractuales de penalización e inspección en origen.',
        impactSummary: 'Disminución del 70% en devoluciones generadas por clientes en los siguientes períodos estocásticos.',
        matrixModifier: (base) => {
          const copy = base.map(row => [...row]);
          // Proveedores reponen de inmediato a planta sin demoras
          copy[0][3] = 0.95; copy[0][0] = 0.05;
          copy[1][3] = 0.95; copy[1][1] = 0.05;
          copy[2][3] = 0.95; copy[2][2] = 0.05;
          return copy;
        },
        kpiChanges: [
          { label: 'Tasa de Falla en Origen', before: '8.4%', after: '1.2%', positive: true, explanation: 'Proveedores elevan sus estándares de calidad.' },
          { label: 'Reposición Inmediata', before: '85%', after: '98%', positive: true, explanation: 'Reemplazo casi instantáneo de lotes defectuosos.' },
          { label: 'Reputación de Marca', before: '72%', after: '96%', positive: true, explanation: 'Confianza restaurada en el mercado.' },
        ],
      },
    ],
  },
};
