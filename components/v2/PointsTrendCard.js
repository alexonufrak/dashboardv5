"use client";

import { useEffect, useRef } from "react";
import { 
  TrendingUp, 
  Calendar,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

/**
 * PointsTrendCard Component
 * Displays historical points earning trends
 * Uses a simple canvas-based chart for visualization
 */
export function PointsTrendCard({
  pointsHistory = [],
  className = "",
}) {
  // References to chart canvases
  const weeklyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  const allTimeChartRef = useRef(null);
  
  // Colors for different program types
  const programColors = {
    xperience: '#3b82f6', // blue-500
    xperiment: '#22c55e', // green-500
    xtrapreneurs: '#f59e0b', // amber-500
    horizons: '#8b5cf6', // purple-500
    default: '#6b7280', // gray-500
  };

  // Sample points history data if none provided
  const samplePointsHistory = [
    // Weekly data - last 7 days
    {
      interval: 'weekly',
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Total',
          data: [10, 15, 5, 20, 8, 15, 10],
          color: '#6b7280'
        },
        {
          label: 'Xperience',
          data: [5, 10, 0, 15, 5, 10, 5],
          color: programColors.xperience
        },
        {
          label: 'Xperiment',
          data: [5, 5, 5, 5, 3, 5, 5],
          color: programColors.xperiment
        }
      ]
    },
    // Monthly data - last 4 weeks
    {
      interval: 'monthly',
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Total',
          data: [45, 60, 75, 83],
          color: '#6b7280'
        },
        {
          label: 'Xperience',
          data: [25, 35, 45, 50],
          color: programColors.xperience
        },
        {
          label: 'Xperiment',
          data: [20, 25, 25, 28],
          color: programColors.xperiment
        },
        {
          label: 'Xtrapreneurs',
          data: [0, 0, 5, 5],
          color: programColors.xtrapreneurs
        }
      ]
    },
    // All time data - by month
    {
      interval: 'allTime',
      labels: ['Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Total',
          data: [50, 120, 210, 330],
          color: '#6b7280'
        },
        {
          label: 'Xperience',
          data: [30, 60, 105, 155],
          color: programColors.xperience
        },
        {
          label: 'Xperiment',
          data: [20, 50, 95, 145],
          color: programColors.xperiment
        },
        {
          label: 'Xtrapreneurs',
          data: [0, 10, 10, 30],
          color: programColors.xtrapreneurs
        }
      ]
    }
  ];

  // Use sample data if none provided
  const historyData = pointsHistory.length > 0 ? pointsHistory : samplePointsHistory;

  // Draw chart on canvas
  const drawChart = (canvas, data) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Find the max value for scaling
    let maxValue = 0;
    data.datasets.forEach(dataset => {
      const datasetMax = Math.max(...dataset.data);
      if (datasetMax > maxValue) maxValue = datasetMax;
    });
    
    // Add 10% padding to max value
    maxValue = maxValue * 1.1;
    
    // Chart dimensions
    const chartWidth = width - 60; // Left padding for y-axis labels
    const chartHeight = height - 40; // Bottom padding for x-axis labels
    const chartTop = 20;
    const chartLeft = 50;
    
    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartTop + chartHeight);
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.stroke();
    
    // Draw y-axis grid lines and labels
    const yAxisSteps = 5;
    ctx.textAlign = 'right';
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#6b7280'; // gray-500
    
    for (let i = 0; i <= yAxisSteps; i++) {
      const y = chartTop + chartHeight - (chartHeight * i / yAxisSteps);
      const value = Math.round(maxValue * i / yAxisSteps);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.strokeStyle = '#f3f4f6'; // gray-100
      ctx.stroke();
      
      // Label
      ctx.fillText(value.toString(), chartLeft - 10, y + 4);
    }
    
    // Draw x-axis
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop + chartHeight);
    ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.stroke();
    
    // Draw x-axis labels
    const labels = data.labels;
    const labelStep = chartWidth / (labels.length - 1);
    
    ctx.textAlign = 'center';
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#6b7280'; // gray-500
    
    labels.forEach((label, i) => {
      const x = chartLeft + i * labelStep;
      ctx.fillText(label, x, chartTop + chartHeight + 20);
    });
    
    // Draw datasets
    data.datasets.forEach((dataset, datasetIndex) => {
      const values = dataset.data;
      
      // Draw line
      ctx.beginPath();
      
      values.forEach((value, i) => {
        const x = chartLeft + i * labelStep;
        const y = chartTop + chartHeight - (chartHeight * value / maxValue);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.strokeStyle = dataset.color || programColors.default;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw points
      values.forEach((value, i) => {
        const x = chartLeft + i * labelStep;
        const y = chartTop + chartHeight - (chartHeight * value / maxValue);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = dataset.color || programColors.default;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });
    
    // Draw legend
    const legendTop = height - 10;
    const legendStepSize = width / (data.datasets.length + 1);
    let legendLeft = legendStepSize / 2;
    
    ctx.textAlign = 'center';
    ctx.font = '10px sans-serif';
    
    data.datasets.forEach((dataset) => {
      // Draw legend color box
      ctx.fillStyle = dataset.color || programColors.default;
      ctx.fillRect(legendLeft - 20, legendTop - 8, 10, 10);
      
      // Draw legend text
      ctx.fillStyle = '#6b7280'; // gray-500
      ctx.fillText(dataset.label, legendLeft + 10, legendTop);
      
      legendLeft += legendStepSize;
    });
  };

  // Draw charts when component mounts or data changes
  useEffect(() => {
    const weeklyData = historyData.find(d => d.interval === 'weekly') || historyData[0];
    const monthlyData = historyData.find(d => d.interval === 'monthly') || historyData[1];
    const allTimeData = historyData.find(d => d.interval === 'allTime') || historyData[2];
    
    if (weeklyChartRef.current) {
      drawChart(weeklyChartRef.current, weeklyData);
    }
    
    if (monthlyChartRef.current) {
      drawChart(monthlyChartRef.current, monthlyData);
    }
    
    if (allTimeChartRef.current) {
      drawChart(allTimeChartRef.current, allTimeData);
    }
  }, [historyData]);

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
            <Select defaultValue="total">
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">All Programs</SelectItem>
                <SelectItem value="xperience">Xperience</SelectItem>
                <SelectItem value="xperiment">Xperiment</SelectItem>
                <SelectItem value="xtrapreneurs">Xtrapreneurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="allTime">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="space-y-4">
            <div className="h-[300px] w-full relative">
              <canvas 
                ref={weeklyChartRef} 
                width={500} 
                height={300}
                className="w-full h-full"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            <div className="h-[300px] w-full relative">
              <canvas 
                ref={monthlyChartRef} 
                width={500} 
                height={300}
                className="w-full h-full"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="allTime" className="space-y-4">
            <div className="h-[300px] w-full relative">
              <canvas 
                ref={allTimeChartRef} 
                width={500} 
                height={300}
                className="w-full h-full"
              />
            </div>
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