import { MarkovPreset, MarkovState } from '../types/markov';

// Helper to generate the 16 supply chain nodes
export const SUPPLY_CHAIN_16_NODES: MarkovState[] = [
  // 3 Proveedores (Tier 1)
  {
    id: 0,
    name: 'Proveedor 1 (Materias Primas)',
    code: 'P1',
    color: '#06b6d4',
    x: 0.10,
    y: 0.22,
    tier: 'supplier',
    tierLabel: 'Tier-1 Proveedores',
  },
  {
    id: 1,
    name: 'Proveedor 2 (Componentes)',
    code: 'P2',
    color: '#0284c7',
    x: 0.10,
    y: 0.50,
    tier: 'supplier',
    tierLabel: 'Tier-1 Proveedores',
  },
  {
    id: 2,
    name: 'Proveedor 3 (Embalaje & Empaque)',
    code: 'P3',
    color: '#3b82f6',
    x: 0.10,
    y: 0.78,
    tier: 'supplier',
    tierLabel: 'Tier-1 Proveedores',
  },
  // 1 Planta de Manufactura
  {
    id: 3,
    name: 'Planta de Producción & Ensamble',
    code: 'PLT',
    color: '#8b5cf6',
    x: 0.28,
    y: 0.50,
    tier: 'plant',
    tierLabel: 'Manufactura',
  },
  // 1 Distribuidor Mayorista
  {
    id: 4,
    name: 'Distribuidor Mayorista (CD Central)',
    code: 'MAY',
    color: '#ec4899',
    x: 0.48,
    y: 0.50,
    tier: 'wholesaler',
    tierLabel: 'Mayorista',
  },
  // 1 Distribuidor Minorista
  {
    id: 5,
    name: 'Distribuidor Minorista (Punto Retail)',
    code: 'MIN',
    color: '#f59e0b',
    x: 0.68,
    y: 0.50,
    tier: 'retailer',
    tierLabel: 'Minorista',
  },
  // 10 Clientes Finales
  {
    id: 6,
    name: 'Cliente 1 (Retail Centro)',
    code: 'C1',
    color: '#10b981',
    x: 0.90,
    y: 0.08,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 7,
    name: 'Cliente 2 (Retail Norte)',
    code: 'C2',
    color: '#10b981',
    x: 0.90,
    y: 0.17,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 8,
    name: 'Cliente 3 (Corporativo A)',
    code: 'C3',
    color: '#14b8a6',
    x: 0.90,
    y: 0.26,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 9,
    name: 'Cliente 4 (Corporativo B)',
    code: 'C4',
    color: '#14b8a6',
    x: 0.90,
    y: 0.35,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 10,
    name: 'Cliente 5 (E-Commerce Express)',
    code: 'C5',
    color: '#84cc16',
    x: 0.90,
    y: 0.44,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 11,
    name: 'Cliente 6 (E-Commerce Estándar)',
    code: 'C6',
    color: '#84cc16',
    x: 0.90,
    y: 0.54,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 12,
    name: 'Cliente 7 (Supermercados Cadena)',
    code: 'C7',
    color: '#22c55e',
    x: 0.90,
    y: 0.63,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 13,
    name: 'Cliente 8 (Supermercados Express)',
    code: 'C8',
    color: '#22c55e',
    x: 0.90,
    y: 0.72,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 14,
    name: 'Cliente 9 (Distribución Regional Sur)',
    code: 'C9',
    color: '#16a34a',
    x: 0.90,
    y: 0.81,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
  {
    id: 15,
    name: 'Cliente 10 (Distribución Regional Este)',
    code: 'C10',
    color: '#16a34a',
    x: 0.90,
    y: 0.90,
    tier: 'customer',
    tierLabel: 'Clientes Finales',
  },
];

// Matrix 1: Forward Logistics (Flujo Directo de Pedidos)
const matrixForward: number[][] = Array.from({ length: 16 }, () => new Array(16).fill(0));

// Row 0 (P1): 0.15 delay en P1, 0.85 entrega a Planta (idx 3)
matrixForward[0][0] = 0.15;
matrixForward[0][3] = 0.85;

// Row 1 (P2): 0.10 delay en P2, 0.90 entrega a Planta (idx 3)
matrixForward[1][1] = 0.10;
matrixForward[1][3] = 0.90;

// Row 2 (P3): 0.20 delay en P3, 0.80 entrega a Planta (idx 3)
matrixForward[2][2] = 0.20;
matrixForward[2][3] = 0.80;

// Row 3 (Planta): 0.05 reproceso, 0.02 rechazo a P1, 0.02 rechazo a P2, 0.01 rechazo a P3, 0.90 a Mayorista (idx 4)
matrixForward[3][0] = 0.02;
matrixForward[3][1] = 0.02;
matrixForward[3][2] = 0.01;
matrixForward[3][3] = 0.05;
matrixForward[3][4] = 0.90;

// Row 4 (Mayorista): 0.08 cross-docking, 0.02 retorno a Planta, 0.90 a Minorista (idx 5)
matrixForward[4][3] = 0.02;
matrixForward[4][4] = 0.08;
matrixForward[4][5] = 0.90;

// Row 5 (Minorista): 0.05 en tienda, 0.95 distribuido a los 10 clientes (idx 6 a 15)
matrixForward[5][5] = 0.05;
const clientWeights = [0.10, 0.10, 0.12, 0.11, 0.09, 0.09, 0.10, 0.09, 0.08, 0.07];
clientWeights.forEach((w, idx) => {
  matrixForward[5][6 + idx] = w;
});

// Rows 6 to 15 (Clientes 1 a 10): 0.20 tiempo de consumo/inventario en cliente, 0.80 nueva orden que dispara reposición a los 3 proveedores (0.35 P1, 0.25 P2, 0.20 P3)
for (let c = 6; c <= 15; c++) {
  matrixForward[c][c] = 0.20; // consumo cliente
  matrixForward[c][0] = 0.35; // orden materias primas P1
  matrixForward[c][1] = 0.25; // orden componentes P2
  matrixForward[c][2] = 0.20; // orden embalaje P3
}

// Matrix 2: Reverse Logistics (Logística Inversa y Devoluciones)
const matrixReverse: number[][] = Array.from({ length: 16 }, () => new Array(16).fill(0));

// Clientes (6 to 15): 0.10 descarte/resolución local, 0.90 devolución al Minorista (idx 5)
for (let c = 6; c <= 15; c++) {
  matrixReverse[c][c] = 0.10;
  matrixReverse[c][5] = 0.90;
}

// Minorista (idx 5): 0.15 resolución en tienda, 0.10 retorno a clientes (0.01 c/u), 0.75 escala a Mayorista (idx 4)
matrixReverse[5][5] = 0.15;
for (let c = 6; c <= 15; c++) {
  matrixReverse[5][c] = 0.01;
}
matrixReverse[5][4] = 0.75;

// Mayorista (idx 4): 0.10 liquidación local, 0.90 envía a Planta (idx 3)
matrixReverse[4][4] = 0.10;
matrixReverse[4][3] = 0.90;

// Planta (idx 3): Análisis de causa raíz. 0.10 atribuible a ensamble en planta, imputa al proveedor responsable:
matrixReverse[3][3] = 0.10;
matrixReverse[3][0] = 0.40; // 40% atribuible a Materias Primas P1
matrixReverse[3][1] = 0.30; // 30% atribuible a Componentes P2
matrixReverse[3][2] = 0.20; // 20% atribuible a Embalaje P3

// Proveedores (0, 1, 2): 0.15 auditoría interna, 0.85 reposición bonificada enviada a Planta (idx 3)
matrixReverse[0][0] = 0.15;
matrixReverse[0][3] = 0.85;

matrixReverse[1][1] = 0.15;
matrixReverse[1][3] = 0.85;

matrixReverse[2][2] = 0.15;
matrixReverse[2][3] = 0.85;

// Initial distributions
const initForward = new Array(16).fill(0);
initForward[0] = 0.50; // Materia prima en P1
initForward[1] = 0.30; // Componente en P2
initForward[2] = 0.20; // Embalaje en P3

const initReverse = new Array(16).fill(0);
// Las reclamaciones inician distribuidas entre los clientes
for (let c = 6; c <= 15; c++) {
  initReverse[c] = 0.10;
}

// -------------------------------------------------------------
// CASO AGROALIMENTARIO: CADENA DE PAPA EN COLOMBIA (18 NODOS)
// 5 Cultivos (Boyacá, Cundinamarca, Nariño, Antioquia, Cauca)
// 3 Plazas Mayoristas (Corabastos-Bogotá, Central-Medellín, Cavasa-Cali)
// 10 Tiendas de Barrio (4 Bogotá, 3 Medellín, 3 Cali)
// -------------------------------------------------------------
export const POTATO_COLOMBIA_18_NODES: MarkovState[] = [
  // 5 CULTIVOS
  {
    id: 0,
    name: 'Cultivo Tunja / Ventaquemada',
    code: 'C_TUN',
    color: '#06b6d4',
    x: 0.12,
    y: 0.15,
    tier: 'supplier',
    tierLabel: 'Cultivo (Proveedor)',
    department: 'Boyacá',
    city: 'Tunja',
    varietyOrType: 'Papa Pastusa & Diacol Capiro',
    capacityOrDemand: '120 Ton/sem',
    pricePerKg: 1850,
    geo: { lat: 5.5353, lng: -73.3678 },
  },
  {
    id: 1,
    name: 'Cultivo Villapinzón (Altiplano)',
    code: 'C_VIL',
    color: '#0284c7',
    x: 0.12,
    y: 0.32,
    tier: 'supplier',
    tierLabel: 'Cultivo (Proveedor)',
    department: 'Cundinamarca',
    city: 'Villapinzón',
    varietyOrType: 'Papa Criolla & Sabanera',
    capacityOrDemand: '150 Ton/sem',
    pricePerKg: 2100,
    geo: { lat: 5.2156, lng: -73.5969 },
  },
  {
    id: 2,
    name: 'Cultivo Pasto / Túquerres',
    code: 'C_PAS',
    color: '#3b82f6',
    x: 0.12,
    y: 0.49,
    tier: 'supplier',
    tierLabel: 'Cultivo (Proveedor)',
    department: 'Nariño',
    city: 'Pasto',
    varietyOrType: 'Papa Suprema & Parda Pastusa',
    capacityOrDemand: '140 Ton/sem',
    pricePerKg: 1650,
    geo: { lat: 1.2136, lng: -77.2811 },
  },
  {
    id: 3,
    name: 'Cultivo La Unión (Oriente)',
    code: 'C_UNI',
    color: '#6366f1',
    x: 0.12,
    y: 0.66,
    tier: 'supplier',
    tierLabel: 'Cultivo (Proveedor)',
    department: 'Antioquia',
    city: 'La Unión',
    varietyOrType: 'Papa Capiro Industrial',
    capacityOrDemand: '90 Ton/sem',
    pricePerKg: 2300,
    geo: { lat: 5.9739, lng: -75.3622 },
  },
  {
    id: 4,
    name: 'Cultivo Silvia / Puracé',
    code: 'C_SIL',
    color: '#8b5cf6',
    x: 0.12,
    y: 0.83,
    tier: 'supplier',
    tierLabel: 'Cultivo (Proveedor)',
    department: 'Cauca',
    city: 'Silvia',
    varietyOrType: 'Papa Parda / Única',
    capacityOrDemand: '80 Ton/sem',
    pricePerKg: 1900,
    geo: { lat: 2.6133, lng: -76.3814 },
  },
  // 3 PLAZAS MAYORISTAS
  {
    id: 5,
    name: 'Corabastos (Bogotá D.C.)',
    code: 'PLZ_BOG',
    color: '#ec4899',
    x: 0.45,
    y: 0.28,
    tier: 'wholesaler',
    tierLabel: 'Plaza Mayorista',
    department: 'Bogotá D.C.',
    city: 'Bogotá',
    varietyOrType: 'Hub Mayorista Central',
    capacityOrDemand: '300 Ton/sem',
    pricePerKg: 2600,
    geo: { lat: 4.6280, lng: -74.1530 },
  },
  {
    id: 6,
    name: 'Central Mayorista (Medellín / Itagüí)',
    code: 'PLZ_MED',
    color: '#f43f5e',
    x: 0.45,
    y: 0.50,
    tier: 'wholesaler',
    tierLabel: 'Plaza Mayorista',
    department: 'Antioquia',
    city: 'Medellín',
    varietyOrType: 'Hub Mayorista Antioquia',
    capacityOrDemand: '180 Ton/sem',
    pricePerKg: 2850,
    geo: { lat: 6.1820, lng: -75.5890 },
  },
  {
    id: 7,
    name: 'Cavasa (Cali / Candelaria)',
    code: 'PLZ_CAL',
    color: '#d946ef',
    x: 0.45,
    y: 0.72,
    tier: 'wholesaler',
    tierLabel: 'Plaza Mayorista',
    department: 'Valle del Cauca',
    city: 'Cali',
    varietyOrType: 'Hub Mayorista Suroccidente',
    capacityOrDemand: '150 Ton/sem',
    pricePerKg: 2750,
    geo: { lat: 3.4210, lng: -76.4380 },
  },
  // 10 TIENDAS DE BARRIO
  {
    id: 8,
    name: 'Tienda Doña Rosa (Kennedy, Bogotá)',
    code: 'T_KEN',
    color: '#10b981',
    x: 0.88,
    y: 0.08,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Bogotá D.C.',
    city: 'Bogotá',
    varietyOrType: 'Venta al Menudeo',
    capacityOrDemand: '1.2 Ton/sem',
    pricePerKg: 3200,
    geo: { lat: 4.6300, lng: -74.1500 },
  },
  {
    id: 9,
    name: 'Autoservicio El Nogal (Suba, Bogotá)',
    code: 'T_SUB',
    color: '#10b981',
    x: 0.88,
    y: 0.17,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Bogotá D.C.',
    city: 'Bogotá',
    varietyOrType: 'Minisupermercado',
    capacityOrDemand: '2.0 Ton/sem',
    pricePerKg: 3250,
    geo: { lat: 4.7500, lng: -74.0900 },
  },
  {
    id: 10,
    name: 'Minimarket Chapinero (Bogotá)',
    code: 'T_CHA',
    color: '#10b981',
    x: 0.88,
    y: 0.26,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Bogotá D.C.',
    city: 'Bogotá',
    varietyOrType: 'Tienda Express',
    capacityOrDemand: '1.5 Ton/sem',
    pricePerKg: 3400,
    geo: { lat: 4.6500, lng: -74.0600 },
  },
  {
    id: 11,
    name: 'Tienda Los Paisas (Bosa, Bogotá)',
    code: 'T_BOS',
    color: '#10b981',
    x: 0.88,
    y: 0.35,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Bogotá D.C.',
    city: 'Bogotá',
    varietyOrType: 'Abarrotes y Verduras',
    capacityOrDemand: '1.8 Ton/sem',
    pricePerKg: 3150,
    geo: { lat: 4.6100, lng: -74.1900 },
  },
  {
    id: 12,
    name: 'Granero Belén (Medellín)',
    code: 'T_BEL',
    color: '#14b8a6',
    x: 0.88,
    y: 0.45,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Antioquia',
    city: 'Medellín',
    varietyOrType: 'Granero Tradicional',
    capacityOrDemand: '1.6 Ton/sem',
    pricePerKg: 3400,
    geo: { lat: 6.2300, lng: -75.6000 },
  },
  {
    id: 13,
    name: 'Tienda La 70 (Laureles, Medellín)',
    code: 'T_LAU',
    color: '#14b8a6',
    x: 0.88,
    y: 0.54,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Antioquia',
    city: 'Medellín',
    varietyOrType: 'Minimercado de Barrio',
    capacityOrDemand: '1.4 Ton/sem',
    pricePerKg: 3500,
    geo: { lat: 6.2500, lng: -75.5900 },
  },
  {
    id: 14,
    name: 'Mercadito Castilla (Medellín)',
    code: 'T_CAS',
    color: '#14b8a6',
    x: 0.88,
    y: 0.63,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Antioquia',
    city: 'Medellín',
    varietyOrType: 'Placita y Víveres',
    capacityOrDemand: '1.9 Ton/sem',
    pricePerKg: 3300,
    geo: { lat: 6.2900, lng: -75.5700 },
  },
  {
    id: 15,
    name: 'Tienda El Diamante (Aguablanca, Cali)',
    code: 'T_AGU',
    color: '#22c55e',
    x: 0.88,
    y: 0.73,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Valle del Cauca',
    city: 'Cali',
    varietyOrType: 'Abarrotes Popular',
    capacityOrDemand: '2.2 Ton/sem',
    pricePerKg: 3300,
    geo: { lat: 3.4100, lng: -76.4900 },
  },
  {
    id: 16,
    name: 'Granero San Fernando (Cali Sur)',
    code: 'T_SFE',
    color: '#22c55e',
    x: 0.88,
    y: 0.82,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Valle del Cauca',
    city: 'Cali',
    varietyOrType: 'Granero & Verdulería',
    capacityOrDemand: '1.5 Ton/sem',
    pricePerKg: 3450,
    geo: { lat: 3.4300, lng: -76.5400 },
  },
  {
    id: 17,
    name: 'Minimercado Alfonso López (Cali Norte)',
    code: 'T_ALO',
    color: '#22c55e',
    x: 0.88,
    y: 0.91,
    tier: 'customer',
    tierLabel: 'Tienda de Barrio',
    department: 'Valle del Cauca',
    city: 'Cali',
    varietyOrType: 'Autoservicio de Barrio',
    capacityOrDemand: '1.7 Ton/sem',
    pricePerKg: 3350,
    geo: { lat: 3.4600, lng: -76.5000 },
  },
];

// Matrix 18x18: Potato Supply Chain in Colombia
const matrixPotato: number[][] = Array.from({ length: 18 }, () => new Array(18).fill(0));

// Row 0 (Tunja/Boyacá): 0.10 acopio, 0.60 Corabastos (5), 0.25 Medellín (6), 0.05 Cavasa (7)
matrixPotato[0][0] = 0.10;
matrixPotato[0][5] = 0.60;
matrixPotato[0][6] = 0.25;
matrixPotato[0][7] = 0.05;

// Row 1 (Villapinzón/Cund): 0.10 acopio, 0.75 Corabastos (5), 0.12 Medellín (6), 0.03 Cavasa (7)
matrixPotato[1][1] = 0.10;
matrixPotato[1][5] = 0.75;
matrixPotato[1][6] = 0.12;
matrixPotato[1][7] = 0.03;

// Row 2 (Pasto/Nariño): 0.15 tránsito largo, 0.55 Cavasa (7), 0.20 Corabastos (5), 0.10 Medellín (6)
matrixPotato[2][2] = 0.15;
matrixPotato[2][7] = 0.55;
matrixPotato[2][5] = 0.20;
matrixPotato[2][6] = 0.10;

// Row 3 (La Unión/Antioquia): 0.10 acopio, 0.70 Medellín (6), 0.15 Corabastos (5), 0.05 Cavasa (7)
matrixPotato[3][3] = 0.10;
matrixPotato[3][6] = 0.70;
matrixPotato[3][5] = 0.15;
matrixPotato[3][7] = 0.05;

// Row 4 (Silvia/Cauca): 0.15 flete montaña, 0.65 Cavasa (7), 0.15 Corabastos (5), 0.05 Medellín (6)
matrixPotato[4][4] = 0.15;
matrixPotato[4][7] = 0.65;
matrixPotato[4][5] = 0.15;
matrixPotato[4][6] = 0.05;

// Row 5 (Corabastos - Bogotá): 0.05 retención/merma, despacha a las 4 tiendas de Bogotá (8, 9, 10, 11)
matrixPotato[5][5] = 0.05;
matrixPotato[5][8] = 0.25; // T_KEN
matrixPotato[5][9] = 0.28; // T_SUB
matrixPotato[5][10] = 0.20; // T_CHA
matrixPotato[5][11] = 0.22; // T_BOS

// Row 6 (Central Mayorista - Medellín): 0.05 retención/merma, despacha a las 3 tiendas de Medellín (12, 13, 14)
matrixPotato[6][6] = 0.05;
matrixPotato[6][12] = 0.32; // T_BEL
matrixPotato[6][13] = 0.31; // T_LAU
matrixPotato[6][14] = 0.32; // T_CAS

// Row 7 (Cavasa - Cali): 0.05 retención/merma, despacha a las 3 tiendas de Cali (15, 16, 17)
matrixPotato[7][7] = 0.05;
matrixPotato[7][15] = 0.35; // T_AGU
matrixPotato[7][16] = 0.28; // T_SFE
matrixPotato[7][17] = 0.32; // T_ALO

// Rows 8 to 17 (Tiendas de Barrio): 0.20 tiempo de permanencia en venta, 0.80 reordenamiento a cultivos (0.30 Tunja, 0.30 Villapinzón, 0.20 Pasto, 0.10 La Unión, 0.10 Silvia)
for (let t = 8; t <= 17; t++) {
  matrixPotato[t][t] = 0.20;
  matrixPotato[t][0] = 0.24; // 0.80 * 0.30
  matrixPotato[t][1] = 0.24; // 0.80 * 0.30
  matrixPotato[t][2] = 0.16; // 0.80 * 0.20
  matrixPotato[t][3] = 0.08; // 0.80 * 0.10
  matrixPotato[t][4] = 0.08; // 0.80 * 0.10
}

const initPotato = new Array(18).fill(0);
initPotato[0] = 0.30; // Tunja
initPotato[1] = 0.30; // Villapinzón
initPotato[2] = 0.20; // Pasto
initPotato[3] = 0.10; // La Unión
initPotato[4] = 0.10; // Silvia

// -------------------------------------------------------------
// EJERCICIO 1: CONFIABILIDAD Y OPERACIÓN DE DOS MÁQUINAS (3 ESTADOS)
// -------------------------------------------------------------
export const TWO_MACHINES_STATES: MarkovState[] = [
  {
    id: 0,
    name: '0 Máquinas Operativas (Parada Total de Planta)',
    code: '0_OP',
    color: '#ef4444',
    x: 0.18,
    y: 0.50,
    tierLabel: 'Parada Crítica (0%)',
  },
  {
    id: 1,
    name: '1 Máquina Operativa (Capacidad Parcial)',
    code: '1_OP',
    color: '#f59e0b',
    x: 0.50,
    y: 0.25,
    tierLabel: 'Capacidad Degradada (50%)',
  },
  {
    id: 2,
    name: '2 Máquinas Operativas (Capacidad Plena)',
    code: '2_OP',
    color: '#10b981',
    x: 0.82,
    y: 0.50,
    tierLabel: 'Capacidad Plena (100%)',
  },
];

// Matriz p=0.15 (falla), r=0.70 (reparación)
export const matrixTwoMachines: number[][] = [
  [0.090, 0.420, 0.490], // Desde 0: ninguna reparada (0.09), una reparada (0.42), ambas (0.49)
  [0.045, 0.360, 0.595], // Desde 1: cae a 0 (0.045), sigue en 1 (0.360), sube a 2 (0.595)
  [0.0225, 0.255, 0.7225], // Desde 2: ambas fallan (0.0225), una falla (0.255), ninguna falla (0.7225)
];

export const initTwoMachines = [0.0, 0.0, 1.0]; // Inicia con ambas máquinas operativas

// -------------------------------------------------------------
// EJERCICIO 2: FLUJO DE CLIENTES Y RIESGO EN SUCURSAL BANCARIA (7 ESTADOS)
// -------------------------------------------------------------
export const BANK_FLOW_STATES: MarkovState[] = [
  {
    id: 0,
    name: 'Ingreso & Turnero (Lobby)',
    code: 'LLEG',
    color: '#6366f1',
    x: 0.10,
    y: 0.50,
    tierLabel: 'Acceso & Turnero',
  },
  {
    id: 1,
    name: 'Ventanilla de Caja (Efectivo & Pagos)',
    code: 'CAJ',
    color: '#3b82f6',
    x: 0.35,
    y: 0.20,
    tierLabel: 'Caja Operativa',
  },
  {
    id: 2,
    name: 'Asesoría Comercial & Créditos',
    code: 'ASES',
    color: '#06b6d4',
    x: 0.35,
    y: 0.80,
    tierLabel: 'Ventas & Captación',
  },
  {
    id: 3,
    name: 'Comité de Riesgo & Scoring',
    code: 'RIES',
    color: '#f59e0b',
    x: 0.65,
    y: 0.80,
    tierLabel: 'Evaluación Crediticia',
  },
  {
    id: 4,
    name: 'Desembolso & Cliente Activo',
    code: 'DESB',
    color: '#10b981',
    x: 0.90,
    y: 0.80,
    tierLabel: 'Cartera Colocada',
  },
  {
    id: 5,
    name: 'Cartera Vencida & Cobranzas',
    code: 'MORA',
    color: '#ef4444',
    x: 0.90,
    y: 0.20,
    tierLabel: 'Mora & Provisiones',
  },
  {
    id: 6,
    name: 'Salida / Abandono / Recirculación',
    code: 'SAL',
    color: '#94a3b8',
    x: 0.65,
    y: 0.20,
    tierLabel: 'Salida / Nuevo Ciclo',
  },
];

export const matrixBankFlow: number[][] = [
  // LLEG,  CAJ,   ASES,  RIES,  DESB,  MORA,  SAL
  [0.10, 0.45, 0.35, 0.00, 0.00, 0.00, 0.10], // LLEG: espera en fila, caja, asesor o deserta
  [0.00, 0.10, 0.20, 0.00, 0.00, 0.00, 0.70], // CAJ: trámite rápido, derivado a asesor o sale
  [0.00, 0.00, 0.15, 0.65, 0.00, 0.00, 0.20], // ASES: estudio perfil, postula crédito a RIES o sale
  [0.00, 0.00, 0.00, 0.25, 0.55, 0.00, 0.20], // RIES: evaluación, aprueba a DESB o deniega a SAL
  [0.00, 0.00, 0.00, 0.00, 0.10, 0.15, 0.75], // DESB: amortiza y concluye, o cae en MORA
  [0.00, 0.00, 0.00, 0.00, 0.00, 0.20, 0.80], // MORA: acuerdo o castigo de cartera retornando a SAL
  [0.85, 0.00, 0.15, 0.00, 0.00, 0.00, 0.00], // SAL: recirculación de nuevos clientes a LLEG o referidos a ASES
];

export const initBankFlow = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

export const MARKOV_PRESETS: MarkovPreset[] = [
  {
    id: 'ejercicio-1-dos-maquinas',
    title: 'Ejercicio 1: Dos Máquinas en Paralelo (0, 1, 2 Estados)',
    category: 'Confiabilidad / Manufactura',
    description: 'Sistema industrial con 2 máquinas paralelas. Estados: 0 máquinas operativas (paro total), 1 máquina operativa (50% capacidad) y 2 máquinas operativas (100% capacidad). Modela tasas de falla p y reparación r.',
    didacticNote: 'Cadena regular irreducible de 3 estados. Es el ejemplo fundamental para comprender la formulación analítica de probabilidades binomiales de transición y el cálculo de la disponibilidad industrial asintótica A = 1 - π₀.',
    isAperiodic: true,
    isIrreducible: true,
    states: TWO_MACHINES_STATES,
    transitionMatrix: matrixTwoMachines,
    initialDistribution: initTwoMachines,
  },
  {
    id: 'ejercicio-2-sucursal-bancaria',
    title: 'Ejercicio 2: Flujo de Clientes y Riesgo Crediticio en Banco (7 Estados)',
    category: 'Servicios Financieros / Banca',
    description: 'Trayectoria integral del cliente en sucursal bancaria: Lobby, Ventanilla de Caja, Asesoría Comercial, Comité de Riesgo, Desembolso, Cartera en Mora y Recirculación de Nuevos Clientes.',
    didacticNote: 'Cadena regular de 7 estados con bucles de retroalimentación. Permite al Gerente Bancario evaluar cuellos de botella en ventanilla, tasas de abandono en fila y el trade-off entre colocación de cartera y riesgo de mora asintótica.',
    isAperiodic: true,
    isIrreducible: true,
    states: BANK_FLOW_STATES,
    transitionMatrix: matrixBankFlow,
    initialDistribution: initBankFlow,
  },
  {
    id: 'ejercicio-3-cadena-papa-colombia',
    title: 'Ejercicio 3: Cadena de Papa en Colombia (18 Nodos + Mapa)',
    category: 'Logística / Supply Chain',
    description: 'Cadena agroalimentaria del tubérculo papa en Colombia: 5 cultivos (Boyacá, Cundinamarca, Nariño, Antioquia, Cauca), 3 plazas mayoristas (Corabastos, Central Medellín, Cavasa) y 10 tiendas de barrio en Bogotá, Medellín y Cali.',
    didacticNote: 'Sistema estocástico de 18 estados con georreferenciación. El vector estacionario π* revela la acumulación de producto perecedero en cada nodo y permite al Director de Supply Chain mitigar riesgos de pudrición en centros de acopio, predecir el impacto de bloqueos viales y calibrar el nivel de servicio al tendero.',
    isAperiodic: true,
    isIrreducible: true,
    states: POTATO_COLOMBIA_18_NODES,
    transitionMatrix: matrixPotato,
    initialDistribution: initPotato,
  },
  {
    id: 'cadena-papa-colombia',
    title: 'Cadena de Papa en Colombia (18 Nodos)',
    category: 'Logística / Supply Chain',
    description: 'Cadena agroalimentaria del tubérculo papa en Colombia: 5 zonas productoras, 3 plazas mayoristas y 10 tiendas de barrio.',
    didacticNote: 'Sistema estocástico de 18 estados georreferenciado.',
    isAperiodic: true,
    isIrreducible: true,
    states: POTATO_COLOMBIA_18_NODES,
    transitionMatrix: matrixPotato,
    initialDistribution: initPotato,
  },
  {
    id: 'ejercicio-4-logistica-inversa',
    title: 'Ejercicio 4: Logística Inversa, Devoluciones y Auditoría (16 Nodos)',
    category: 'Logística / Supply Chain',
    description: 'Auditoría de reclamaciones, devoluciones por defectos de calidad y garantías desde 10 clientes, retornando a través de minorista, mayorista, planta y atribución de causa raíz a los 3 proveedores.',
    didacticNote: 'Modela la trazabilidad y la resiliencia en logística inversa. Permite evaluar la exposición al riesgo de calidad de cada proveedor (P1, P2, P3) y el tiempo medio de ciclo que tarda una reclamación en ser subsanada.',
    isAperiodic: true,
    isIrreducible: true,
    states: SUPPLY_CHAIN_16_NODES,
    transitionMatrix: matrixReverse,
    initialDistribution: initReverse,
  },
  {
    id: 'cadena-suministro-logistica-inversa',
    title: 'Cadena de Suministro: Logística Inversa y Devoluciones (16 Nodos)',
    category: 'Logística / Supply Chain',
    description: 'Auditoría de reclamaciones, devoluciones por defectos de calidad y garantías desde los 10 clientes, retornando a través de minorista, mayorista, planta y atribución de causa raíz a los 3 proveedores.',
    didacticNote: 'Modela la trazabilidad y la resiliencia en logística inversa.',
    isAperiodic: true,
    isIrreducible: true,
    states: SUPPLY_CHAIN_16_NODES,
    transitionMatrix: matrixReverse,
    initialDistribution: initReverse,
  },
  {
    id: 'cadena-suministro-flujo-directo',
    title: 'Cadena de Suministro: Flujo Directo de Pedidos (16 Nodos)',
    category: 'Logística / Supply Chain',
    description: 'Red completa de 5 eslabones: 3 Proveedores (P1, P2, P3), 1 Planta de Ensamble (PLT), 1 Mayorista (MAY), 1 Minorista (MIN) y 10 Clientes (C1 a C10). Modela el tránsito forward de lotes de pedidos, tiempos de entrega y nivel de servicio.',
    didacticNote: 'Cadena regular ergódica de 16 estados. El vector estacionario π* revela exactamente la proporción de inventario en tránsito (WIP - Work in Process) acumulada en cada eslabón y permite diagnosticar cuellos de botella en la planta y en el centro de distribución.',
    isAperiodic: true,
    isIrreducible: true,
    states: SUPPLY_CHAIN_16_NODES,
    transitionMatrix: matrixForward,
    initialDistribution: initForward,
  },
  {
    id: 'gestion-inventario',
    title: 'Control de Inventario y Abastecimiento (Política s, S)',
    category: 'Logística / Supply Chain',
    description: 'Gestión de inventario en un centro de distribución con revisión periódica. Si el stock cae a s ≤ 1, se emite una orden de reposición inmediata hasta S = 3. La demanda diaria de pedidos es estocástica.',
    didacticNote: 'Cadena regular ergódica e irreducible. Permite calcular analíticamente el Nivel de Servicio Logístico (SL = 1 - π₀), la probabilidad estacionaria de quiebre de stock y la frecuencia óptima de emisión de órdenes de reabastecimiento.',
    isAperiodic: true,
    isIrreducible: true,
    states: [
      { id: 0, name: 'Rotura de Stock (0 uds)', code: 'ROT', color: '#ef4444', x: 0.15, y: 0.50 },
      { id: 1, name: 'Stock Crítico (1 ud)', code: 'CRIT', color: '#f59e0b', x: 0.38, y: 0.25 },
      { id: 2, name: 'Stock Medio (2 uds)', code: 'MED', color: '#38bdf8', x: 0.62, y: 0.25 },
      { id: 3, name: 'Capacidad Máxima (3 uds)', code: 'MAX', color: '#10b981', x: 0.85, y: 0.50 },
    ],
    transitionMatrix: [
      // ROT,  CRIT, MED,  MAX
      [0.00, 0.30, 0.50, 0.20], // Desde ROT (0 uds): se reabastece a 3 y resta demanda
      [0.00, 0.30, 0.50, 0.20], // Desde CRIT (1 ud): se reabastece a 3 y resta demanda
      [0.30, 0.50, 0.20, 0.00], // Desde MED (2 uds): sin reposición (demanda 0, 1 o ≥2)
      [0.00, 0.30, 0.50, 0.20], // Desde MAX (3 uds): sin reposición (demanda 0, 1 o 2)
    ],
    initialDistribution: [0.0, 0.0, 0.0, 1.0], // Comienza con almacén lleno
  },
  {
    id: 'riesgo-transporte',
    title: 'Riesgo y Disrupción en Transporte Multimodal',
    category: 'Logística / Supply Chain',
    description: 'Monitoreo dinámico del estado operativo de un corredor logístico de carga internacional sujeto a congestión aduanera, condiciones climáticas e incidencias de ruta.',
    didacticNote: 'Modela la resiliencia operativa y los tiempos de mitigación en la cadena de suministro. La distribución estacionaria π* determina el porcentaje esperado de envíos que experimentarán demoras y permite calibrar los colchones de tiempo (buffers).',
    isAperiodic: true,
    isIrreducible: true,
    states: [
      { id: 0, name: 'Tránsito Fluido', code: 'FLU', color: '#10b981', x: 0.22, y: 0.35 },
      { id: 1, name: 'Congestión / Demora', code: 'CONG', color: '#f59e0b', x: 0.78, y: 0.35 },
      { id: 2, name: 'Disrupción Crítica', code: 'DISR', color: '#ef4444', x: 0.50, y: 0.82 },
    ],
    transitionMatrix: [
      // FLU,  CONG, DISR
      [0.75, 0.20, 0.05], // Tránsito fluido
      [0.40, 0.45, 0.15], // Congestión moderada
      [0.10, 0.60, 0.30], // Disrupción severa / bloqueo
    ],
    initialDistribution: [1.0, 0.0, 0.0],
  },
  {
    id: 'clima-oz',
    title: 'Clima de Oz (Kemeny & Snell)',
    category: 'Clásica',
    description: 'El célebre modelo meteorológico ergódico introducido por John Kemeny y J. Laurie Snell en 1960.',
    didacticNote: 'Cadena regular ergódica e irreducible. Posee un único autovalor λ₁=1 y un segundo autovalor |λ₂| < 1. Sin importar el estado inicial v₀, v₀ · Pⁿ converge rápidamente a la distribución estacionaria π = [0.40, 0.20, 0.40].',
    isAperiodic: true,
    isIrreducible: true,
    states: [
      { id: 0, name: 'Soleado', code: 'S', color: '#f59e0b', x: 0.22, y: 0.32 },
      { id: 1, name: 'Nublado', code: 'N', color: '#94a3b8', x: 0.78, y: 0.32 },
      { id: 2, name: 'Lluvioso', code: 'L', color: '#0284c7', x: 0.50, y: 0.82 },
    ],
    transitionMatrix: [
      // S,    N,    L
      [0.50, 0.25, 0.25], // Soleado
      [0.50, 0.00, 0.50], // Nublado
      [0.25, 0.25, 0.50], // Lluvioso
    ],
    initialDistribution: [1.0, 0.0, 0.0],
  },
  {
    id: 'ruina-jugador',
    title: 'Ruina del Jugador (Absorbente)',
    category: 'Absorbente',
    description: 'Un sistema con estados de absorción terminal donde un agente transita con probabilidad de incremento p=0.4 o decremento q=0.6 hasta la bancarrota ($0) o la meta ($30).',
    didacticNote: 'Los estados $0 y $30 son absorbentes (P_ii = 1). Los estados $10 y $20 son transitorios. La matriz no es irreducible y π* depende estrictamente de las condiciones iniciales. Permite calcular la matriz fundamental N = (I - Q)⁻¹ para hallar el tiempo medio antes de la absorción.',
    isAperiodic: false,
    isIrreducible: false,
    states: [
      { id: 0, name: 'Bancarrota ($0)', code: '$0', color: '#ef4444', x: 0.15, y: 0.50 },
      { id: 1, name: 'Capital $10', code: '$10', color: '#f97316', x: 0.38, y: 0.50 },
      { id: 2, name: 'Capital $20', code: '$20', color: '#10b981', x: 0.62, y: 0.50 },
      { id: 3, name: 'Meta ($30)', code: '$30', color: '#38bdf8', x: 0.85, y: 0.50 },
    ],
    transitionMatrix: [
      // $0,   $10,  $20,  $30
      [1.00, 0.00, 0.00, 0.00], // $0 (Absorbente)
      [0.60, 0.00, 0.40, 0.00], // $10 (Transitorio)
      [0.00, 0.60, 0.00, 0.40], // $20 (Transitorio)
      [0.00, 0.00, 0.00, 1.00], // $30 (Absorbente)
    ],
    initialDistribution: [0.0, 1.0, 0.0, 0.0],
  },
  {
    id: 'pagerank-web',
    title: 'Algoritmo PageRank (Mini-Web)',
    category: 'Redes',
    description: 'Modelo del navegante aleatorio de Google sobre 4 páginas web conectadas mediante hipervínculos con factor de amortiguamiento α=0.85.',
    didacticNote: 'El vector estacionario π = π · P representa la autoridad o centralidad relativa de cada nodo. La distribución estacionaria calcula de forma exacta el peso de tráfico asintótico.',
    isAperiodic: true,
    isIrreducible: true,
    states: [
      { id: 0, name: 'Página Alpha', code: 'α', color: '#a855f7', x: 0.25, y: 0.25 },
      { id: 1, name: 'Página Beta', code: 'β', color: '#3b82f6', x: 0.75, y: 0.25 },
      { id: 2, name: 'Página Gamma (Hub)', code: 'γ', color: '#10b981', x: 0.75, y: 0.75 },
      { id: 3, name: 'Página Delta', code: 'δ', color: '#ec4899', x: 0.25, y: 0.75 },
    ],
    transitionMatrix: [
      // α,     β,     γ,     δ
      [0.05, 0.45, 0.45, 0.05], // α enlaza a β y γ
      [0.05, 0.05, 0.85, 0.05], // β enlaza fuertemente a γ
      [0.45, 0.05, 0.05, 0.45], // γ distribuye a α y δ
      [0.85, 0.05, 0.05, 0.05], // δ enlaza de vuelta a α
    ],
    initialDistribution: [0.25, 0.25, 0.25, 0.25],
  },
  {
    id: 'cadena-periodica',
    title: 'Oscilador Bipartito (Período d = 2)',
    category: 'Patológica / Periódica',
    description: 'Una cadena irreducible pero estrictamente periódica con período d = 2 entre el Estado Positivo y el Estado Negativo.',
    didacticNote: 'Esta cadena es irreducible pero no aperiódica. Los autovalores son λ₁ = 1 y λ₂ = -1. El vector puntual π^(n) oscila sin converger a un límite estático, mientras que el promedio temporal de Cesàro sí converge a [0.5, 0.5].',
    isAperiodic: false,
    isIrreducible: true,
    states: [
      { id: 0, name: 'Estado Positivo', code: 'E+', color: '#06b6d4', x: 0.30, y: 0.50 },
      { id: 1, name: 'Estado Negativo', code: 'E-', color: '#f43f5e', x: 0.70, y: 0.50 },
    ],
    transitionMatrix: [
      [0.00, 1.00],
      [1.00, 0.00],
    ],
    initialDistribution: [1.0, 0.0],
  },
  {
    id: 'mantenimiento-industrial',
    title: 'Confiabilidad y Mantenimiento de Maquinaria',
    category: 'Biología / Física',
    description: 'Sistema estocástico de degradación de componentes operativos: Operativo Óptimo, Desgaste y En Reparación.',
    didacticNote: 'Modelo estándar en teoría de fiabilidad. Permite determinar el porcentaje asintótico de tiempo que el sistema requerirá mantenimiento preventivo y correctivo.',
    isAperiodic: true,
    isIrreducible: true,
    states: [
      { id: 0, name: 'Operación Óptima', code: 'OPT', color: '#22c55e', x: 0.20, y: 0.40 },
      { id: 1, name: 'Degradación Leve', code: 'DEG', color: '#eab308', x: 0.80, y: 0.40 },
      { id: 2, name: 'Falla / Mantenimiento', code: 'MAN', color: '#ef4444', x: 0.50, y: 0.80 },
    ],
    transitionMatrix: [
      [0.70, 0.25, 0.05],
      [0.00, 0.60, 0.40],
      [0.90, 0.00, 0.10],
    ],
    initialDistribution: [1.0, 0.0, 0.0],
  },
];
