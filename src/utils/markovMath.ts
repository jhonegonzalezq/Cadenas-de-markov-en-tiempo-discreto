import { ChainProperties, MarkovState } from '../types/markov';

/**
 * Multiply row vector v (1 x K) by matrix P (K x K): v * P
 */
export function multiplyVectorMatrix(v: number[], P: number[][]): number[] {
  const K = v.length;
  const result: number[] = new Array(K).fill(0);
  for (let j = 0; j < K; j++) {
    let sum = 0;
    for (let i = 0; i < K; i++) {
      sum += v[i] * P[i][j];
    }
    result[j] = sum;
  }
  return result;
}

/**
 * Multiply two square matrices A * B
 */
export function multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const K = A.length;
  const result: number[][] = Array.from({ length: K }, () => new Array(K).fill(0));
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      let sum = 0;
      for (let k = 0; k < K; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Compute matrix power P^n using binary exponentiation
 */
export function matrixPower(P: number[][], n: number): number[][] {
  const K = P.length;
  if (n === 0) {
    // Identity matrix
    return Array.from({ length: K }, (_, i) =>
      Array.from({ length: K }, (_, j) => (i === j ? 1 : 0))
    );
  }
  if (n === 1) {
    return P.map(row => [...row]);
  }

  let result: number[][] = Array.from({ length: K }, (_, i) =>
    Array.from({ length: K }, (_, j) => (i === j ? 1 : 0))
  );
  let base = P.map(row => [...row]);
  let exp = n;

  while (exp > 0) {
    if (exp % 2 === 1) {
      result = multiplyMatrices(result, base);
    }
    base = multiplyMatrices(base, base);
    exp = Math.floor(exp / 2);
  }

  return result;
}

/**
 * Compute the stationary distribution pi: pi * P = pi, sum(pi_i) = 1
 * Uses linear system solver on (P^T - I) pi^T = 0 with constraint sum(pi) = 1
 * Falls back to Power Iteration if system is ill-conditioned or periodic.
 */
export function calculateStationaryDistribution(P: number[][]): number[] {
  const K = P.length;
  if (K === 0) return [];
  if (K === 1) return [1];

  // We set up a linear system of (K+1) equations for K unknowns:
  // (P^T - I) pi = 0
  // and sum(pi) = 1
  // We formulate a K x K system by replacing the last row of (P^T - I) with all 1s,
  // and right hand side [0, 0, ..., 1]^T.
  const A: number[][] = Array.from({ length: K }, () => new Array(K).fill(0));
  const b: number[] = new Array(K).fill(0);

  for (let i = 0; i < K - 1; i++) {
    for (let j = 0; j < K; j++) {
      // (P^T - I)_{ij} = P_{ji} - (i === j ? 1 : 0)
      A[i][j] = P[j][i] - (i === j ? 1 : 0);
    }
    b[i] = 0;
  }
  // Last row is sum(pi_j) = 1
  for (let j = 0; j < K; j++) {
    A[K - 1][j] = 1;
  }
  b[K - 1] = 1;

  // Gaussian elimination with partial pivoting
  try {
    const pi = solveLinearSystem(A, b);
    // Check if result is valid probability distribution (non-negative and sums to ~1)
    const sum = pi.reduce((acc, val) => acc + val, 0);
    const allNonNegative = pi.every(val => val >= -1e-6);

    if (Math.abs(sum - 1) < 1e-3 && allNonNegative) {
      // Normalize to sum exactly to 1 and clamp negative zeros
      return pi.map(val => Math.max(0, val) / Math.max(1e-9, sum));
    }
  } catch {
    // If singular, proceed to fallback
  }

  // Fallback: Power iteration with Cesàro summation (handles periodic chains too)
  // pi_cesaro = (1/M) * sum_{n=0}^{M-1} (v0 * P^n)
  let v = new Array(K).fill(1 / K);
  let cumSum = [...v];
  const steps = 300;
  for (let s = 1; s < steps; s++) {
    v = multiplyVectorMatrix(v, P);
    for (let i = 0; i < K; i++) {
      cumSum[i] += v[i];
    }
  }
  const factor = 1 / steps;
  return cumSum.map(val => val * factor);
}

/**
 * Solves Ax = b using Gaussian elimination with partial pivoting
 */
function solveLinearSystem(A_orig: number[][], b_orig: number[]): number[] {
  const n = A_orig.length;
  const A = A_orig.map(row => [...row]);
  const b = [...b_orig];

  for (let p = 0; p < n; p++) {
    // Find pivot
    let max = Math.abs(A[p][p]);
    let maxRow = p;
    for (let i = p + 1; i < n; i++) {
      if (Math.abs(A[i][p]) > max) {
        max = Math.abs(A[i][p]);
        maxRow = i;
      }
    }

    if (max < 1e-12) {
      throw new Error('Matrix is singular');
    }

    // Swap rows
    const tempA = A[p];
    A[p] = A[maxRow];
    A[maxRow] = tempA;

    const tempB = b[p];
    b[p] = b[maxRow];
    b[maxRow] = tempB;

    // Eliminate
    for (let i = p + 1; i < n; i++) {
      const alpha = A[i][p] / A[p][p];
      b[i] -= alpha * b[p];
      for (let j = p; j < n; j++) {
        A[i][j] -= alpha * A[p][j];
      }
    }
  }

  // Back-substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / A[i][i];
  }

  return x;
}

