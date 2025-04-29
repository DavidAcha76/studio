import { PoissonCalculator } from '@/components/poisson-calculator';
import { HypergeometricCalculator } from '@/components/hypergeometric-calculator';

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
        StatCalc: Distribution Calculators
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <PoissonCalculator />
        </div>
        <div>
          <HypergeometricCalculator />
        </div>
      </div>
    </main>
  );
}
