
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calculator, HelpCircle, Loader2, Sigma, BarChartBig, Percent, TrendingUp, AreaChart } from "lucide-react";

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
  normalCDF,
  normalPDF,
  zScore,
} from "@/lib/math-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";


const formSchema = z.object({
  mean: z.coerce.number().finite("Media (μ) debe ser un número finito"),
  stdDev: z.coerce.number().positive("Desviación Estándar (σ) debe ser positiva"),
  xValue: z.coerce.number().finite("Valor de x debe ser un número finito").optional(), // For P(X < x), P(X > x), f(x)
  x1Value: z.coerce.number().finite("Valor de x1 debe ser un número finito").optional(), // For P(x1 < X < x2)
  x2Value: z.coerce.number().finite("Valor de x2 debe ser un número finito").optional(), // For P(x1 < X < x2)
}).refine(data => {
    if (data.x1Value !== undefined && data.x2Value !== undefined && data.x1Value >= data.x2Value) {
        return false;
    }
    return true;
}, {
    message: "x1 debe ser menor que x2 para el cálculo de probabilidad en rango.",
    path: ["x2Value"],
});


type NormalFormValues = z.infer<typeof formSchema>;

interface NormalResults {
  mean: number;
  variance: number;
  stdDev: number;
  zScoreX?: number;
  pdfX?: number;
  prob_less_than_x?: number;
  prob_greater_than_x?: number;
  prob_between_x1_x2?: number;
}