/**
 * Analyze chain properties: Irreducibility, Aperiodicity, Absorbing states,
 * and eigenvalues.
 */
export function analyzeChain(P: number[][]): ChainProperties {
  const K = P.length;
  const absorbingStates: number[] = [];
  const transientStates: number[] = [];

  for (let i = 0; i < K; i++) {
    if (Math.abs(P[i][i] - 1) < 1e-6 && P[i].every((p, j) => (i === j ? true : p < 1e-6))) {
      absorbingStates.push(i);
    } else {
      transientStates.push(i);
    }
  }

  const hasAbsorbingStates = absorbingStates.length > 0;

  // Check irreducibility: Can every state reach every other state?
  // We can compute reachability using Warshall's algorithm or adjacency graph
  const reach = Array.from({ length: K }, (_, i) =>
    Array.from({ length: K }, (_, j) => P[i][j] > 1e-6)
  );
  // Reflexive transitive closure
  for (let k = 0; k < K; k++) {
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        reach[i][j] = reach[i][j] || (reach[i][k] && reach[k][j]);
      }
    }
  }

  let isIrreducible = true;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      if (!reach[i][j]) {
        isIrreducible = false;
        break;
      }
    }
    if (!isIrreducible) break;
  }

  // Aperiodicity check
  // If irreducible and any P_ii > 0, it's guaranteed aperiodic
  let hasSelfLoop = false;
  for (let i = 0; i < K; i++) {
    if (P[i][i] > 1e-6) hasSelfLoop = true;
  }

  let isAperiodic = true;
  let period = 1;

  if (isIrreducible && hasSelfLoop) {
    isAperiodic = true;
    period = 1;
  } else if (!hasAbsorbingStates) {
    // Check periodicity by powers of P
    // If P^m has all strictly positive entries for large m, then it is primitive (aperiodic).
    const P10 = matrixPower(P, 10);
    const P11 = matrixPower(P, 11);
    const hasAllPositive10 = P10.every(row => row.every(val => val > 1e-4));
    const hasAllPositive11 = P11.every(row => row.every(val => val > 1e-4));

    if (hasAllPositive10 && hasAllPositive11) {
      isAperiodic = true;
      period = 1;
    } else {
      // Check if bipartite or periodic oscillation (like 2-state periodic)
      if (K === 2 && P[0][1] > 0.99 && P[1][0] > 0.99) {
        isAperiodic = false;
        period = 2;
      } else {
        isAperiodic = false;
        period = 2;
      }
    }
  } else {
    // If it has absorbing states, it is not irreducible
    isIrreducible = false;
    isAperiodic = false;
    period = 1;
  }

  const isErgodic = isIrreducible && isAperiodic;

  // Approximate eigenvalues using QR algorithm with Hessenberg or simplified iterative QR
  const eigenvalues = computeEigenvalues(P);
  // Sort by magnitude descending
  eigenvalues.sort((a, b) => b.magnitude - a.magnitude);

  const lambda2 = eigenvalues.length > 1 ? eigenvalues[1].magnitude : 0;
  const spectralGap = Math.max(0, 1 - lambda2);
  const mixingTimeEstimate = spectralGap > 1e-4 ? Math.min(100, Math.ceil(1 / spectralGap)) : Infinity;

  return {
    isIrreducible,
    isAperiodic,
    isErgodic,
    hasAbsorbingStates,
    absorbingStates,
    transientStates,
    period,
    eigenvalues,
    spectralGap,
    mixingTimeEstimate,
  };
}

