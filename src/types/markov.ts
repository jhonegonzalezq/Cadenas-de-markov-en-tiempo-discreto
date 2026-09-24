export interface MarkovState {
  id: number;
  name: string;
  code: string;
  color: string; // Tailwind hex color
  x: number; // Normalized coordinate 0..1 in canvas
  y: number; // Normalized coordinate 0..1 in canvas
  tier?: 'supplier' | 'plant' | 'wholesaler' | 'retailer' | 'customer';
  tierLabel?: string;
  city?: string;
  department?: string;
  capacityOrDemand?: string;
  pricePerKg?: number;
  varietyOrType?: string;
  geo?: { lat: number; lng: number };
}

export interface MarkovPreset {
  id: string;
  title: string;
  category:
    | 'Confiabilidad / Manufactura'
    | 'Servicios Financieros / Banca'
    | 'Logística / Supply Chain'
    | 'Clásica'
    | 'Absorbente'
    | 'Redes'
    | 'Patológica / Periódica'
    | 'Biología / Física'
    | string;
  description: string;
  didacticNote: string;
  states: MarkovState[];
  transitionMatrix: number[][];
  initialDistribution: number[];
  isAperiodic: boolean;
  isIrreducible: boolean;
}

export interface ChainProperties {
  isIrreducible: boolean;
  isAperiodic: boolean;
  isErgodic: boolean;
  hasAbsorbingStates: boolean;
  absorbingStates: number[];
  transientStates: number[];
  period: number;
  eigenvalues: { re: number; im: number; magnitude: number }[];
  spectralGap: number; // 1 - |lambda_2|
  mixingTimeEstimate: number; // approx 1 / (1 - |lambda_2|)
}

export interface SimulationStepRecord {
  step: number;
  distribution: number[];
  stateFrequencies?: number[];
  totalVariationDistance?: number;
}

export interface WalkerPosition {
  currentState: number;
  previousState: number;
  progress: number; // 0 to 1 during transition animation
  isMoving: boolean;
}
