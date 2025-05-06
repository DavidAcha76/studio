
import { PoissonCalculator } from '@/components/poisson-calculator';
import { HypergeometricCalculator } from '@/components/hypergeometric-calculator';
import { ContinuousUniformCalculator } from '@/components/continuous-uniform-calculator'; // Import the new calculator
import { Separator } from '@/components/ui/separator'; 

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-10 lg:p-16 flex flex-col min-h-screen">
       <div className="flex-grow">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 animated-gradient-text"> 
          StatCalc: Calculadoras de Distribución
        </h1>
        {/* Updated grid to accommodate three calculators. On medium screens and up, it will be 3 columns. 
            On small screens, it will be 1 column. 
            Added a new rule for lg screens to go back to 2 columns if needed for better spacing, or keep 3.
            For now, using grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for a 3-column layout on large screens.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16"> 
          <div>
            <div className="p-1 bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-lg h-full">
                 <PoissonCalculator />
            </div>
          </div>
          <div>
             <div className="p-1 bg-gradient-to-b from-primary/20 via-transparent to-transparent rounded-lg h-full">
                <HypergeometricCalculator />
             </div>
          </div>
          {/* Add the new calculator here, spanning full width on md if only 2 items, else fitting in the 3rd slot */}
          <div className="md:col-span-2 lg:col-span-1"> 
             <div className="p-1 bg-gradient-to-bl from-primary/20 via-transparent to-transparent rounded-lg h-full">
                <ContinuousUniformCalculator />
             </div>
          </div>
        </div>
       </div>
       <footer className="text-center mt-16 pt-8 pb-4 text-sm text-muted-foreground relative">
         <Separator className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4" />
        Hecha por David Acha
       </footer>
    </main>
  );
}
