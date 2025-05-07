"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calculator, HelpCircle, Info, Loader2, Sigma, LineChart, Percent, RectangleHorizontal, AreaChart } from "lucide-react";

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
  continuousUniformPDF, // Added PDF function
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";


const baseSchema = z.object({
  lowerBound: z.coerce.number().finite("Límite inferior (a) debe ser un número finito"), 
  upperBound: z.coerce.number().finite("Límite superior (b) debe ser un número finito"),
  x1Value: z.coerce.number().finite("Valor de x1 debe ser un número finito").optional(), 
  x2Value: z.coerce.number().finite("Valor de x2 debe ser un número finito").optional(), 
}).refine(data => data.upperBound > data.lowerBound, {
  message: "Límite superior (b) debe ser mayor que el límite inferior (a) para una distribución válida.",
  path: ["upperBound"],
});


const formSchema = baseSchema; 

type ContinuousUniformFormValues = z.infer<typeof baseSchema>;

interface ContinuousUniformResults {
  lowerBound: number; // Added for chart
  upperBound: number; // Added for chart
  mean: number;
  variance: number;
  stdDev: number;
  prob_greater_than_x1?: number;
  prob_less_than_x2?: number;
  prob_sum_gt_lt?: number; 
  probability_x1_x2_range?: number; 
  x1Swapped_range?: number; 
  x2Swapped_range?: number;
}

