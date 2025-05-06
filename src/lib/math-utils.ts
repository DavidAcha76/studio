/**
 * Calculates the Cumulative Distribution Function (CDF) for a Continuous Uniform Distribution.
 * F(x) = 0 for x < a
 * F(x) = (x - a) / (b - a) for a <= x <= b
 * F(x) = 1 for x > b
 * @param a Lower bound of the interval.
 * @param b Upper bound of the interval.
 * @param x The value at which to evaluate the CDF.
 * @returns The value of the CDF F(x).
 */
export function continuousUniformCDF(a: number, b: number, x: number): number {
  if (a >= b) {
    return NaN; // Or throw an error, depending on how you want to handle invalid intervals
  }
  if (x < a) {
    return 0;
  }
  if (x > b) {
    return 1;
  }
  return (x - a) / (b - a);
}
/**
 * Calculates the factorial of a non-negative integer.
 * @param n The non-negative integer.
 * @returns The factorial of n.
 */
export function factorial(n: number): number {
  if (n < 0) {
    throw new Error("Factorial is not defined for negative numbers.");
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  // Handle potential overflow for very large numbers, return Infinity if needed
  return isFinite(result) ? result : Infinity;
}

/**
 * Calculates the number of combinations (n choose k).
 * C(n, k) = n! / (k! * (n-k)!)
 * Uses logarithms for better numerical stability with large numbers.
 * @param n Total number of items.
 * @param k Number of items to choose.
 * @returns The number of combinations.
 */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  if (k === 0 || k === n) {
    return 1;
  }
  // Optimization: C(n, k) === C(n, n-k)
  if (k > n / 2) {
    k = n - k;
  }

  // Using direct formula for smaller numbers to avoid log overhead
  // Threshold can be adjusted based on performance testing
  if (n < 30) {
      const factN = factorial(n);
      const factK = factorial(k);
      const factNK = factorial(n - k);

      if (factK === Infinity || factNK === Infinity || factN === Infinity) {
         // If any intermediate factorial is Infinity, use log method
         // This path might still be needed if n >= 30 but k is small
      } else if (factK > 0 && factNK > 0) {
         const result = factN / (factK * factNK);
         return isFinite(result) ? Math.round(result) : Infinity; // Round to handle potential floating point inaccuracies
      } else {
         return Infinity; // Avoid division by zero, though factorials shouldn't be zero here
      }
  }

  // Use logarithmic approach for larger numbers to prevent overflow
  let logResult = 0;
  for (let i = 0; i < k; i++) {
    logResult += Math.log(n - i) - Math.log(i + 1);
  }

  const result = Math.exp(logResult);
  // Round result as combinations should be integers
  // Add tolerance for floating point errors before rounding
  return isFinite(result) ? Math.round(result + 1e-9) : Infinity;
}

/**
 * Calculates the Poisson Probability Mass Function (PMF).
 * P(X = k) = (e^-lambda * lambda^k) / k!
 * @param lambda Average rate (λ).
 * @param k Number of events.
 * @returns The probability P(X = k).
 */
export function poissonPMF(lambda: number, k: number): number {
  if (lambda < 0 || k < 0 || !Number.isInteger(k)) {
    return 0; // Or throw error based on desired behavior
  }
   // Use logarithms for large lambda or k to avoid intermediate overflow/underflow
  if (lambda > 700 || k > 170) { // exp(-700) is close to smallest representable positive number, 170! is close to max factorial
    const logP = -lambda + k * Math.log(lambda) - logFactorial(k);
    const p = Math.exp(logP);
    return isFinite(p) ? p : 0; // Return 0 if result is too small (underflow)
  } else {
    const factK = factorial(k);
    if (factK === Infinity) return 0; // If factorial overflows, probability is effectively 0
     const p = (Math.exp(-lambda) * Math.pow(lambda, k)) / factK;
    return isFinite(p) ? p : 0; // Return 0 if result underflows
  }
}


/**
 * Calculates the natural logarithm of the factorial of n.
 * ln(n!) = ln(1) + ln(2) + ... + ln(n)
 * More stable than calculating factorial directly for large n.
 * @param n Non-negative integer.
 * @returns ln(n!)
 */
function logFactorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
      throw new Error("LogFactorial requires a non-negative integer.");
  }
  if (n === 0 || n === 1) {
    return 0; // ln(1) = 0
  }
  // Use Gamma function approximation (Stirling's approximation related) for large n if needed
  // Or simply sum logarithms
  let logFact = 0;
  for (let i = 2; i <= n; i++) {
    logFact += Math.log(i);
  }
  return logFact;
}