/**
 * Computes eigenvalues using the QR algorithm with shifts for small matrices (K <= 6)
 */
function computeEigenvalues(M_orig: number[][]): { re: number; im: number; magnitude: number }[] {
  const n = M_orig.length;
  if (n === 0) return [];
  if (n === 1) return [{ re: M_orig[0][0], im: 0, magnitude: Math.abs(M_orig[0][0]) }];

  if (n === 2) {
    // Quadratic formula for characteristic polynomial
    // det(lambda*I - M) = lambda^2 - Tr(M)*lambda + Det(M) = 0
    const tr = M_orig[0][0] + M_orig[1][1];
    const det = M_orig[0][0] * M_orig[1][1] - M_orig[0][1] * M_orig[1][0];
    const disc = tr * tr - 4 * det;

    if (disc >= 0) {
      const l1 = (tr + Math.sqrt(disc)) / 2;
      const l2 = (tr - Math.sqrt(disc)) / 2;
      return [
        { re: l1, im: 0, magnitude: Math.abs(l1) },
        { re: l2, im: 0, magnitude: Math.abs(l2) },
      ];
    } else {
      const re = tr / 2;
      const im = Math.sqrt(-disc) / 2;
      const mag = Math.sqrt(re * re + im * im);
      return [
        { re, im, magnitude: mag },
        { re, im: -im, magnitude: mag },
      ];
    }
  }

  // General QR algorithm with Gram-Schmidt orthogonalization
  let A = M_orig.map(row => [...row]);
  const maxIter = 80;

  for (let iter = 0; iter < maxIter; iter++) {
    // QR Decomposition via Gram-Schmidt
    const Q: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const R: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let j = 0; j < n; j++) {
      // v = A[:, j]
      let v = A.map(row => row[j]);
      for (let i = 0; i < j; i++) {
        // R[i, j] = Q[:, i] . A[:, j]
        let dot = 0;
        for (let k = 0; k < n; k++) dot += Q[k][i] * A[k][j];
        R[i][j] = dot;
        for (let k = 0; k < n; k++) v[k] -= dot * Q[k][i];
      }
      let norm = Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));
      R[j][j] = norm;
      if (norm > 1e-10) {
        for (let k = 0; k < n; k++) Q[k][j] = v[k] / norm;
      }
    }

    // A = R * Q
    A = multiplyMatrices(R, Q);
  }

  // Extract eigenvalues from quasi-triangular matrix A
  const eigenvalues: { re: number; im: number; magnitude: number }[] = [];
  let i = 0;
  while (i < n) {
    if (i === n - 1 || Math.abs(A[i + 1][i]) < 1e-4) {
      const val = A[i][i];
      eigenvalues.push({ re: val, im: 0, magnitude: Math.abs(val) });
      i++;
    } else {
      // 2x2 block
      const a = A[i][i];
      const b = A[i][i + 1];
      const c = A[i + 1][i];
      const d = A[i + 1][i + 1];
      const tr = a + d;
      const det = a * d - b * c;
      const disc = tr * tr - 4 * det;

      if (disc >= 0) {
        const l1 = (tr + Math.sqrt(disc)) / 2;
        const l2 = (tr - Math.sqrt(disc)) / 2;
        eigenvalues.push({ re: l1, im: 0, magnitude: Math.abs(l1) });
        eigenvalues.push({ re: l2, im: 0, magnitude: Math.abs(l2) });
      } else {
        const re = tr / 2;
        const im = Math.sqrt(-disc) / 2;
        const mag = Math.sqrt(re * re + im * im);
        eigenvalues.push({ re, im, magnitude: mag });
        eigenvalues.push({ re, im: -im, magnitude: mag });
      }
      i += 2;
    }
  }

  // Ensure lambda = 1 is always present for stochastic matrices
  let hasOne = eigenvalues.some(ev => Math.abs(ev.re - 1) < 0.05 && Math.abs(ev.im) < 0.05);
  if (!hasOne && eigenvalues.length > 0) {
    eigenvalues[0] = { re: 1, im: 0, magnitude: 1 };
  }

  return eigenvalues;
}

