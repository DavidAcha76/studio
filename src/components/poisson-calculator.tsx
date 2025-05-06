"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calculator, HelpCircle, Loader2 } from "lucide-react"; // Added Loader2

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { poissonPMF } from "@/lib/math-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton

const formSchema = z.object({
  lambda: z.coerce.number().min(0, "Lambda (λ) debe ser no negativo"),
  x: z.coerce.number().int().min(0, "Número de eventos (x) debe ser un entero no negativo"),
});

type PoissonFormValues = z.infer<typeof formSchema>;

interface PoissonResults {
  mean: number;
  variance: number;
  stdDev: number;
  p_eq_x: number;
  p_lt_x: number;
  p_lte_x: number;
  p_gt_x: number;
  p_gte_x: number;
}

export function PoissonCalculator() {
  const [results, setResults] = React.useState<PoissonResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<PoissonFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lambda: undefined, // Use undefined for placeholder to show
      x: undefined,
    },
  });

  const calculateProbabilities = (lambda: number, xValue: number): PoissonResults => {
    const mean = lambda;
    const variance = lambda;
    const stdDev = Math.sqrt(lambda);

    let p_eq_x = 0;
    let p_lt_x = 0;
    let p_lte_x = 0;
    let p_gt_x = 0; // Initialize p_gt_x
    let p_gte_x = 0; // Initialize p_gte_x


    const upperLimit = Math.max(xValue + 1, Math.ceil(lambda + 10 * stdDev + 10)); // Increased range slightly for more accuracy
    const probabilities: number[] = [];
    let cumulativeProbability = 0;


    for (let k = 0; k < upperLimit; k++) { // Removed early break for full calculation within limit
      const prob_k = poissonPMF(lambda, k);
      if (isNaN(prob_k) || prob_k < 1e-15) { // Stop if probability becomes negligible or NaN
           if (k > lambda + 5 * stdDev) break; // Add a reasonable condition to break
      }
      probabilities[k] = prob_k;
      cumulativeProbability += prob_k;


      if (k === xValue) {
        p_eq_x = prob_k;
      }
      if (k < xValue) {
        p_lt_x += prob_k;
      }
      // p_lte_x will be calculated after the loop for better accuracy
    }

     // Calculate p_lte_x accurately from the summed probabilities
     p_lte_x = probabilities.slice(0, xValue + 1).reduce((sum, p) => sum + (p || 0), 0);


    // Calculate complement probabilities using accurately summed values
     p_gt_x = 1 - p_lte_x;
     p_gte_x = 1 - p_lt_x;


    // Clamp probabilities to [0, 1] range due to potential floating point inaccuracies
    const clamp = (val: number) => Math.max(0, Math.min(1, val));

    return {
      mean,
      variance,
      stdDev: isNaN(stdDev) ? 0 : stdDev,
      p_eq_x: clamp(p_eq_x),
      p_lt_x: clamp(p_lt_x),
      p_lte_x: clamp(p_lte_x),
      p_gt_x: clamp(p_gt_x),
      p_gte_x: clamp(p_gte_x),
    };
  };


  const onSubmit = (values: PoissonFormValues) => {
    setIsLoading(true);
    setResults(null); // Clear previous results
    // Simulate calculation delay for UX
    setTimeout(() => {
      try {
          const calculatedResults = calculateProbabilities(values.lambda, values.x);
          setResults(calculatedResults);
      } catch (error) {
          console.error("Calculation Error:", error);
          // Optionally show a toast notification for calculation error
          setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Adjusted delay
  };

  return (
     // Enhanced card styling with subtle hover effect and transition
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
       <CardHeader className="bg-gradient-to-br from-card to-secondary/30 p-6"> {/* Added gradient header */}
         <CardTitle className="text-2xl text-primary flex items-center gap-2"> {/* Adjusted color and added icon */}
            {/* Simple Line Chart Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-line-chart">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
           Calculadora Poisson
         </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">Calcula probabilidades de la distribución de Poisson.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6"> {/* Increased padding and spacing */}
            <TooltipProvider delayDuration={200}> {/* Adjusted delay */}
            <FormField
              control={form.control}
              name="lambda"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between"> {/* Align label and icon */}
                    <FormLabel>Tasa Promedio (λ)</FormLabel>
                     <Tooltip>
                      <TooltipTrigger asChild>
                         <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs"> {/* Added side and max-width */}
                        <p>El número promedio de eventos que ocurren en un intervalo fijo de tiempo o espacio.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                     {/* Enhanced Input styling */}
                    <Input type="number" step="any" placeholder="ej., 5.2" {...field} className="focus:ring-primary focus:border-primary transition-shadow" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="x"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between"> {/* Align label and icon */}
                    <FormLabel>Número de Eventos (x)</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs"> {/* Added side and max-width */}
                        <p>El número específico de eventos para el cual calcular la probabilidad (debe ser un entero no negativo).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 3" {...field} className="focus:ring-primary focus:border-primary transition-shadow" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </TooltipProvider>
          </CardContent>
           <CardFooter className="flex justify-end p-6 bg-muted/50 border-t"> {/* Added background and border */}
            <Button type="submit" disabled={isLoading} size="lg" className="transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"> {/* Enhanced button */}
              {isLoading ? (
                 <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculando...
                 </>
              ) : (
                 <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calcular
                 </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>

       {/* Loading Skeleton */}
       {isLoading && !results && (
        <div className="mt-6 p-6 border-t space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                      <Skeleton className="h-5 w-1/4" />
                      <Skeleton className="h-5 w-1/5" />
                  </div>
              ))}
          </div>
        </div>
       )}

       {/* Enhanced results display */}
      {results && !isLoading && (
        <div className="mt-6 p-6 border-t animate-in fade-in-50 duration-500"> {/* Added animation */}
          <h3 className="text-xl font-semibold mb-4 text-primary">Resultados del Cálculo</h3> {/* Enhanced title */}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent"> {/* Removed hover for header */}
                <TableHead className="w-[200px] text-muted-foreground">Métrica</TableHead>
                <TableHead className="text-right text-muted-foreground">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {[
                { label: "Media (μ = λ)", value: results.mean },
                { label: "Varianza (σ² = λ)", value: results.variance },
                { label: "Desviación Estándar (σ)", value: results.stdDev },
                { label: "P(X = x)", value: results.p_eq_x },
                { label: "P(X < x)", value: results.p_lt_x },
                { label: "P(X ≤ x)", value: results.p_lte_x },
                { label: "P(X > x)", value: results.p_gt_x },
                { label: "P(X ≥ x)", value: results.p_gte_x },
               ].map((item, index) => (
                <TableRow key={index} className="transition-colors hover:bg-muted/30"> {/* Subtle row hover */}
                  <TableCell className="font-medium py-3">{item.label}</TableCell> {/* Adjusted padding */}
                  <TableCell className="text-right font-mono py-3">{item.value.toFixed(5)}</TableCell> {/* Used mono font, adjusted padding */}
                </TableRow>
               ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
