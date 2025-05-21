
"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'; // Added Cell
import { getEvents } from '@/lib/firebase/firestore';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { BarChart3 } from 'lucide-react'; // Using a BarChart icon

interface ChartData {
  name: string;
  count: number;
}

// Consistent colors with Pie Chart
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
];


export default function EventCategoryBarChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndProcessEvents() {
      try {
        setIsLoading(true);
        const events = await getEvents({ orderByField: 'category', orderDirection: 'asc' });
        
        if (events.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }

        const categoryCounts = events.reduce((acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const formattedData = Object.entries(categoryCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count); 

        setChartData(formattedData);
      } catch (err) {
        console.error("Error fetching events for bar chart:", err);
        setError("Failed to load event data for the chart.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndProcessEvents();
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-heading flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-primary" />
            Events by Category (Bar)
          </CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-heading flex items-center">
             <BarChart3 className="h-6 w-6 mr-3 text-primary" />
            Events by Category (Bar)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-center py-10">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-heading flex items-center">
             <BarChart3 className="h-6 w-6 mr-3 text-primary" />
            Events by Category (Bar)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">No event data available to display the chart.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border border-border/60">
      <CardHeader>
        <CardTitle className="text-2xl font-heading flex items-center">
          <BarChart3 className="h-6 w-6 mr-3 text-primary" />
          Events by Category
        </CardTitle>
        <CardDescription>Number of events in each category.</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            <Bar dataKey="count" name="Event Count" >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