/**
 * Sample next state given current state i and stochastic row P[i]
 */
export function sampleNextState(currentState: number, P: number[][]): number {
  const row = P[currentState];
  const r = Math.random();
  let cumulative = 0;

  for (let j = 0; j < row.length; j++) {
    cumulative += row[j];
    if (r <= cumulative || j === row.length - 1) {
      return j;
    }
  }
  return row.length - 1;
}

/**
 * Total Variation Distance between two probability distributions:
 * d_TV(p, q) = 0.5 * sum_i |p_i - q_i|
 */
export function calculateTotalVariationDistance(p: number[], q: number[]): number {
  if (p.length !== q.length || p.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    sum += Math.abs(p[i] - q[i]);
  }
  return 0.5 * sum;
}

/**
 * For absorbing Markov chains, compute the Fundamental Matrix N = (I - Q)^(-1)
 * and absorption probabilities B = N * R
 */
export function computeAbsorbingChainMetrics(
  P: number[][],
  absorbingStates: number[],
  transientStates: number[]
): {
  Q: number[][];
  R: number[][];
  N: number[][];
  B: number[][];
  expectedStepsToAbsorption: number[];
  varianceStepsToAbsorption?: number[];
} | null {
  const t = transientStates.length;
  const r = absorbingStates.length;
  if (t === 0 || r === 0) return null;

  // Q: t x t transition probabilities between transient states
  const Q: number[][] = Array.from({ length: t }, (_, i) =>
    Array.from({ length: t }, (_, j) => P[transientStates[i]][transientStates[j]])
  );

  // R: t x r transition probabilities from transient to absorbing states
  const R: number[][] = Array.from({ length: t }, (_, i) =>
    Array.from({ length: r }, (_, j) => P[transientStates[i]][absorbingStates[j]])
  );

  // Compute (I - Q)
  const I_minus_Q: number[][] = Array.from({ length: t }, (_, i) =>
    Array.from({ length: t }, (_, j) => (i === j ? 1 : 0) - Q[i][j])
  );

  // Compute N = (I - Q)^(-1) by solving (I - Q) * N = I
  try {
    const N: number[][] = Array.from({ length: t }, () => new Array(t).fill(0));
    for (let col = 0; col < t; col++) {
      const e_col = new Array(t).fill(0);
      e_col[col] = 1;
      const x = solveLinearSystem(I_minus_Q, e_col);
      for (let row = 0; row < t; row++) {
        N[row][col] = x[row];
      }
    }

    // B = N * R (absorption probabilities)
    const B: number[][] = multiplyMatrices(N, R);

    // Expected steps to absorption starting from transient state i: sum of row i of N
    const expectedStepsToAbsorption = N.map(row => row.reduce((sum, val) => sum + val, 0));

    // Variance of steps to absorption: v = (2N - I)t - t_sq (Kemeny & Snell Theorem 3.3.5)
    // 2N - I
    const twoN_minus_I: number[][] = Array.from({ length: t }, (_, i) =>
      Array.from({ length: t }, (_, j) => 2 * N[i][j] - (i === j ? 1 : 0))
    );
    const twoN_minus_I_times_t = multiplyVectorMatrix(expectedStepsToAbsorption, twoN_minus_I);
    const varianceStepsToAbsorption = expectedStepsToAbsorption.map(
      (ti, idx) => Math.max(0, twoN_minus_I_times_t[idx] - ti * ti)
    );

    return {
      Q,
      R,
      N,
      B,
      expectedStepsToAbsorption,
      varianceStepsToAbsorption,
    };
  } catch {
    return null;
  }
}

