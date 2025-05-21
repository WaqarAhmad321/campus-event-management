
"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getEvents } from '@/lib/firebase/firestore';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
}

// Define a consistent color palette for the chart
// These could be further aligned with theme variables if desired
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))', // Primary theme color
  'hsl(var(--secondary))', // Secondary theme color
  'hsl(var(--accent))', // Accent theme color
];


export default function EventTypePieChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndProcessEvents() {
      try {
        setIsLoading(true);
        const events = await getEvents({ orderByField: 'category', orderDirection: 'asc' }); // Fetch all events
        
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
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value); // Sort by value descending

        setChartData(formattedData);
      } catch (err) {
        console.error("Error fetching events for pie chart:", err);
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
            <PieChartIcon className="h-6 w-6 mr-3 text-primary" />
            Event Category Distribution
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
             <PieChartIcon className="h-6 w-6 mr-3 text-primary" />
            Event Category Distribution
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
             <PieChartIcon className="h-6 w-6 mr-3 text-primary" />
            Event Category Distribution
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
          <PieChartIcon className="h-6 w-6 mr-3 text-primary" />
          Event Category Distribution
        </CardTitle>
        <CardDescription>A breakdown of events by their categories.</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120} // Adjust size as needed
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