export function ContinuousUniformCalculator() {
  const [results, setResults] = React.useState<ContinuousUniformResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("range_probability"); 
  const [chartData, setChartData] = React.useState<Array<{ x: number; pdf: number }> | null>(null);


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

  React.useEffect(() => {
    if (results && results.lowerBound !== undefined && results.upperBound !== undefined) {
      const { lowerBound: a, upperBound: b } = results;
      const dataPoints = [];
      
      if (a < b) {
        const pdfVal = continuousUniformPDF(a, b, a); // PDF value within [a,b]
        const range = b - a;
        const padding = range * 0.25 > 0 ? range * 0.25 : 0.5; // Ensure padding is positive, relative to range or fixed
        
        // Points to define the rectangle shape for the PDF
        dataPoints.push({ x: parseFloat((a - padding).toFixed(4)), pdf: 0 });
        dataPoints.push({ x: parseFloat(a.toFixed(4)), pdf: 0 }); // Line starts from x-axis at a
        dataPoints.push({ x: parseFloat(a.toFixed(4)), pdf: parseFloat(pdfVal.toFixed(5)) }); // Jumps to PDF value at a
        dataPoints.push({ x: parseFloat(b.toFixed(4)), pdf: parseFloat(pdfVal.toFixed(5)) }); // Stays at PDF value until b
        dataPoints.push({ x: parseFloat(b.toFixed(4)), pdf: 0 }); // Drops to x-axis at b
        dataPoints.push({ x: parseFloat((b + padding).toFixed(4)), pdf: 0 });
      } else {
        // Handle a >= b: PDF is 0 everywhere. Show a flat line around the input values.
        const displayA = a ?? 0;
        const displayB = b ?? (displayA > 0 ? displayA + 1 : 1);
        const midPoint = (displayA + displayB) / 2;
        const padding = Math.abs(displayB - displayA) * 0.5 > 0 ? Math.abs(displayB - displayA) * 0.5 : 1;

        dataPoints.push({ x: parseFloat((midPoint - padding).toFixed(4)), pdf: 0 });
        dataPoints.push({ x: parseFloat(midPoint.toFixed(4)), pdf: 0 });
        dataPoints.push({ x: parseFloat((midPoint + padding).toFixed(4)), pdf: 0 });
      }
      setChartData(dataPoints);
    } else {
      setChartData(null);
    }
  }, [results]);

  const chartConfig = {
    pdf: {
      label: "f(x)",
      color: "hsl(var(--chart-2))", // Use a different chart color for variety
    },
  } satisfies ChartConfig;


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

    // Only perform probability calculations if a < b
    if (a < b) {
        // No longer using tail_probabilities tab
        if (currentActiveTab === "range_probability") {
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
    }


    return {
      lowerBound: a, // Include for chart
      upperBound: b, // Include for chart
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
    setChartData(null);
    
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
    <Card className="shadow-lg rounded-xl overflow-hidden">
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
                        <Input type="number" step="any" placeholder="ej., 0" {...field} className="focus:ring-primary focus:border-primary" />
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
                        <Input type="number" step="any" placeholder="ej., 10" {...field} className="focus:ring-primary focus:border-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="range_probability">P(x₁ ≤ X ≤ x₂)</TabsTrigger>
                </TabsList>
                <TabsContent value="range_probability" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="x1Value" 
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between"> <FormLabel>Valor de x₁</FormLabel> <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Inicio del intervalo [x₁, x₂].</TooltipContent></Tooltip></div>
                            <FormControl><Input type="number" step="any" placeholder="ej., 2" {...field} className={cn("focus:ring-primary focus:border-primary", isX1OutOfRange && activeTab === "range_probability" && "border-destructive focus:ring-destructive")}/></FormControl>
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
                            <FormControl><Input type="number" step="any" placeholder="ej., 8" {...field} className={cn("focus:ring-primary focus:border-primary", isX2OutOfRange && activeTab === "range_probability" && "border-destructive focus:ring-destructive")}/></FormControl>
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
           <Separator className="my-4"/>
           <Skeleton className="h-6 w-2/5 mb-2" /> {/* For chart title */}
           <Skeleton className="h-[350px] w-full" /> {/* For chart itself */}
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
                    {typeof item.value === 'number' ? item.value.toFixed(5) : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
              
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
          
           
           {activeTab === "range_probability" && results.probability_x1_x2_range !== undefined && form.getValues("x1Value") !== undefined && form.getValues("x2Value") !== undefined && results.lowerBound < results.upperBound && (
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

           {/* Graph Section */}
            {chartData && results && (
              <>
                <Separator className="my-6" />
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                    <RectangleHorizontal className="h-5 w-5" /> {/* Changed icon */}
                    Gráfica de la Densidad de Probabilidad (PDF)
                  </h3>
                   {results.lowerBound >= results.upperBound && (
                     <Alert variant="default" className="mb-4">
                        <Info className="h-4 w-4"/>
                        <AlertTitle>Intervalo Inválido para PDF</AlertTitle>
                        <AlertDescription>
                            La gráfica de la PDF requiere que el límite inferior (a) sea menor que el límite superior (b).
                            La función de densidad es 0 en todos los puntos.
                        </AlertDescription>
                     </Alert>
                   )}
                  <ChartContainer config={chartConfig} className="h-[350px] w-full aspect-video">
                    <RechartsLineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      accessibilityLayer 
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(value) => value.toFixed(results.lowerBound < results.upperBound ? 2 : 1)}
                        label={{ value: "x", position: "insideBottomRight", dy:10, fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        dataKey="pdf"
                        type="number"
                        domain={[0, 'auto']} // Y-axis from 0 to auto-scaled max PDF value
                        tickFormatter={(value) => value.toFixed(4)}
                        label={{ value: "f(x)", angle: -90, position: "insideLeft", dx: -5, fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={{ strokeDasharray: '3 3', stroke: "hsl(var(--border))" }}
                        content={<ChartTooltipContent indicator="line" labelClassName="font-semibold" nameKey="name" />}
                      />
                      <Line
                        type="linear" // Use linear for sharp corners of uniform PDF
                        dataKey="pdf"
                        name="f(x)" 
                        stroke="var(--color-pdf)"
                        strokeWidth={2.5}
                        dot={false} 
                        activeDot={{ r: 6, fill: "var(--color-pdf)", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                      />
                    </RechartsLineChart>
                  </ChartContainer>
                </div>
              </>
            )}
        </div>
      )}
    </Card>
  );
}
