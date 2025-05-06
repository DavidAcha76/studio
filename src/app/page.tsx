import { PoissonCalculator } from '@/components/poisson-calculator';
import { HypergeometricCalculator } from '@/components/hypergeometric-calculator';

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-10 lg:p-12 flex flex-col min-h-screen">
       <div className="flex-grow">
        <h1 className="text-4xl font-bold text-center mb-12 text-primary"> {/* Increased font size and margin-bottom, changed color to primary */}
          StatCalc: Calculadoras de Distribución
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12"> {/* Increased gap */}
          <div>
            <PoissonCalculator />
          </div>
          <div>
            <HypergeometricCalculator />
          </div>
        </div>
       </div>
       <footer className="text-center mt-12 p-6 text-sm text-muted-foreground border-t"> {/* Increased top margin and padding, added border */}
        Hecha por David Acha
       </footer>
    </main>
  );
}
