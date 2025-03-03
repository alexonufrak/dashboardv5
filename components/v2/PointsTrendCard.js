"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  Calendar,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "../ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

/**
 * PointsTrendCard Component
 * Displays historical points earning trends using Recharts
 */
export function PointsTrendCard({
  pointsHistory = [],
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("weekly");
  const [chartView, setChartView] = useState("total");
  
  // Sample points history data if none provided
  const samplePointsHistory = {
    // Weekly data - last 7 days
    weekly: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [
        { day: 'Mon', total: 10, xperience: 5, xperiment: 5, xtrapreneurs: 0, horizons: 0 },
        { day: 'Tue', total: 15, xperience: 10, xperiment: 5, xtrapreneurs: 0, horizons: 0 },
        { day: 'Wed', total: 5, xperience: 0, xperiment: 5, xtrapreneurs: 0, horizons: 0 },
        { day: 'Thu', total: 20, xperience: 15, xperiment: 5, xtrapreneurs: 0, horizons: 0 },
        { day: 'Fri', total: 8, xperience: 5, xperiment: 3, xtrapreneurs: 0, horizons: 0 },
        { day: 'Sat', total: 15, xperience: 10, xperiment: 5, xtrapreneurs: 0, horizons: 0 },
        { day: 'Sun', total: 10, xperience: 5, xperiment: 5, xtrapreneurs: 0, horizons: 0 }
      ]
    },
    // Monthly data - last 4 weeks
    monthly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [
        { week: 'Week 1', total: 45, xperience: 25, xperiment: 20, xtrapreneurs: 0, horizons: 0 },
        { week: 'Week 2', total: 60, xperience: 35, xperiment: 25, xtrapreneurs: 0, horizons: 0 },
        { week: 'Week 3', total: 75, xperience: 45, xperiment: 25, xtrapreneurs: 5, horizons: 0 },
        { week: 'Week 4', total: 83, xperience: 50, xperiment: 28, xtrapreneurs: 5, horizons: 0 }
      ]
    },
    // All time data - by month
    allTime: {
      labels: ['Sep', 'Oct', 'Nov', 'Dec'],
      data: [
        { month: 'Sep', total: 50, xperience: 30, xperiment: 20, xtrapreneurs: 0, horizons: 0 },
        { month: 'Oct', total: 120, xperience: 60, xperiment: 50, xtrapreneurs: 10, horizons: 0 },
        { month: 'Nov', total: 210, xperience: 105, xperiment: 95, xtrapreneurs: 10, horizons: 0 },
        { month: 'Dec', total: 330, xperience: 155, xperiment: 145, xtrapreneurs: 30, horizons: 0 }
      ]
    }
  };

  // Chart configuration
  const chartConfig = {
    total: {
      label: "Total Points",
      color: "hsl(var(--chart-1))"
    },
    xperience: {
      label: "Xperience",
      color: "hsl(var(--chart-2))"
    },
    xperiment: {
      label: "Xperiment",
      color: "hsl(var(--chart-3))"
    },
    xtrapreneurs: {
      label: "Xtrapreneurs",
      color: "hsl(var(--chart-4))"
    },
    horizons: {
      label: "Horizons",
      color: "hsl(var(--chart-5))"
    }
  };

  // Use sample data if none provided
  const historyData = pointsHistory.length > 0 ? pointsHistory : samplePointsHistory;

  // Get current data based on active tab
  const currentData = historyData[activeTab]?.data || [];
  const xAxisDataKey = activeTab === 'weekly' ? 'day' : (activeTab === 'monthly' ? 'week' : 'month');

  // Determine which chart type to render
  const renderChart = () => {
    if (chartView === 'stacked') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorXperience" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-xperience)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-xperience)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorXperiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-xperiment)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-xperiment)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorXtrapreneurs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-xtrapreneurs)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-xtrapreneurs)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorHorizons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-horizons)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-horizons)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip content={<ChartTooltipContent config={chartConfig} />} />
            <Area 
              type="monotone" 
              dataKey="xperience" 
              stackId="1" 
              stroke="var(--color-xperience)" 
              fillOpacity={1} 
              fill="url(#colorXperience)" 
            />
            <Area 
              type="monotone" 
              dataKey="xperiment" 
              stackId="1" 
              stroke="var(--color-xperiment)" 
              fillOpacity={1} 
              fill="url(#colorXperiment)" 
            />
            <Area 
              type="monotone" 
              dataKey="xtrapreneurs" 
              stackId="1" 
              stroke="var(--color-xtrapreneurs)" 
              fillOpacity={1} 
              fill="url(#colorXtrapreneurs)" 
            />
            <Area 
              type="monotone" 
              dataKey="horizons" 
              stackId="1" 
              stroke="var(--color-horizons)" 
              fillOpacity={1} 
              fill="url(#colorHorizons)" 
            />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (chartView === 'bar') {
      return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey={xAxisDataKey} 
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip content={<ChartTooltipContent config={chartConfig} />} />
            <Legend />
            <Bar dataKey="xperience" fill="var(--color-xperience)" radius={4} />
            <Bar dataKey="xperiment" fill="var(--color-xperiment)" radius={4} />
            <Bar dataKey="xtrapreneurs" fill="var(--color-xtrapreneurs)" radius={4} />
            <Bar dataKey="horizons" fill="var(--color-horizons)" radius={4} />
          </BarChart>
        </ChartContainer>
      );
    } else {
      // Line chart (default)
      return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <LineChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey={xAxisDataKey} 
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip content={<ChartTooltipContent config={chartConfig} />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="var(--color-total)" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="xperience" 
              stroke="var(--color-xperience)" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="xperiment" 
              stroke="var(--color-xperiment)" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="xtrapreneurs" 
              stroke="var(--color-xtrapreneurs)" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="horizons" 
              stroke="var(--color-horizons)" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Points Earning Trends
            </CardTitle>
            <CardDescription>
              Historical view of your point accumulation
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="total" onValueChange={setChartView}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="stacked">Stacked Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="allTime">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="space-y-4">
            {renderChart()}
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            {renderChart()}
          </TabsContent>
          
          <TabsContent value="allTime" className="space-y-4">
            {renderChart()}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" className="gap-1">
          <Calendar className="h-4 w-4" />
          <span>Custom Range</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" />
          <span>Export Data</span>
        </Button>
      </CardFooter>
    </Card>
  );
}