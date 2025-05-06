
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
  continuousUniformPDF,
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

const formSchema = z.object({
  lowerBound: z.coerce.number().finite("Límite inferior (a) debe ser un número finito"),
  upperBound: z.coerce.number().finite("Límite superior (b) debe ser un número finito"),
  xValue: z.coerce.number().finite("Valor de x debe ser un número finito").optional(),
  x1Value: z.coerce.number().finite("Valor de x1 debe ser un número finito").optional(),
  x2Value: z.coerce.number().finite("Valor de x2 debe ser un número finito").optional(),
}).refine(data => data.upperBound > data.lowerBound, {
  message: "Límite superior (b) debe ser mayor que el límite inferior (a)",
  path: ["upperBound"],
}).refine(data => {
  if (data.x1Value !== undefined && data.lowerBound !== undefined && data.upperBound !== undefined && (data.x1Value < data.lowerBound || data.x1Value > data.upperBound)) {
    return false;
  }
  return true;
}, {
  message: "x1 debe estar dentro del intervalo [a, b]",
  path: ["x1Value"],
}).refine(data => {
  if (data.x2Value !== undefined && data.lowerBound !== undefined && data.upperBound !== undefined && (data.x2Value < data.lowerBound || data.x2Value > data.upperBound)) {
    return false;
  }
  return true;
}, {
  message: "x2 debe estar dentro del intervalo [a, b]",
  path: ["x2Value"],
});

type ContinuousUniformFormValues = z.infer<typeof formSchema>;

interface ContinuousUniformResults {
  mean: number;
  variance: number;
  stdDev: number;
  pdf_x?: number;
  isXInRange?: boolean;
  probability_x1_x2?: number;
  x1Swapped?: number;
  x2Swapped?: number;
}

