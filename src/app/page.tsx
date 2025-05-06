import { PoissonCalculator } from '@/components/poisson-calculator';
import { HypergeometricCalculator } from '@/components/hypergeometric-calculator';
import { Separator } from '@/components/ui/separator'; // Import Separator

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-10 lg:p-16 flex flex-col min-h-screen"> {/* Increased padding */}
       <div className="flex-grow">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 animated-gradient-text"> {/* Increased size and margin, added gradient animation */}
          StatCalc: Calculadoras de Distribución
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16"> {/* Increased gap further */}
          <div>
            {/* Added a subtle decorative border effect */}
            <div className="p-1 bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-lg">
                 <PoissonCalculator />
            </div>
          </div>
          <div>
             {/* Added a subtle decorative border effect */}
             <div className="p-1 bg-gradient-to-bl from-primary/20 via-transparent to-transparent rounded-lg">
                <HypergeometricCalculator />
             </div>
          </div>
        </div>
       </div>
       <footer className="text-center mt-16 pt-8 pb-4 text-sm text-muted-foreground relative"> {/* Increased margins, added relative positioning */}
         <Separator className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4" /> {/* Added Separator */}
        Hecha por David Acha
       </footer>
    </main>
  );
}
