
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calculator, HelpCircle, Info, Loader2, Sigma, LineChart, Percent } from "lucide-react";

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  continuousUniformCDF,
  continuousUniformMean,
  continuousUniformVariance,
  continuousUniformStdDev,
  continuousUniformProbabilityInRange,
} from "@/lib/math-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const baseSchema = z.object({
  lowerBound: z.coerce.number().finite("Límite inferior (a) debe ser un número finito"), 
  upperBound: z.coerce.number().finite("Límite superior (b) debe ser un número finito"),
  x1Value: z.coerce.number().finite("Valor de x1 debe ser un número finito").optional(), // For P(X>x1) or P(x1 <= X <= x2)
  x2Value: z.coerce.number().finite("Valor de x2 debe ser un número finito").optional(), // For P(X<x2) or P(x1 <= X <= x2)
}).refine(data => data.upperBound > data.lowerBound, {
  message: "Límite superior (b) debe ser mayor que el límite inferior (a)",
  path: ["upperBound"],
}).refine(data => {
  if (data.x1Value !== undefined && data.lowerBound !== undefined && data.upperBound !== undefined) {
    // UI hint, math functions handle clamping.
  }
  return true;
}, {
  message: "x1 preferiblemente dentro del intervalo [a, b] para cálculos de rango.",
  path: ["x1Value"],
}).refine(data => {
  if (data.x2Value !== undefined && data.lowerBound !== undefined && data.upperBound !== undefined) {
    // UI hint, math functions handle clamping.
  }
  return true;
}, { 
 message: "x2 preferiblemente dentro del intervalo [a, b] para cálculos de rango.",
 path: ["x2Value"],
});


const formSchema = baseSchema; // Simplified, main logic in onSubmit

type ContinuousUniformFormValues = z.infer<typeof baseSchema>;

interface ContinuousUniformResults {
  mean: number;
  variance: number;
  stdDev: number;
  
  // Results for P(X > x1) and P(X < x2)
  prob_greater_than_x1?: number;
  prob_less_than_x2?: number;
  prob_sum_gt_lt?: number; // Sum of P(X>x1) + P(X<x2)

  // Results for P(x1_range <= X <= x2_range)
  probability_x1_x2_range?: number; 
  x1Swapped_range?: number; // If x1 and x2 were swapped for range calculation
  x2Swapped_range?: number;
}

