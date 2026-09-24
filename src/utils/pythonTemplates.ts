import { MarkovState } from '../types/markov';

export interface PythonScriptTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

export function generatePythonScripts(
  states: MarkovState[],
  transitionMatrix: number[][],
  initialDistribution: number[]
): PythonScriptTemplate[] {
  const K = states.length;
  const stateNames = states.map(s => `'${s.name}'`).join(', ');
  const stateCodes = states.map(s => `'${s.code}'`).join(', ');
  
  // Format matrix for python
  const matrixStr = transitionMatrix
    .map(row => `    [${row.map(v => v.toFixed(3)).join(', ')}]`)
    .join(',\n');

  const initDistStr = `[${initialDistribution.map(v => v.toFixed(3)).join(', ')}]`;

  // Script 1: Potencias y Convergencia de Probabilidades
  const scriptPotencias = `"""
Markov Lab - Simulación de Cadenas de Markov en Tiempo Discreto (DTMC)
Módulo de Simulación Numérica en Tiempo Discreto
Objetivo: Demostrar la convergencia de P^n hacia la distribución estacionaria pi*.
"""
import numpy as np

# 1. Definición del espacio de estados y matriz de transición estocástica P
estados = [${stateNames}]
codigos = [${stateCodes}]
K = len(estados)

P = np.array([
${matrixStr}
], dtype=np.float64)

# Verificación de la condición estocástica: sum_j P_{ij} = 1
sumas_filas = np.sum(P, axis=1)
print("=== VERIFICACIÓN DE CONDICIÓN ESTOCÁSTICA ===")
for i, s in enumerate(codigos):
    print(f"Fila {s}: suma = {sumas_filas[i]:.6f}")

# 2. Distribución inicial de probabilidad v_0 = P(X_0 = s_i)
v0 = np.array(${initDistStr}, dtype=np.float64)
print(f"\\nDistribución inicial v_0: {v0}")

# 3. Evolución temporal mediante potencias matriciales: v_n = v_0 @ (P^n)
pasos_evaluar = [1, 2, 5, 10, 20, 35, 50]
print("\\n=== EVOLUCIÓN TEMPORAL DE PROBABILIDADES DE ESTADO ===")
print(f"{'Paso n':<8} | " + " | ".join([f"{c:<10}" for c in codigos]) + " | d_TV a P^{50}")

# Calculamos P^50 como aproximación del límite estacionario
P_50 = np.linalg.matrix_power(P, 50)
pi_limite = v0 @ P_50

for n in pasos_evaluar:
    Pn = np.linalg.matrix_power(P, n)
    vn = v0 @ Pn
    # Distancia de variación total: d_TV(vn, pi_lim) = 0.5 * sum(|vn_i - pi_i|)
    d_tv = 0.5 * np.sum(np.abs(vn - pi_limite))
    
    prob_str = " | ".join([f"{p*100:8.2f}%" for p in vn])
    print(f"n = {n:<4} | {prob_str} | {d_tv:.6f}")

print("\\n=== MATRIZ LÍMITE P^50 (FILAS IDÉNTICAS AL VECTOR ESTACIONARIO) ===")
print(np.round(P_50, 4))
`;

  // Script 2: Simulación Monte Carlo de Trayectorias
  const scriptMonteCarlo = `"""
Simulación Monte Carlo de Trayectorias Estocásticas
Objetivo: Verificar empíricamente que la frecuencia de ocupación converge
a la distribución teórica por la Ley de los Grandes Números (LLN).
"""
import numpy as np

estados = [${stateNames}]
codigos = [${stateCodes}]
K = len(estados)

P = np.array([
${matrixStr}
], dtype=np.float64)

v0 = np.array(${initDistStr}, dtype=np.float64)

# Parámetros de la simulación Monte Carlo
NUM_CAMINANTES = 5000
PASOS = 25

print(f"Iniciando simulación Monte Carlo con {NUM_CAMINANTES} caminantes durante {PASOS} pasos...")

# Estado inicial para cada caminante muestreado según v_0
caminantes = np.random.choice(K, size=NUM_CAMINANTES, p=v0)

# Almacenamiento histórico de frecuencias empíricas
historial_empirico = []

for n in range(PASOS + 1):
    # Frecuencia empírica en el paso n
    conteos = np.bincount(caminantes, minlength=K)
    frecuencias = conteos / NUM_CAMINANTES
    historial_empirico.append(frecuencias)
    
    # Probabilidad teórica exacta: v_n = v_0 @ P^n
    Pn = np.linalg.matrix_power(P, n)
    v_teorico = v0 @ Pn
    
    # Error de variación total empírico vs teórico
    d_tv = 0.5 * np.sum(np.abs(frecuencias - v_teorico))
    
    if n in [0, 1, 2, 5, 10, 20, 25]:
        emp_str = " | ".join([f"{f*100:6.2f}%" for f in frecuencias])
        teo_str = " | ".join([f"{t*100:6.2f}%" for t in v_teorico])
        print(f"\\nPaso n={n}:")
        print(f"  Empírico Monte Carlo : [{emp_str}]")
        print(f"  Teórico Analítico    : [{teo_str}]")
        print(f"  Error d_TV           : {d_tv:.5f} (cota teórica 1/sqrt(M) ≈ {1/np.sqrt(NUM_CAMINANTES):.4f})")
    
    # Transición estocástica de cada partícula para el siguiente paso n+1
    nuevos_estados = np.empty_like(caminantes)
    for i in range(K):
        mascara = (caminantes == i)
        if np.any(mascara):
            nuevos_estados[mascara] = np.random.choice(K, size=np.sum(mascara), p=P[i])
    caminantes = nuevos_estados

print("\\n¡Simulación completada! Se verifica la convergencia empírica hacia la distribución teórica.")
`;

  // Script 3: Álgebra Lineal y Autovectores
  const scriptAlgebra = `"""
Cálculo Exacto de la Distribución Estacionaria pi = pi @ P mediante Álgebra Lineal
Objetivo: Resolver el sistema lineal (P^T - I) pi^T = 0 sujeto a sum(pi) = 1
y calcular la tasa de convergencia espectral mediante los autovalores de P.
"""
import numpy as np

P = np.array([
${matrixStr}
], dtype=np.float64)

K = P.shape[0]

# 1. Cálculo de Autovalores y Autovectores de P^T
# La ecuación pi @ P = pi equivale a P^T @ pi^T = 1 * pi^T
autovalores, autovectores_izq = np.linalg.eig(P.T)

print("=== ESPECTRO DE AUTOVALORES ===")
for idx, lam in enumerate(autovalores):
    print(f"lambda_{idx+1}: {lam.real:+.4f}{lam.imag:+.4f}j  | Magnitud: {np.abs(lam):.4f}")

# Hallar el autovector correspondiente a lambda = 1 (Perron-Frobenius)
idx_uno = np.argmin(np.abs(autovalores - 1.0))
vector_pi = autovectores_izq[:, idx_uno].real

# Normalizamos para que la suma sea exactamente 1.0
pi_estacionario = vector_pi / np.sum(vector_pi)

print("\\n=== DISTRIBUCIÓN ESTACIONARIA INVARIANTE pi* ===")
for i in range(K):
    print(f"Estado {i}: pi*_{i} = {pi_estacionario[i]:.6f} ({pi_estacionario[i]*100:.2f}%)")

# Verificación de invariancia: pi* @ P == pi*
pi_despues = pi_estacionario @ P
discrepancia = np.max(np.abs(pi_despues - pi_estacionario))
print(f"\\nDiscrepancia ||pi* @ P - pi*||_inf = {discrepancia:.2e} (Debe ser ~0)")

# 2. Brecha Espectral y Tasa de Mezcla
magnitudes = np.sort(np.abs(autovalores))[::-1]
lambda_2 = magnitudes[1] if len(magnitudes) > 1 else 0.0
brecha_espectral = 1.0 - lambda_2
mixing_time = 1.0 / brecha_espectral if brecha_espectral > 1e-5 else np.inf

print("\\n=== DINÁMICA ESPECTRAL DE CONVERGENCIA ===")
print(f"Segundo autovalor dominante |lambda_2| = {lambda_2:.4f}")
print(f"Brecha espectral gamma = 1 - |lambda_2| = {brecha_espectral:.4f}")
print(f"Tiempo de mezcla estimado tau_mix ≈ 1/gamma = {mixing_time:.2f} pasos")
`;

  // Script 4: Tiempo de Mezcla y Distancia TV
  const scriptTV = `"""
Estudio Cuantitativo del Tiempo de Mezcla y Distancia de Variación Total
d_TV(pi^(n), pi*) = 0.5 * sum_i |pi^(n)_i - pi*_i|
"""
import numpy as np

P = np.array([
${matrixStr}
], dtype=np.float64)

v0 = np.array(${initDistStr}, dtype=np.float64)

# Calculamos distribución estacionaria analítica
autovalores, autovectores = np.linalg.eig(P.T)
idx = np.argmin(np.abs(autovalores - 1.0))
pi_star = autovectores[:, idx].real
pi_star = pi_star / np.sum(pi_star)

print("Paso n | d_TV(pi^(n), pi*) | Cota Teórica C * |lambda_2|^n | Estado de Mezcla")
print("-" * 75)

# Segundo autovalor
mags = np.sort(np.abs(autovalores))[::-1]
lam2 = mags[1] if len(mags) > 1 else 0.0

for n in range(0, 31, 2):
    Pn = np.linalg.matrix_power(P, n)
    vn = v0 @ Pn
    dtv = 0.5 * np.sum(np.abs(vn - pi_star))
    cota = (lam2 ** n) if lam2 < 1.0 else 1.0
    
    estado = "¡EQUILIBRIO!" if dtv < 0.005 else "En transición..."
    print(f"  {n:2d}   |     {dtv:.6f}     |         {cota:.6f}         | {estado}")
`;

  return [
    {
      id: 'potencias',
      name: '1. Potencias Matriciales (P^n)',
      description: 'Calcula P^n y observa cómo las filas convergen al vector estacionario pi*.',
      code: scriptPotencias,
    },
    {
      id: 'monte-carlo',
      name: '2. Simulación Monte Carlo (M=5,000)',
      description: 'Simula 5,000 caminantes aleatorios y compara la frecuencia empírica con la analítica.',
      code: scriptMonteCarlo,
    },
    {
      id: 'algebra',
      name: '3. Autovectores & Brecha Espectral',
      description: 'Halla pi* resolviendo (P^T - I)pi=0 y analiza lambda_2 con np.linalg.eig.',
      code: scriptAlgebra,
    },
    {
      id: 'variacion-total',
      name: '4. Distancia de Variación Total (d_TV)',
      description: 'Cuantifica el decaimiento de d_TV(pi^(n), pi*) y la cota geométrica O(|lambda_2|^n).',
      code: scriptTV,
    },
  ];
}
