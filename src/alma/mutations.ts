/**
 * ALMA Mutation Strategies
 * Different approaches to evolve memory designs
 */

import { MemoryDesignParams, ParameterConstraints } from './types';

/**
 * Gaussian mutation: add small random values to parameters
 */
export function gaussianMutation(
  params: MemoryDesignParams,
  constraints: ParameterConstraints,
  stdDev: number = 0.1
): MemoryDesignParams {
  const mutated = { ...params };

  for (const [key, constraint] of Object.entries(constraints)) {
    if (constraint.type === 'number') {
      const current = (params[key] ?? 0) as number;
      const min = constraint.min ?? 0;
      const max = constraint.max ?? 1;
      const range = max - min;

      // Box-Muller transform for Gaussian distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const delta = z * stdDev * range;

      mutated[key] = Math.max(min, Math.min(max, current + delta));
    }
  }

  return mutated;
}

/**
 * Simulated annealing: occasionally jump to random state
 */
export function simulatedAnnealingMutation(
  params: MemoryDesignParams,
  constraints: ParameterConstraints,
  temperature: number = 0.5
): MemoryDesignParams {
  const mutated = { ...params };

  for (const [key, constraint] of Object.entries(constraints)) {
    if (constraint.type === 'number') {
      // With probability proportional to temperature, jump to random value
      if (Math.random() < temperature) {
        const min = constraint.min ?? 0;
        const max = constraint.max ?? 1;
        mutated[key] = Math.random() * (max - min) + min;
      } else {
        // Otherwise small Gaussian shift
        const current = (params[key] ?? 0) as number;
        const delta = (Math.random() - 0.5) * (1 - temperature);
        mutated[key] = current + delta;
      }
    }
  }

  return mutated;
}

/**
 * Crossover: blend two designs
 */
export function crossoverMutation(
  parent1: MemoryDesignParams,
  parent2: MemoryDesignParams,
  constraints: ParameterConstraints
): MemoryDesignParams {
  const child: MemoryDesignParams = {};

  for (const key of Object.keys(constraints)) {
    // Uniform crossover: 50% chance from each parent
    const useParent1 = Math.random() > 0.5;
    child[key] = useParent1 ? parent1[key] : parent2[key];
  }

  return child;
}

/**
 * Adaptive mutation: mutation strength adapts based on fitness plateau
 */
export function adaptiveMutation(
  params: MemoryDesignParams,
  constraints: ParameterConstraints,
  recentScores: number[]
): MemoryDesignParams {
  // If fitness is stagnating (low variance), increase mutation strength
  const variance = calculateVariance(recentScores);
  const mutationStrength = variance < 0.01 ? 0.3 : 0.1;

  return gaussianMutation(params, constraints, mutationStrength);
}

/**
 * Helper: calculate variance of recent scores
 */
function calculateVariance(scores: number[]): number {
  if (scores.length < 2) return 0;

  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b) / scores.length;
}