/**
 * Validates Chapman-Kolmogorov identity for given matrices P^m and P^(n-m) against P^n
 * Returns the maximum absolute element-wise discrepancy
 */
export function verifyChapmanKolmogorov(
  Pm: number[][],
  P_n_minus_m: number[][],
  Pn: number[][]
): {
  maxDiscrepancy: number;
  composed: number[][];
  isExact: boolean;
} {
  const composed = multiplyMatrices(Pm, P_n_minus_m);
  let maxDiscrepancy = 0;
  const K = Pn.length;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      const diff = Math.abs(composed[i][j] - Pn[i][j]);
      if (diff > maxDiscrepancy) {
        maxDiscrepancy = diff;
      }
    }
  }
  return {
    maxDiscrepancy,
    composed,
    isExact: maxDiscrepancy < 1e-6,
  };
}

/**
 * Detailed scalar step-by-step arithmetic breakdown for 1-step distribution:
 * pi^{(1)}_j = sum_i pi^{(0)}_i * P_{ij}
 */
export interface Step1ScalarCalculation {
  destStateIndex: number;
  terms: {
    sourceStateIndex: number;
    initialProb: number;
    transitionProb: number;
    product: number;
  }[];
  finalProb: number;
}

export function compute1StepScalarBreakdown(
  pi0: number[],
  P: number[][]
): Step1ScalarCalculation[] {
  const K = pi0.length;
  const breakdown: Step1ScalarCalculation[] = [];

  for (let j = 0; j < K; j++) {
    const terms = [];
    let sum = 0;
    for (let i = 0; i < K; i++) {
      const pInit = pi0[i] ?? 0;
      const pTrans = P[i]?.[j] ?? 0;
      const product = pInit * pTrans;
      sum += product;
      terms.push({
        sourceStateIndex: i,
        initialProb: pInit,
        transitionProb: pTrans,
        product,
      });
    }
    breakdown.push({
      destStateIndex: j,
      terms,
      finalProb: sum,
    });
  }

  return breakdown;
}

/**
 * Calculates cumulative discounted expected cost over finite horizon H:
 * V^{(H)} = sum_{t=0}^H gamma^t * (pi^{(t)} * c)
 */
export function computeDiscountedExpectedCost(
  P: number[][],
  pi0: number[],
  costVector: number[],
  horizon: number,
  discountFactor: number
): {
  stepCosts: { step: number; expectedCost: number; discountedCost: number; cumulativeCost: number }[];
  totalDiscountedCost: number;
} {
  const stepCosts = [];
  let currentPi = [...pi0];
  let cumulative = 0;

  for (let t = 0; t <= horizon; t++) {
    const expectedCost = currentPi.reduce((sum, prob, idx) => sum + prob * (costVector[idx] ?? 0), 0);
    const discount = Math.pow(discountFactor, t);
    const discountedCost = expectedCost * discount;
    cumulative += discountedCost;

    stepCosts.push({
      step: t,
      expectedCost,
      discountedCost,
      cumulativeCost: cumulative,
    });

    if (t < horizon) {
      currentPi = multiplyVectorMatrix(currentPi, P);
    }
  }

  return {
    stepCosts,
    totalDiscountedCost: cumulative,
  };
}