/**
 * Calculates the Hypergeometric Probability Mass Function (PMF).
 * P(X = k) = [C(K, k) * C(N-K, n-k)] / C(N, n)
 * @param N Population size.
 * @param K Number of success states in the population.
 * @param n Sample size (number of draws).
 * @param k Number of observed successes in the sample.
 * @returns The probability P(X = k).
 */
export function hypergeometricPMF(N: number, K: number, n: number, k: number): number {
  if (
    k < 0 ||
    n < 0 ||
    K < 0 ||
    N < 0 ||
    !Number.isInteger(N) ||
    !Number.isInteger(K) ||
    !Number.isInteger(n) ||
    !Number.isInteger(k) ||
    K > N || // Number of successes cannot exceed population size
    n > N || // Sample size cannot exceed population size
    k > n || // Observed successes cannot exceed sample size
    k > K || // Observed successes cannot exceed total successes in population
    (n - k) > (N - K) // Number of failures in sample cannot exceed failures in population
  ) {
    return 0; // Probability is 0 for invalid parameters or impossible scenarios
  }

  const combinations_K_k = combinations(K, k);
  const combinations_NK_nk = combinations(N - K, n - k);
  const combinations_N_n = combinations(N, n);

  // Handle potential division by zero or Infinity results
  if (combinations_N_n === 0 || combinations_N_n === Infinity) {
    // If denominator is 0 or Inf, the direct calculation is problematic.
    // If numerator terms are finite and denominator is Inf, result is 0.
    if (combinations_K_k !== Infinity && combinations_NK_nk !== Infinity && combinations_N_n === Infinity) {
      return 0;
    }
    // If denominator is 0 (unlikely for valid combinations) or numerator has Inf, result might be NaN or Inf.
    // Consider returning 0 for simplicity or handle based on specific needs (e.g., log probabilities).
    // Returning 0 is generally safe as these conditions often imply impossible scenarios.
    return 0;
  }

   if (combinations_K_k === Infinity || combinations_NK_nk === Infinity) {
     // If numerator has infinity, but denominator is finite, result is effectively infinity (or practically 1 if it's a probability distribution, check constraints)
     // Given the constraints, this shouldn't happen if parameters are valid. If it does, might indicate an issue. Return 0 for safety.
     return 0;
   }

  const probability = (combinations_K_k * combinations_NK_nk) / combinations_N_n;

  // Clamp probability between 0 and 1 due to potential floating point inaccuracies
  return Math.max(0, Math.min(1, probability));
}

/**
 * Calculates the mean (expected value) of a Hypergeometric distribution.
 * E[X] = n * (K / N)
 * @param N Population size.
 * @param K Number of success states in the population.
 * @param n Sample size (number of draws).
 * @returns The mean.
 */
export function hypergeometricMean(N: number, K: number, n: number): number {
   if (N <= 0) return NaN; // Avoid division by zero
   return n * (K / N);
}

/**
* Calculates the variance of a Hypergeometric distribution.
* Var(X) = n * (K / N) * ( (N - K) / N ) * ( (N - n) / (N - 1) )
* @param N Population size.
* @param K Number of success states in the population.
* @param n Sample size (number of draws).
* @returns The variance.
*/
export function hypergeometricVariance(N: number, K: number, n: number): number {
   if (N <= 1) return NaN; // Avoid division by zero in the last term
   const p = K / N;
   const variance = n * p * (1 - p) * ((N - n) / (N - 1));
   return variance >= 0 ? variance : 0; // Ensure variance is non-negative
}

/**
 * Calculates the standard deviation of a Hypergeometric distribution.
 * SD(X) = sqrt(Var(X))
 * @param N Population size.
 * @param K Number of success states in the population.
 * @param n Sample size (number of draws).
 * @returns The standard deviation.
 */
export function hypergeometricStdDev(N: number, K: number, n: number): number {
   const variance = hypergeometricVariance(N, K, n);
   return isNaN(variance) ? NaN : Math.sqrt(variance);
}


/**
 * Calculates the Probability Density Function (PDF) for a Continuous Uniform Distribution.
 * f(x) = 1 / (b - a) for a <= x <= b
 * f(x) = 0 otherwise
 * @param a Lower bound of the interval.
 * @param b Upper bound of the interval.
 * @param x The value at which to evaluate the PDF.
 * @returns The value of the PDF f(x).
 */
