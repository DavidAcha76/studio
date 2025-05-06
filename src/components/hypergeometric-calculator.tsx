"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calculator, HelpCircle } from "lucide-react";

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
     // combinations(N, n) can become Infinity quickly
     if (combinations(N, n) === Infinity && n > 0) {
         toast({
           variant: "destructive",
           title: "Advertencia de Cálculo",
           description: "Las entradas resultan en números extremadamente grandes (combinaciones > 1.79e308). Los resultados podrían ser inexactos o cero debido a limitaciones.",
         });
         // Depending on the case, you might still try calculation or return null/zeroes
         // For now, let's attempt calculation but the warning informs the user.
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

         // Optimization: if probability becomes near zero, we might stop early
         // if (prob_i < 1e-15 && i > mean) break; // Be careful with this
    }

    // Calculate complement probabilities using P(<=k)
    const p_gt_k = 1 - p_lte_k;
    const p_gte_k = 1 - p_lt_k; // P(>=k) = P(=k) + P(>k) = P(=k) + 1 - P(<=k) = 1 - (P(<=k) - P(=k)) = 1 - P(<k)

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

    // Use setTimeout to allow UI update before potentially long calculation
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
    }, 50); // Small delay
};


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300"> {/* Increased shadow and added hover effect */}
      <CardHeader>
        <CardTitle className="text-2xl text-foreground">Calculadora Hipergeométrica</CardTitle>
        <CardDescription>Calcula probabilidades de la distribución Hipergeométrica.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <TooltipProvider>
            <FormField
              control={form.control}
              name="populationSize"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center">
                    <FormLabel>Tamaño Población (N)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Número total de elementos en la población.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 50" {...field} />
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
                   <div className="flex items-center">
                    <FormLabel>Estados de Éxito (K)</FormLabel>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Número total de elementos con la característica deseada (éxitos) en la población.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 10" {...field} />
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
                   <div className="flex items-center">
                     <FormLabel>Tamaño Muestra (n)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Número de elementos extraídos de la población sin reemplazo.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 20" {...field} />
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
                   <div className="flex items-center">
                    <FormLabel>Éxitos Observados (k)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>El número específico de éxitos observados en la muestra.</p>
                        </TooltipContent>
                    </Tooltip>
                   </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             </TooltipProvider>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
               <Calculator className="mr-2 h-4 w-4" />
              {isLoading ? "Calculando..." : "Calcular"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {results && (
        <div className="mt-6 p-4 border-t">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Resultados</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Métrica</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Media (E[X])</TableCell>
                <TableCell className="text-right">{results.mean.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Varianza (Var(X))</TableCell>
                <TableCell className="text-right">{results.variance.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Desviación Estándar (SD)</TableCell>
                <TableCell className="text-right">{results.stdDev.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X = k)</TableCell>
                <TableCell className="text-right">{results.p_eq_k.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X &lt; k)</TableCell>
                <TableCell className="text-right">{results.p_lt_k.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X ≤ k)</TableCell>
                <TableCell className="text-right">{results.p_lte_k.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X &gt; k)</TableCell>
                <TableCell className="text-right">{results.p_gt_k.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X ≥ k)</TableCell>
                <TableCell className="text-right">{results.p_gte_k.toFixed(5)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