export function NormalCalculator() {
  const [results, setResults] = React.useState<NormalResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("single_x"); // "single_x" or "range_x1_x2"
  const [chartData, setChartData] = React.useState<Array<{ x: number; pdf: number }> | null>(null);

  const form = useForm<NormalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mean: undefined,
      stdDev: undefined,
      xValue: undefined,
      x1Value: undefined,
      x2Value: undefined,
    },
  });

  React.useEffect(() => {
    if (results && results.mean !== undefined && results.stdDev !== undefined && results.stdDev > 0) {
      const { mean, stdDev } = results;
      const dataPoints = [];
      const lowerBound = mean - 4 * stdDev;
      const upperBound = mean + 4 * stdDev;
      const numPoints = 100; 

      for (let i = 0; i <= numPoints; i++) {
        const x = lowerBound + (upperBound - lowerBound) * (i / numPoints);
        const pdf = normalPDF(x, mean, stdDev);
        dataPoints.push({ x: parseFloat(x.toFixed(4)), pdf: parseFloat(pdf.toFixed(5)) });
      }
      setChartData(dataPoints);
    } else {
      setChartData(null);
    }
  }, [results]);

  const chartConfig = {
    pdf: {
      label: "f(x)",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;


  const onSubmit = (values: NormalFormValues) => {
    setIsLoading(true);
    setResults(null);
    setChartData(null);

    setTimeout(() => {
      try {
        const { mean, stdDev, xValue, x1Value, x2Value } = values;
        const variance = Math.pow(stdDev, 2);
        
        let calculatedResults: NormalResults = {
            mean,
            variance,
            stdDev,
        };

        if (activeTab === "single_x" && xValue !== undefined) {
            calculatedResults.zScoreX = zScore(xValue, mean, stdDev);
            calculatedResults.pdfX = normalPDF(xValue, mean, stdDev);
            calculatedResults.prob_less_than_x = normalCDF(xValue, mean, stdDev);
            calculatedResults.prob_greater_than_x = 1 - calculatedResults.prob_less_than_x;
        } else if (activeTab === "range_x1_x2" && x1Value !== undefined && x2Value !== undefined) {
            const prob_less_than_x1 = normalCDF(x1Value, mean, stdDev);
            const prob_less_than_x2 = normalCDF(x2Value, mean, stdDev);
            calculatedResults.prob_between_x1_x2 = prob_less_than_x2 - prob_less_than_x1;
        }

        setResults(calculatedResults);
      } catch (error) {
        console.error("Error de cálculo:", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <Card className="shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-card to-secondary/30 p-6">
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Calculadora de Distribución Normal
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1">
          Calcula probabilidades y métricas de la Distribución Normal (Gaussiana).
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6">
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mean"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Media (μ)</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>El valor promedio o central de la distribución.</p>
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
                  name="stdDev"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Desviación Estándar (σ)</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>La medida de dispersión de los valores. Debe ser positiva.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Input type="number" step="any" placeholder="ej., 1" {...field} className="focus:ring-primary focus:border-primary transition-shadow" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single_x">P(X&lt;x), P(X&gt;x), f(x)</TabsTrigger>
                  <TabsTrigger value="range_x1_x2">P(x₁ &lt; X &lt; x₂)</TabsTrigger>
                </TabsList>

                <TabsContent value="single_x" className="mt-4 space-y-6">
                    <FormField
                        control={form.control}
                        name="xValue"
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Valor de x</FormLabel>
                                <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">El valor de x para calcular P(X&lt;x), P(X&gt;x) y f(x).</TooltipContent></Tooltip>
                            </div>
                            <FormControl><Input type="number" step="any" placeholder="ej., 1.96" {...field} className="focus:ring-primary focus:border-primary transition-shadow"/></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </TabsContent>

                <TabsContent value="range_x1_x2" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="x1Value" 
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between"> <FormLabel>Valor de x₁</FormLabel> <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Límite inferior del intervalo [x₁, x₂].</TooltipContent></Tooltip></div>
                            <FormControl><Input type="number" step="any" placeholder="ej., -1" {...field} className="focus:ring-primary focus:border-primary transition-shadow"/></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="x2Value" 
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center justify-between"> <FormLabel>Valor de x₂</FormLabel> <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4"/></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Límite superior del intervalo [x₁, x₂].</TooltipContent></Tooltip></div>
                            <FormControl><Input type="number" step="any" placeholder="ej., 1" {...field} className="focus:ring-primary focus:border-primary transition-shadow"/></FormControl>
                            <FormMessage />
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
            {[...Array(activeTab === "single_x" ? 6: 4)].map((_, i) => ( 
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {results && !isLoading && (
        <div className="mt-6 p-6 border-t animate-in fade-in-50 duration-500">
          <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
             <BarChartBig className="h-5 w-5" />
            Resultados del Cálculo
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px] text-muted-foreground">Métrica</TableHead>
                <TableHead className="text-right text-muted-foreground">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "Media (μ)", value: results.mean },
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
              
              {activeTab === "single_x" && results.zScoreX !== undefined && form.getValues("xValue") !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">Puntuación Z para x = {form.getValues("xValue")}</TableCell>
                  <TableCell className="text-right font-mono py-3">{results.zScoreX.toFixed(5)}</TableCell>
                </TableRow>
              )}
              {activeTab === "single_x" && results.pdfX !== undefined && form.getValues("xValue") !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">f(x = {form.getValues("xValue")}) (Densidad)</TableCell>
                  <TableCell className="text-right font-mono py-3">{results.pdfX.toFixed(5)}</TableCell>
                </TableRow>
              )}
              {activeTab === "single_x" && results.prob_less_than_x !== undefined && form.getValues("xValue") !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">P(X &lt; {form.getValues("xValue")})</TableCell>
                  <TableCell className="text-right font-mono py-3">
                    {results.prob_less_than_x.toFixed(5)} ({(results.prob_less_than_x * 100).toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )}
              {activeTab === "single_x" && results.prob_greater_than_x !== undefined && form.getValues("xValue") !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium py-3">P(X &gt; {form.getValues("xValue")})</TableCell>
                  <TableCell className="text-right font-mono py-3">
                    {results.prob_greater_than_x.toFixed(5)} ({(results.prob_greater_than_x * 100).toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )}
              
              {activeTab === "range_x1_x2" && results.prob_between_x1_x2 !== undefined && form.getValues("x1Value") !== undefined && form.getValues("x2Value") !== undefined && (
                <TableRow className="transition-colors hover:bg-muted/30 font-bold text-primary">
                    <TableCell className="font-medium py-3">
                        {`P(${form.getValues("x1Value")} < X < ${form.getValues("x2Value")})`}
                    </TableCell>
                    <TableCell className="text-right font-mono py-3">
                        {results.prob_between_x1_x2.toFixed(5)} ({(results.prob_between_x1_x2 * 100).toFixed(2)}%)
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
           {/* Graph Section */}
            {chartData && results?.mean !== undefined && results?.stdDev !== undefined && results.stdDev > 0 && (
              <>
                <Separator className="my-6" />
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                    <AreaChart className="h-5 w-5" />
                    Gráfica de la Densidad de Probabilidad (PDF)
                  </h3>
                  <ChartContainer config={chartConfig} className="h-[350px] w-full aspect-video">
                    <RechartsLineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      accessibilityLayer // For better accessibility
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(value) => value.toFixed(2)}
                        label={{ value: "x", position: "insideBottomRight", dy:10, fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        dataKey="pdf"
                        type="number"
                        domain={[0, 'auto']}
                        tickFormatter={(value) => value.toFixed(4)}
                        label={{ value: "f(x)", angle: -90, position: "insideLeft", dx: -5, fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={{ strokeDasharray: '3 3', stroke: "hsl(var(--border))" }}
                        content={<ChartTooltipContent 
                                    indicator="line" 
                                    labelClassName="font-semibold"
                                    nameKey="name" 
                                 />}
                      />
                      <Line
                        type="monotone"
                        dataKey="pdf"
                        name="f(x)" // Name for tooltip
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