export function continuousUniformPDF(a: number, b: number, x: number): number {
  if (a >= b) {
    // Or throw error, depending on desired behavior for invalid intervals
    return 0; 
  }
  if (x >= a && x <= b) {
    return 1 / (b - a);
  }
  return 0;
}

/**
 * Calculates the probability P(x1 <= X <= x2) for a Continuous Uniform Distribution.
 * P(x1 <= X <= x2) = (x2_clamped - x1_clamped) / (b - a)
 * Values of x1 and x2 are clamped to the interval [a, b].
 * If x1 > x2, their values are swapped.
 * @param a Lower bound of the distribution interval.
 * @param b Upper bound of the distribution interval.
 * @param val1 First value of the sub-interval.
 * @param val2 Second value of the sub-interval.
 * @returns The probability P(x1 <= X <= x2).
 */
export function continuousUniformProbabilityInRange(a: number, b: number, val1: number, val2: number): number {
  if (a >= b) {
    return 0; // Invalid distribution interval
  }

  let x1 = val1;
  let x2 = val2;

  // Swap if x1 > x2
  if (x1 > x2) {
    [x1, x2] = [x2, x1];
  }

  // Clamp x1 and x2 to the interval [a, b]
  const x1Clamped = Math.max(a, Math.min(b, x1));
  const x2Clamped = Math.max(a, Math.min(b, x2));
  
  // If the clamped interval is invalid (e.g. x2_clamped < x1_clamped, which can happen if original range was outside [a,b])
  if (x2Clamped <= x1Clamped) {
    return 0;
  }

  return (x2Clamped - x1Clamped) / (b - a);
}


/**
 * Calculates the mean (expected value) of a Continuous Uniform Distribution.
 * E(X) = (a + b) / 2
 * @param a Lower bound of the interval.
 * @param b Upper bound of the interval.
 * @returns The mean.
 */
export function continuousUniformMean(a: number, b: number): number {
  if (a > b) return NaN; // Or handle error for invalid interval
  return (a + b) / 2;
}

/**
 * Calculates the variance of a Continuous Uniform Distribution.
 * Var(X) = (b - a)^2 / 12
 * @param a Lower bound of the interval.
 * @param b Upper bound of the interval.
 * @returns The variance.
 */
export function continuousUniformVariance(a: number, b: number): number {
  if (a > b) return NaN; // Or handle error for invalid interval
  return Math.pow(b - a, 2) / 12;
}

/**
 * Calculates the standard deviation of a Continuous Uniform Distribution.
 * SD(X) = sqrt(Var(X))
 * @param a Lower bound of the interval.
 * @param b Upper bound of the interval.
 * @returns The standard deviation.
 */
export function continuousUniformStdDev(a: number, b: number): number {
  if (a > b) return NaN; // Or handle error for invalid interval
  const variance = continuousUniformVariance(a, b);
  return Math.sqrt(variance);
}

/**
 * Calculates the error function (erf).
 * This is an approximation using a series expansion.
 * Abramowitz and Stegun formula 7.1.26
 * @param x The input value.
 * @returns The value of erf(x).
 */
export function erf(x: number): number {
  // Constants
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  // Save the sign of x
  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Calculates the Cumulative Distribution Function (CDF) for a Normal Distribution.
 * Φ(z) = 0.5 * (1 + erf(z / sqrt(2)))
 * @param x The value at which to evaluate the CDF.
 * @param mean The mean (μ) of the distribution.
 * @param stdDev The standard deviation (σ) of the distribution.
 * @returns The value of the CDF Φ(x).
 */
export function normalCDF(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) {
    // Or throw an error for invalid stdDev
    return NaN;
  }
  const z = (x - mean) / stdDev;
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Calculates the Probability Density Function (PDF) for a Normal Distribution.
 * f(x | μ, σ^2) = (1 / (σ * sqrt(2π))) * exp(-0.5 * ((x - μ) / σ)^2)
 * @param x The value at which to evaluate the PDF.
 * @param mean The mean (μ) of the distribution.
 * @param stdDev The standard deviation (σ) of the distribution.
 * @returns The value of the PDF f(x).
 */
export function normalPDF(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) {
    // Or throw an error
    return NaN;
  }
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  return coefficient * Math.exp(exponent);
}


/**
 * Calculates the Z-score.
 * z = (x - μ) / σ
 * @param x The value.
 * @param mean The mean (μ).
 * @param stdDev The standard deviation (σ).
 * @returns The Z-score.
 */
export function zScore(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) {
    return NaN; // Or throw an error
  }
  return (x - mean) / stdDev;
}