export function ContinuousUniformCalculator() {
  const [results, setResults] = React.useState<ContinuousUniformResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("tail_probabilities"); // "tail_probabilities" or "range_probability"

  const form = useForm<ContinuousUniformFormValues>({
    resolver: zodResolver(formSchema), 
    defaultValues: {
      lowerBound: undefined,
      upperBound: undefined,
      x1Value: undefined,
      x2Value: undefined,
    },
  });

  const { watch } = form;
  const lowerBound = watch("lowerBound");
  const upperBound = watch("upperBound");
  
  const currentX1Value = watch("x1Value"); 
  const currentX2Value = watch("x2Value");


  const calculateMetrics = (
    a: number,
    b: number,
    currentActiveTab: string,
    data: ContinuousUniformFormValues
  ): ContinuousUniformResults => {
    const mean = continuousUniformMean(a, b);
    const variance = continuousUniformVariance(a, b);
    const stdDev = continuousUniformStdDev(a, b);
    
    let prob_greater_than_x1_res: number | undefined = undefined;
    let prob_less_than_x2_res: number | undefined = undefined;
    let prob_sum_gt_lt_res: number | undefined = undefined;
    let probability_x1_x2_range_res: number | undefined = undefined;
    let x1Swapped_res: number | undefined = undefined;
    let x2Swapped_res: number | undefined = undefined;

    if (currentActiveTab === "tail_probabilities") {
      if (data.x1Value !== undefined) {
        prob_greater_than_x1_res = 1 - continuousUniformCDF(a, b, data.x1Value);
      }
      if (data.x2Value !== undefined) {
        prob_less_than_x2_res = continuousUniformCDF(a, b, data.x2Value);
      }
      if (prob_greater_than_x1_res !== undefined || prob_less_than_x2_res !== undefined) {
        prob_sum_gt_lt_res = (prob_greater_than_x1_res ?? 0) + (prob_less_than_x2_res ?? 0);
      }
    } else if (currentActiveTab === "range_probability") {
      if (data.x1Value !== undefined && data.x2Value !== undefined) {
        let x1_calc = data.x1Value;
        let x2_calc = data.x2Value;
        if (x1_calc > x2_calc) {
            [x1_calc, x2_calc] = [x2_calc, x1_calc];
            x1Swapped_res = data.x2Value; 
            x2Swapped_res = data.x1Value;
        }
        probability_x1_x2_range_res = continuousUniformProbabilityInRange(a, b, x1_calc, x2_calc);
      }
    }

    return {
      mean,
      variance,
      stdDev,
      prob_greater_than_x1: prob_greater_than_x1_res,
      prob_less_than_x2: prob_less_than_x2_res,
      prob_sum_gt_lt: prob_sum_gt_lt_res,
      probability_x1_x2_range: probability_x1_x2_range_res,
      x1Swapped_range: x1Swapped_res,
      x2Swapped_range: x2Swapped_res,
    };
  };

  const onSubmit = (values: ContinuousUniformFormValues) => {
    setIsLoading(true);
    setResults(null);
    
    const currentValues = { ...values };

    setTimeout(() => {
      try {
        const calculatedResults = calculateMetrics(
          currentValues.lowerBound,
          currentValues.upperBound,
          activeTab,
          currentValues
        );
        setResults(calculatedResults);
      } catch (error) {
        console.error("Error de cálculo:", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };
  
  const isX1OutOfRange = currentX1Value !== undefined && lowerBound !== undefined && upperBound !== undefined && (currentX1Value < lowerBound || currentX1Value > upperBound);
  const isX2OutOfRange = currentX2Value !== undefined && lowerBound !== undefined && upperBound !== undefined && (currentX2Value < lowerBound || currentX2Value > upperBound);


  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-card to-secondary/30 p-6">
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
          <LineChart className="h-6 w-6" />
          Calculadora Uniforme Continua
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">
          Calcula probabilidades y métricas de la Distribución Uniforme Continua.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6">
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="lowerBound"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Límite Inferior (a)</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>El valor mínimo del intervalo [a, b].</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Input type="number" step="any" placeholder="ej., 0" {...field} className="focus:ring-primary focus:border-primary transition-shadow" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="upperBound"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Límite Superior (b)</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>El valor máximo del intervalo [a, b].</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Input type="number" step="any" placeholder="ej., 10" {...field} className="focus:ring-primary focus:border-primary transition-shadow" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tail_probabilities">P(X&gt;x₁) + P(X&lt;x₂)</TabsTrigger>
                  <TabsTrigger value="range_probability">P(x₁ ≤ X ≤ x₂)</TabsTrigger>
                </TabsList>

                <TabsContent value="tail_probabilities" className="mt-4 space-y-6">
                    <p className="text-sm font-medium">Para P(X &gt; x₁) + P(X &lt; x₂):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="x1Value"
                            render={({ field }) => (
                                <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Valor de x₁ (para P(X &gt; x₁))</FormLabel>
                                    <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">El valor x₁ para P(X &gt; x₁).</TooltipContent></Tooltip>
                                </div>
                                <FormControl><Input type="number" step="any" placeholder="ej., 2 (opcional)" {...field} className={cn("focus:ring-primary focus:border-primary transition-shadow", isX1OutOfRange && activeTab === "tail_probabilities" && "border-destructive focus:ring-destructive")}/></FormControl>
                                <FormMessage />
                                {isX1OutOfRange && activeTab === "tail_probabilities" && <p className="text-xs text-destructive pt-1">x₁ está fuera de [a, b]. El resultado puede ser 0 o 1.</p>}
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="x2Value"
                            render={({ field }) => (
                                <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Valor de x₂ (para P(X &lt; x₂))</FormLabel>
                                    <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">El valor x₂ para P(X &lt; x₂).</TooltipContent></Tooltip>
                                </div>
                                <FormControl><Input type="number" step="any" placeholder="ej., 8 (opcional)" {...field} className={cn("focus:ring-primary focus:border-primary transition-shadow", isX2OutOfRange && activeTab === "tail_probabilities" && "border-destructive focus:ring-destructive")}/></FormControl>
                                <FormMessage />
                                {isX2OutOfRange && activeTab === "tail_probabilities" && <p className="text-xs text-destructive pt-1">x₂ está fuera de [a, b]. El resultado puede ser 0 o 1.</p>}
                                </FormItem>
                            )}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="range_probability" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="x1Value" 
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between"> <FormLabel>Valor de x₁</FormLabel> <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Inicio del intervalo [x₁, x₂].</TooltipContent></Tooltip></div>
                            <FormControl><Input type="number" step="any" placeholder="ej., 2" {...field} className={cn("focus:ring-primary focus:border-primary transition-shadow", isX1OutOfRange && activeTab === "range_probability" && "border-destructive focus:ring-destructive")}/></FormControl>
                            <FormMessage />
                            {isX1OutOfRange && activeTab === "range_probability" && <p className="text-xs text-destructive pt-1">x₁ está fuera de [a, b]. Será ajustado.</p>}
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="x2Value" 
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between"> <FormLabel>Valor de x₂</FormLabel> <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Fin del intervalo [x₁, x₂].</TooltipContent></Tooltip></div>
                            <FormControl><Input type="number" step="any" placeholder="ej., 8" {...field} className={cn("focus:ring-primary focus:border-primary transition-shadow", isX2OutOfRange && activeTab === "range_probability" && "border-destructive focus:ring-destructive")}/></FormControl>
                            <FormMessage />
                            {isX2OutOfRange && activeTab === "range_probability" && <p className="text-xs text-destructive pt-1">x₂ está fuera de [a, b]. Será ajustado.</p>}
                            </FormItem>
                        )}
                        />
                    </div>
                </TabsContent>
              </Tabs>
            </TooltipProvider>
          </CardContent>
          <CardFooter className="flex justify-end p-6 bg-muted/50 border-t">
            <Button type="submit" disabled={isLoading} size="lg" className="transition-all duration-300 ease-in-out hover:scale-105 active:scale-95">
              {isLoading ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando... </>
              ) : (
                <> <Calculator className="mr-2 h-4 w-4" /> Calcular </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {isLoading && !results && (
        <div className="mt-6 p-6 border-t space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => ( 
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/5" />
              </div>
            ))}
          </div>
           <Separator className="my-4"/>
           <Skeleton className="h-6 w-2/5 mb-2" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {results && !isLoading && (
        <div className="mt-6 p-6 border-t animate-in fade-in-50 duration-500">
          <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
             <Sigma className="h-5 w-5" />
            Resultados del Cálculo
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px] text-muted-foreground">Métrica</TableHead>
                <TableHead className="text-right text-muted-foreground">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "Media (E[X])", value: results.mean },
                { label: "Varianza (σ²)", value: results.variance },
                { label: "Desviación Estándar (σ)", value: results.stdDev },
              ].map((item, index) => (
                <TableRow key={index} className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">{item.label}</TableCell>
                  <TableCell className="text-right font-mono py-3">
                    {typeof item.value === 'number' ? item.value.toFixed(5) : item.value}
                  </TableCell>
                </TableRow>
              ))}
              
              {activeTab === "tail_probabilities" && results.prob_greater_than_x1 !== undefined && form.getValues("x1Value") !== undefined &&(
                <TableRow className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">
                    {`P(X > ${form.getValues("x1Value")})`}
                  </TableCell>
                  <TableCell className="text-right font-mono py-3">
                    {results.prob_greater_than_x1.toFixed(5)} ({(results.prob_greater_than_x1 * 100).toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )}
              
              {activeTab === "tail_probabilities" && results.prob_less_than_x2 !== undefined && form.getValues("x2Value") !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">
                     {`P(X < ${form.getValues("x2Value")})`}
                  </TableCell>
                  <TableCell className="text-right font-mono py-3">
                    {results.prob_less_than_x2.toFixed(5)} ({(results.prob_less_than_x2 * 100).toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )}
              
               {activeTab === "tail_probabilities" && results.prob_sum_gt_lt !== undefined && (form.getValues("x1Value") !== undefined || form.getValues("x2Value") !== undefined) && (
                <TableRow className="transition-colors hover:bg-muted/30 font-bold text-primary">
                  <TableCell className="font-medium py-3">
                     Suma P(X &gt; x₁) + P(X &lt; x₂)
                  </TableCell>
                  <TableCell className="text-right font-mono py-3">
                    {results.prob_sum_gt_lt.toFixed(5)} ({(results.prob_sum_gt_lt * 100).toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )}
              
              {activeTab === "range_probability" && results.probability_x1_x2_range !== undefined && form.getValues("x1Value") !== undefined && form.getValues("x2Value") !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30 font-bold text-primary">
                    <TableCell className="font-medium py-3">
                        {`P(${results.x1Swapped_range ? results.x1Swapped_range : form.getValues("x1Value")} ≤ X ≤ ${results.x2Swapped_range ? results.x2Swapped_range : form.getValues("x2Value")})`}
                    </TableCell>
                    <TableCell className="text-right font-mono py-3">
                        {results.probability_x1_x2_range.toFixed(5)} ({(results.probability_x1_x2_range * 100).toFixed(2)}%)
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Alert for P(X > x1) + P(X < x2) */}
          {activeTab === "tail_probabilities" && (results.prob_greater_than_x1 !== undefined || results.prob_less_than_x2 !== undefined) && (
             <>
             <Separator className="my-6" />
             <Alert className="mt-4" variant="default">
                 <Percent className="h-4 w-4" />
                 <AlertTitle>Probabilidades de Cola P(X &gt; x₁) + P(X &lt; x₂)</AlertTitle>
                 <AlertDescription>
                     <ul className="list-disc list-inside space-y-1">
                        {results.prob_greater_than_x1 !== undefined && form.getValues("x1Value") !== undefined && (
                            <li>
                                P(X &gt; {form.getValues("x1Value")}) = <span className="font-mono ml-1">{results.prob_greater_than_x1.toFixed(5)}</span> (<span className="font-mono">{(results.prob_greater_than_x1 * 100).toFixed(2)}%</span>)
                                <p className="text-xs mt-1 text-muted-foreground">Fórmula: 1 - CDF(x₁)</p>
                            </li>
                        )}
                        {results.prob_less_than_x2 !== undefined && form.getValues("x2Value") !== undefined && (
                           <li>
                                P(X &lt; {form.getValues("x2Value")}) = <span className="font-mono ml-1">{results.prob_less_than_x2.toFixed(5)}</span> (<span className="font-mono">{(results.prob_less_than_x2 * 100).toFixed(2)}%</span>)
                                 <p className="text-xs mt-1 text-muted-foreground">Fórmula: CDF(x₂)</p>
                            </li>
                        )}
                         {results.prob_sum_gt_lt !== undefined && (
                            <li className="font-bold mt-2">
                                Suma Total = <span className="font-mono ml-1">{results.prob_sum_gt_lt.toFixed(5)}</span> (<span className="font-mono">{(results.prob_sum_gt_lt * 100).toFixed(2)}%</span>)
                             </li>
                         )}
                     </ul>
                 </AlertDescription>
             </Alert>
             </>
          )}
           
           {/* Alert for P(x1 <= X <= x2) */}
           {activeTab === "range_probability" && results.probability_x1_x2_range !== undefined && form.getValues("x1Value") !== undefined && form.getValues("x2Value") !== undefined && (
            <>
            <Separator className="my-6" />
            <Alert className="mt-4" variant="default">
                <Percent className="h-4 w-4" />
                <AlertTitle>Probabilidad en Intervalo P(x₁ ≤ X ≤ x₂)</AlertTitle>
                <AlertDescription>
                    La probabilidad de que X esté entre <strong> {results.x1Swapped_range ?? form.getValues("x1Value")} </strong> y <strong> {results.x2Swapped_range ?? form.getValues("x2Value")} </strong> es:
                    <div className="font-mono text-lg my-2">{results.probability_x1_x2_range.toFixed(5)}</div>
                    Esto equivale a un <strong>{(results.probability_x1_x2_range * 100).toFixed(2)}%</strong>.
                    {results.x1Swapped_range !== undefined && (
                        <p className="text-xs mt-1 text-muted-foreground">
                            (Nota: x₁ y x₂ fueron intercambiados para el cálculo ya que x₁ era mayor que x₂).
                        </p>
                    )}
                     <p className="text-xs mt-1 text-muted-foreground">
                        Fórmula: (x₂_ajustado - x₁_ajustado) / (b - a). x₁ y x₂ se ajustan a [a,b].
                     </p>
                </AlertDescription>
            </Alert>
            </>
           )}

            <Alert className="mt-6 bg-secondary/30 border-primary/30">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Propiedades de la Distribución Uniforme Continua</AlertTitle>
              <AlertDescription className="text-foreground/80 space-y-1">
                <p><strong>Intervalo:</strong> [a, b]</p>
                <p><strong>Función de Densidad (f(x)):</strong> 1/(b-a) para x en [a,b], y 0 fuera.</p>
                <p><strong>Área bajo la curva:</strong> El área total bajo la curva f(x) en [a, b] es 1.</p>
                <p><strong>Probabilidad y Área:</strong> P(c ≤ X ≤ d) = (d - c) / (b - a) para a ≤ c ≤ d ≤ b.</p>
              </AlertDescription>
           </Alert>
        </div>
      )}
    </Card>
  );
}
