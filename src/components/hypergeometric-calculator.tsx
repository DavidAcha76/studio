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
import {
  hypergeometricPMF,
  hypergeometricMean,
  hypergeometricVariance,
  hypergeometricStdDev,
  combinations
} from "@/lib/math-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton


const formSchema = z.object({
  populationSize: z.coerce.number().int().min(1, "Tamaño de la población (N) debe ser al menos 1"),
  successStates: z.coerce.number().int().min(0, "Estados de éxito (K) deben ser no negativos"),
  sampleSize: z.coerce.number().int().min(1, "Tamaño de la muestra (n) debe ser al menos 1"),
  observedSuccesses: z.coerce.number().int().min(0, "Éxitos observados (k) deben ser no negativos"),
}).refine(data => data.successStates <= data.populationSize, {
  message: "Estados de éxito (K) no pueden exceder el tamaño de la población (N)",
  path: ["successStates"],
}).refine(data => data.sampleSize <= data.populationSize, {
  message: "Tamaño de la muestra (n) no puede exceder el tamaño de la población (N)",
  path: ["sampleSize"],
}).refine(data => data.observedSuccesses <= data.sampleSize, {
    message: "Éxitos observados (k) no pueden exceder el tamaño de la muestra (n)",
    path: ["observedSuccesses"],
}).refine(data => data.observedSuccesses <= data.successStates, {
    message: "Éxitos observados (k) no pueden exceder los estados de éxito (K)",
    path: ["observedSuccesses"],
}).refine(data => (data.sampleSize - data.observedSuccesses) <= (data.populationSize - data.successStates), {
    message: "Fracasos en la muestra (n-k) no pueden exceder los fracasos en la población (N-K)",
    path: ["observedSuccesses"], // Path can be adjusted, maybe points to sampleSize too
});


type HypergeometricFormValues = z.infer<typeof formSchema>;

interface HypergeometricResults {
  mean: number;
  variance: number;
  stdDev: number;
  p_eq_k: number;
  p_lt_k: number;
  p_lte_k: number;
  p_gt_k: number;
  p_gte_k: number;
}

export function HypergeometricCalculator() {
  const [results, setResults] = React.useState<HypergeometricResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();


  const form = useForm<HypergeometricFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      populationSize: undefined,
      successStates: undefined,
      sampleSize: undefined,
      observedSuccesses: undefined,
    },
  });

   const calculateProbabilities = (N: number, K: number, n: number, kValue: number): HypergeometricResults | null => {
    const mean = hypergeometricMean(N, K, n);
    const variance = hypergeometricVariance(N, K, n);
    const stdDev = hypergeometricStdDev(N, K, n);

    let p_eq_k = 0;
    let p_lt_k = 0;
    let p_lte_k = 0;

    // Determine the valid range for k
    const kMin = Math.max(0, n - (N - K));
    const kMax = Math.min(n, K);

     // Check for potential calculation issues with very large numbers
     if (combinations(N, n) === Infinity && n > 0) {
         toast({
           variant: "destructive",
           title: "Advertencia de Cálculo",
           description: "Las entradas resultan en números extremadamente grandes (combinaciones > 1.79e308). Los resultados podrían ser inexactos o cero debido a limitaciones.",
         });
      }


    // Calculate P(X=i) for relevant i values
    for (let i = kMin; i <= kMax; i++) {
        const prob_i = hypergeometricPMF(N, K, n, i);

        if (i === kValue) {
            p_eq_k = prob_i;
        }
        if (i < kValue) {
            p_lt_k += prob_i;
        }
        if (i <= kValue) {
            p_lte_k += prob_i;
        }
    }

    // Calculate complement probabilities
    const p_gt_k = 1 - p_lte_k;
    const p_gte_k = 1 - p_lt_k;

    // Clamp probabilities to [0, 1] range
    const clamp = (val: number) => Math.max(0, Math.min(1, val));

    return {
      mean: isNaN(mean) ? 0 : mean,
      variance: isNaN(variance) ? 0 : variance,
      stdDev: isNaN(stdDev) ? 0 : stdDev,
      p_eq_k: clamp(p_eq_k),
      p_lt_k: clamp(p_lt_k),
      p_lte_k: clamp(p_lte_k),
      p_gt_k: clamp(p_gt_k),
      p_gte_k: clamp(p_gte_k),
    };
  };

  const onSubmit = (values: HypergeometricFormValues) => {
    setIsLoading(true);
    setResults(null); // Clear previous results

    // Simulate calculation delay for UX, allowing loading state to show
    setTimeout(() => {
        try {
            const calculatedResults = calculateProbabilities(
                values.populationSize,
                values.successStates,
                values.sampleSize,
                values.observedSuccesses
            );
            setResults(calculatedResults);
        } catch (error) {
             console.error("Error de cálculo:", error);
             toast({
                 variant: "destructive",
                 title: "Error de Cálculo",
                 description: "Ocurrió un error durante el cálculo. Por favor, revise las entradas.",
             });
             setResults(null); // Ensure results are cleared on error
        } finally {
            setIsLoading(false);
        }
    }, 300); // Adjusted delay for better UX feel
};


  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-card to-secondary/30 p-6"> 
        <CardTitle className="text-2xl text-primary flex items-center gap-2"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-boxes"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>
          Calculadora Hipergeométrica
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">Calcula probabilidades de la distribución Hipergeométrica.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6"> 
             <TooltipProvider delayDuration={200}>
            <FormField
              control={form.control}
              name="populationSize"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                    <FormLabel>Tamaño Población (N)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <p>Número total de elementos en la población.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 50" {...field} className="focus:ring-primary focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="successStates"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                    <FormLabel>Estados de Éxito (K)</FormLabel>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <p>Número total de elementos con la característica deseada (éxitos) en la población.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 10" {...field} className="focus:ring-primary focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sampleSize"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                     <FormLabel>Tamaño Muestra (n)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <p>Número de elementos extraídos de la población sin reemplazo.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 20" {...field} className="focus:ring-primary focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observedSuccesses"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                    <FormLabel>Éxitos Observados (k)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <p>El número específico de éxitos observados en la muestra.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 5" {...field} className="focus:ring-primary focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             </TooltipProvider>
          </CardContent>
          <CardFooter className="flex justify-end p-6 bg-muted/50 border-t"> 
            <Button type="submit" disabled={isLoading} size="lg" className="transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"> 
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


      {results && !isLoading && (
        <div className="mt-6 p-6 border-t animate-in fade-in-50 duration-500"> 
          <h3 className="text-xl font-semibold mb-4 text-primary">Resultados del Cálculo</h3> 
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent"> 
                <TableHead className="w-[200px] text-muted-foreground">Métrica</TableHead>
                <TableHead className="text-right text-muted-foreground">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "Media (E[X])", value: results.mean },
                { label: "Varianza (Var(X))", value: results.variance },
                { label: "Desviación Estándar (σ)", value: results.stdDev }, 
                { label: "P(X = k)", value: results.p_eq_k },
                { label: "P(X < k)", value: results.p_lt_k },
                { label: "P(X ≤ k)", value: results.p_lte_k },
                { label: "P(X > k)", value: results.p_gt_k },
                { label: "P(X ≥ k)", value: results.p_gte_k },
              ].map((item, index) => (
                 <TableRow key={index} className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">{item.label}</TableCell>
                  <TableCell className="text-right font-mono py-3">{item.value.toFixed(5)}</TableCell> 
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
