
import { PoissonCalculator } from '@/components/poisson-calculator';
import { HypergeometricCalculator } from '@/components/hypergeometric-calculator';
import { ContinuousUniformCalculator } from '@/components/continuous-uniform-calculator';
import { NormalCalculator } from '@/components/normal-calculator'; // Import the new calculator
import { Separator } from '@/components/ui/separator'; 

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-10 lg:p-16 flex flex-col min-h-screen">
       <div className="flex-grow">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 animated-gradient-text"> 
          StatCalc: Calculadoras de Distribución
        </h1>
        {/* Updated grid to accommodate four calculators. 
            On large screens, it will be 2 columns. 
            On medium screens, it will also be 2 columns.
            On small screens, it will be 1 column.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16"> 
          <div>
            <div className="p-1 bg-gradient-to-br from-primary/20 via-transparent to-transparent hover:from-primary/30 rounded-lg h-full transition-all duration-300 ease-in-out">
                 <PoissonCalculator />
            </div>
          </div>
          <div>
             <div className="p-1 bg-gradient-to-b from-primary/20 via-transparent to-transparent hover:from-primary/30 rounded-lg h-full transition-all duration-300 ease-in-out">
                <HypergeometricCalculator />
             </div>
          </div>
          <div> 
             <div className="p-1 bg-gradient-to-bl from-primary/20 via-transparent to-transparent hover:from-primary/30 rounded-lg h-full transition-all duration-300 ease-in-out">
                <ContinuousUniformCalculator />
             </div>
          </div>
           <div> 
             <div className="p-1 bg-gradient-to-tr from-primary/20 via-transparent to-transparent hover:from-primary/30 rounded-lg h-full transition-all duration-300 ease-in-out">
                <NormalCalculator />
             </div>
          </div>
        </div>
       </div>
       <footer className="text-center mt-16 pt-8 pb-4 text-sm text-muted-foreground relative">
         <Separator className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4" />
        Hecho por David Acha y Manuel Monegro
       </footer>
    </main>
  );
}

