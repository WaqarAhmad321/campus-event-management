
"use client";

import { useState, useEffect } from 'react';
import { useRsvpCount } from '@/hooks/useRsvpCount';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

interface RealtimeRsvpGraphProps {
  eventId: string;
}

interface ChartDataPoint {
  time: string; // Formatted time e.g., "HH:mm"
  count: number;
  timestamp: number; 
}

const GRAPH_UPDATE_INTERVAL = 60000; // 1 minute in milliseconds
const MAX_DATA_POINTS = 10; // Show last 10 minutes

export default function RealtimeRsvpGraph({ eventId }: RealtimeRsvpGraphProps) {
  const { count: liveRsvpCount, loading: rsvpsLoading, error: rsvpsError } = useRsvpCount(eventId);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!rsvpsLoading && isInitialLoad) {
      // First time we get a live count, add it as the initial data point
      const now = new Date();
      const initialDataPoint: ChartDataPoint = {
        time: format(now, 'HH:mm'),
        count: liveRsvpCount,
        timestamp: now.getTime(),
      };
      setChartData([initialDataPoint]);
      setIsInitialLoad(false); // Mark initial load as complete
    }

    // This effect sets up the interval for subsequent data points
    // It only runs after the initial load is complete (isInitialLoad is false)
    if (isInitialLoad) return; // Don't start interval until initial point is set

    const intervalId = setInterval(() => {
      setChartData((prevData) => {
        const now = new Date();
        const newDataPoint: ChartDataPoint = {
          time: format(now, 'HH:mm'),
          count: liveRsvpCount, // Use the latest count from the hook
          timestamp: now.getTime(),
        };
        const updatedData = [...prevData, newDataPoint];
        return updatedData.slice(-MAX_DATA_POINTS);
      });
    }, GRAPH_UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [liveRsvpCount, rsvpsLoading, isInitialLoad, eventId]); // eventId added to re-init if it changes (though not expected for this component instance)

  if (rsvpsLoading && isInitialLoad) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Real-time RSVP Trend</CardTitle>
          <CardDescription>Loading initial RSVP data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (rsvpsError) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Real-time RSVP Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-center py-10">Error loading RSVP data: {rsvpsError.message}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Real-time RSVP Trend</CardTitle>
        <CardDescription>RSVP count over the last {MAX_DATA_POINTS} minutes. Current total RSVPs: {liveRsvpCount}</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] p-4 pt-2">
        {chartData.length === 0 && !isInitialLoad ? (
           <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Waiting for first data point. Current RSVPs: {liveRsvpCount}</p>
           </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20, // Adjusted for better spacing
              left: -10, // Adjusted to prevent y-axis label cutoff if numbers are small
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-md)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px', paddingTop: '0px', paddingBottom: '10px' }} />
            <Line
              type="monotone"
              dataKey="count"
              name="RSVPs"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              activeDot={{ r: 7, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
