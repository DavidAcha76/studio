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
import { poissonPMF } from "@/lib/math-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    let p_gt_x = 0;
    let p_gte_x = 0;

    // Calculate P(X=k) for relevant k values
    // Set a reasonable upper limit for summation to avoid infinite loops,
    // especially for large lambda. Poisson probability becomes negligible far from the mean.
    // A common rule of thumb is mean + k * std_dev. Let's use mean + 5*std_dev or mean + 10, whichever is larger.
    const upperLimit = Math.max(xValue + 1, Math.ceil(lambda + 5 * stdDev + 10));
    const probabilities: number[] = [];
    let cumulativeProbability = 0;

    // Pre-calculate factorials or use log-gamma if needed for performance/stability
    // For simplicity here, poissonPMF handles stability internally

    for (let k = 0; k < upperLimit && cumulativeProbability < 0.999999999; k++) {
      const prob_k = poissonPMF(lambda, k);
      probabilities[k] = prob_k;
      cumulativeProbability += prob_k;

      if (k === xValue) {
        p_eq_x = prob_k;
      }
      if (k < xValue) {
        p_lt_x += prob_k;
      }
      if (k <= xValue) {
        p_lte_x += prob_k;
      }
    }

    // Ensure p_lte_x is calculated correctly even if xValue >= upperLimit
    if (xValue >= upperLimit -1 && cumulativeProbability >= 0.999999999) {
       p_lte_x = 1.0; // Approximately 1 if we reached the effective end of the distribution
    } else if (xValue >= 0 && xValue < upperLimit) {
      // Recalculate p_lte_x accurately if loop finished early
       p_lte_x = probabilities.slice(0, xValue + 1).reduce((sum, p) => sum + p, 0);
    } else if (xValue < 0) {
       p_lte_x = 0; // Should not happen with validation, but safe guard
    } else {
        // xValue is very large, potentially beyond calculated range but within theoretical possibility
        // If cumulativeProbability is near 1, assume p_lte_x is ~1
        p_lte_x = cumulativeProbability > 0.999999 ? 1.0 : cumulativeProbability;
    }


    // Calculate complement probabilities
    // Ensure numerical stability: P(>x) = 1 - P(<=x)
     p_gt_x = 1 - p_lte_x;
     p_gte_x = 1 - p_lt_x; // P(>=x) = P(=x) + P(>x) = P(=x) + 1 - P(<=x) = 1 - (P(<=x) - P(=x)) = 1 - P(<x)


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
    // Simulate calculation delay if needed
    // setTimeout(() => {
      const calculatedResults = calculateProbabilities(values.lambda, values.x);
      setResults(calculatedResults);
      setIsLoading(false);
    // }, 500);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl text-foreground">Calculadora Poisson</CardTitle>
        <CardDescription>Calcula probabilidades de la distribución de Poisson.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <TooltipProvider>
            <FormField
              control={form.control}
              name="lambda"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center">
                    <FormLabel>Tasa Promedio (λ)</FormLabel>
                     <Tooltip>
                      <TooltipTrigger asChild>
                         <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>El número promedio de eventos en un intervalo.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Input type="number" step="any" placeholder="ej., 5" {...field} />
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
                  <div className="flex items-center">
                    <FormLabel>Número de Eventos (x)</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>El número específico de eventos para el cálculo de probabilidad.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Input type="number" step="1" placeholder="ej., 3" {...field} />
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
                <TableCell className="font-medium">Media (μ = λ)</TableCell>
                <TableCell className="text-right">{results.mean.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Varianza (σ² = λ)</TableCell>
                <TableCell className="text-right">{results.variance.toFixed(5)}</TableCell>
              </TableRow>
               <TableRow>
                <TableCell className="font-medium">Desviación Estándar (σ)</TableCell>
                <TableCell className="text-right">{results.stdDev.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X = x)</TableCell>
                <TableCell className="text-right">{results.p_eq_x.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X &lt; x)</TableCell>
                <TableCell className="text-right">{results.p_lt_x.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X ≤ x)</TableCell>
                <TableCell className="text-right">{results.p_lte_x.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X &gt; x)</TableCell>
                <TableCell className="text-right">{results.p_gt_x.toFixed(5)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">P(X ≥ x)</TableCell>
                <TableCell className="text-right">{results.p_gte_x.toFixed(5)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
