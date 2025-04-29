import { PoissonCalculator } from '@/components/poisson-calculator';
import { HypergeometricCalculator } from '@/components/hypergeometric-calculator';

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
       <div className="flex-grow">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          StatCalc: Calculadoras de Distribución
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <PoissonCalculator />
          </div>
          <div>
            <HypergeometricCalculator />
          </div>
        </div>
       </div>
       <footer className="text-center mt-8 p-4 text-sm text-muted-foreground">
        Hecha por David Acha
       </footer>
    </main>
  );
}