export function ContinuousUniformCalculator() {
  const [results, setResults] = React.useState<ContinuousUniformResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("pdf");

  const form = useForm<ContinuousUniformFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lowerBound: undefined,
      upperBound: undefined,
      xValue: undefined,
      x1Value: undefined,
      x2Value: undefined,
    },
  });

  const { watch } = form;
  const lowerBound = watch("lowerBound");
  const upperBound = watch("upperBound");
  const x1Value = watch("x1Value");
  const x2Value = watch("x2Value");


  const calculateMetrics = (
    a: number,
    b: number,
    x?: number,
    x1?: number,
    x2?: number
  ): ContinuousUniformResults => {
    const mean = continuousUniformMean(a, b);
    const variance = continuousUniformVariance(a, b);
    const stdDev = continuousUniformStdDev(a, b);
    
    let pdf_x: number | undefined = undefined;
    let isXInRange: boolean | undefined = undefined;
    if (x !== undefined) {
      pdf_x = continuousUniformPDF(a, b, x);
      isXInRange = x >= a && x <= b;
    }

    let probability_x1_x2: number | undefined = undefined;
    let x1Swapped = x1;
    let x2Swapped = x2;

    if (x1 !== undefined && x2 !== undefined) {
      if (x1 > x2) {
        [x1Swapped, x2Swapped] = [x2, x1];
      }
      probability_x1_x2 = continuousUniformProbabilityInRange(a, b, x1Swapped as number, x2Swapped as number);
    }

    return {
      mean,
      variance,
      stdDev,
      pdf_x,
      isXInRange,
      probability_x1_x2,
      x1Swapped,
      x2Swapped,
    };
  };

  const onSubmit = (values: ContinuousUniformFormValues) => {
    setIsLoading(true);
    setResults(null);
    
    // Clear the non-active tab fields before calculation
    const currentValues = { ...values };
    if (activeTab === "pdf") {
      currentValues.x1Value = undefined;
      currentValues.x2Value = undefined;
    } else if (activeTab === "probability") {
      currentValues.xValue = undefined;
    }


    let finalX1 = currentValues.x1Value;
    let finalX2 = currentValues.x2Value;
    if (currentValues.x1Value !== undefined && currentValues.x2Value !== undefined && currentValues.x1Value > currentValues.x2Value) {
      finalX1 = currentValues.x2Value;
      finalX2 = currentValues.x1Value;
    }


    setTimeout(() => {
      try {
        const calculatedResults = calculateMetrics(
          currentValues.lowerBound,
          currentValues.upperBound,
          currentValues.xValue,
          finalX1, 
          finalX2
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
  
  const isX1OutOfRange = x1Value !== undefined && lowerBound !== undefined && upperBound !== undefined && (x1Value < lowerBound || x1Value > upperBound);
  const isX2OutOfRange = x2Value !== undefined && lowerBound !== undefined && upperBound !== undefined && (x2Value < lowerBound || x2Value > upperBound);


  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-card to-secondary/30 p-6">
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
          <LineChart className="h-6 w-6" />
          Calculadora Uniforme Continua
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">
          Calcula métricas y probabilidades de la distribución Uniforme Continua.
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
                  <TabsTrigger value="pdf">Calcular f(x)</TabsTrigger>
                  <TabsTrigger value="probability">Calcular P(x₁ ≤ X ≤ x₂)</TabsTrigger>
                </TabsList>
                <TabsContent value="pdf" className="mt-4">
                    <FormField
                        control={form.control}
                        name="xValue"
                        render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel>Valor de x (para f(x))</FormLabel>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                <p>El valor para el cual calcular la función de densidad f(x).</p>
                                </TooltipContent>
                            </Tooltip>
                            </div>
                            <FormControl>
                            <Input type="number" step="any" placeholder="ej., 5" {...field} className="focus:ring-primary focus:border-primary transition-shadow" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </TabsContent>
                <TabsContent value="probability" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="x1Value"
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Valor de x₁</FormLabel>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <p>Inicio del intervalo para el cálculo de probabilidad. Debe estar entre 'a' y 'b'.</p>
                                </TooltipContent>
                                </Tooltip>
                            </div>
                            <FormControl>
                                <Input
                                type="number"
                                step="any"
                                placeholder="ej., 2"
                                {...field}
                                className={cn(
                                    "focus:ring-primary focus:border-primary transition-shadow",
                                    isX1OutOfRange && "border-destructive focus:ring-destructive"
                                )}
                                />
                            </FormControl>
                            <FormMessage />
                            {isX1OutOfRange && <p className="text-xs text-destructive pt-1">x₁ está fuera del intervalo [a, b].</p>}
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="x2Value"
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Valor de x₂</FormLabel>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <p>Fin del intervalo para el cálculo de probabilidad. Debe estar entre 'a' y 'b'.</p>
                                </TooltipContent>
                                </Tooltip>
                            </div>
                            <FormControl>
                                <Input
                                type="number"
                                step="any"
                                placeholder="ej., 8"
                                {...field}
                                className={cn(
                                    "focus:ring-primary focus:border-primary transition-shadow",
                                    isX2OutOfRange && "border-destructive focus:ring-destructive"
                                )}
                                />
                            </FormControl>
                            <FormMessage />
                            {isX2OutOfRange && <p className="text-xs text-destructive pt-1">x₂ está fuera del intervalo [a, b].</p>}
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
              {results.pdf_x !== undefined && form.getValues("xValue") !== undefined && (
                 <TableRow className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium py-3">
                        {`f(x = ${form.getValues("xValue")})`}
                    </TableCell>
                    <TableCell className="text-right font-mono py-3">
                        {results.pdf_x.toFixed(5)}
                    </TableCell>
                 </TableRow>
              )}
              {results.probability_x1_x2 !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">
                    P({results.x1Swapped ?? form.getValues("x1Value")} ≤ X ≤ {results.x2Swapped ?? form.getValues("x2Value")})
                  </TableCell>
                  <TableCell className="text-right font-mono py-3">
                    {results.probability_x1_x2.toFixed(5)} ({(results.probability_x1_x2 * 100).toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {(results.pdf_x !== undefined && form.getValues("xValue") !== undefined) && (
            <>
            <Separator className="my-6" />
            <Alert variant={results.isXInRange ? "default" : "destructive"} className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Función de Densidad de Probabilidad (f(x))</AlertTitle>
                <AlertDescription>
                    Para el valor de x = <strong>{form.getValues("xValue")}</strong>:
                    <ul className="list-disc list-inside mt-2">
                        <li>
                            Si x está dentro del intervalo [{form.getValues("lowerBound")}, {form.getValues("upperBound")}], f(x) = 1 / (b - a) = <strong>{results.pdf_x.toFixed(5)}</strong>.
                        </li>
                        <li>
                            Si x está fuera del intervalo, f(x) = <strong>0</strong>.
                        </li>
                    </ul>
                    {results.isXInRange
                    ? `El valor x = ${form.getValues("xValue")} está DENTRO del intervalo.`
                    : `El valor x = ${form.getValues("xValue")} está FUERA del intervalo.`
                    }
                </AlertDescription>
            </Alert>
            </>
          )}


           {results.probability_x1_x2 !== undefined && (
            <>
            <Separator className="my-6" />
            <Alert className="mt-4" variant="default">
                <Percent className="h-4 w-4" />
                <AlertTitle>Probabilidad en Intervalo P(x₁ ≤ X ≤ x₂)</AlertTitle>
                <AlertDescription>
                    La probabilidad de que la variable aleatoria X esté entre 
                    <strong> {results.x1Swapped ?? form.getValues("x1Value")} </strong> 
                    y <strong> {results.x2Swapped ?? form.getValues("x2Value")} </strong> es:
                    <div className="font-mono text-lg my-2">
                        {results.probability_x1_x2.toFixed(5)}
                    </div>
                    Esto equivale a un <strong>{(results.probability_x1_x2 * 100).toFixed(2)}%</strong>.
                    {(form.getValues("x1Value") ?? 0) > (form.getValues("x2Value") ?? 0) && 
                     (form.getValues("x1Value") !== undefined && form.getValues("x2Value") !== undefined) && (
                        <p className="text-xs mt-1 text-muted-foreground">
                            (Nota: x₁ y x₂ fueron intercambiados para el cálculo ya que x₁ era mayor que x₂).
                        </p>
                    )}
                     <p className="text-xs mt-1 text-muted-foreground">
                        Fórmula: P(x₁ ≤ X ≤ x₂) = (x₂_clamped - x₁_clamped) / (b - a). Los valores de x₁ y x₂ se ajustan para estar dentro del intervalo [a,b].
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
                <p><strong>Área bajo la curva:</strong> El área total bajo la curva de la función de densidad de probabilidad f(x) en el intervalo [a, b] es siempre igual a 1.</p>
                <p><strong>Probabilidad y Área:</strong> La probabilidad de que la variable aleatoria X tome un valor dentro de un subintervalo [c, d] (donde a ≤ c ≤ d ≤ b) es igual al área bajo la curva f(x) entre c y d. P(c ≤ X ≤ d) = (d - c) / (b - a).</p>
                <p><strong>Densidad Constante:</strong> La función de densidad f(x) es constante dentro del intervalo [a, b] e igual a 1/(b-a). Fuera de este intervalo, f(x) es 0.</p>
              </AlertDescription>
           </Alert>
        </div>
      )}
    </Card>
  );
}

    