
"use client";
import { useEffect, useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import { CalendarDays, CalendarClock, LayoutGrid, Tags, Users, Star } from 'lucide-react';
import { getTotalEventsCount, getUpcomingEventsCount, getEvents, getTotalUsersCount } from '@/lib/firebase/firestore';
import type { Event as FirestoreEvent } from '@/lib/types'; // Import Event type

// Helper function to calculate active categories and tags from an array of events
function getActiveCategoriesAndTagsCountFromEvents(allEvents: FirestoreEvent[]) {
  const uniqueCategories = new Set(allEvents.map(e => e.category));
  const uniqueTags = new Set(allEvents.flatMap(e => e.tags || []));
  return { categoriesCount: uniqueCategories.size, tagsCount: uniqueTags.size };
}

// Helper function to calculate overall average rating from an array of events
function getOverallAverageRatingFromEvents(allEvents: FirestoreEvent[]) {
  const withFeedback = allEvents.filter(e => e.feedbackCount > 0);
  if (!withFeedback.length) return null;
  
  const total = withFeedback.reduce((sum, e) => sum + (e.averageRating * e.feedbackCount), 0);
  const count = withFeedback.reduce((sum, e) => sum + e.feedbackCount, 0);
  return count ? parseFloat((total / count).toFixed(2)) : null;
}


export default function StatsDisplay() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all events once
        const allEventsPromise = getEvents({ orderByField: 'title' });

        const results = await Promise.allSettled([
          getTotalEventsCount(),
          getUpcomingEventsCount(),
          allEventsPromise, // Include the promise for all events
          getTotalUsersCount(),
        ]);

        // Check for any rejected promises before processing allEvents
        const initialRejection = results.slice(0, 2).find(r => r.status === 'rejected') || results[3]?.status === 'rejected' ? results[3] : undefined;
        if (initialRejection?.status === 'rejected') {
          throw new Error(initialRejection.reason?.message || 'Core stats data load failed');
        }
        
        const allEventsResult = results[2];
        if (allEventsResult.status === 'rejected') {
          throw new Error(allEventsResult.reason?.message || 'Failed to load event data for stats derivation');
        }
        
        const allEvents = allEventsResult.status === 'fulfilled' ? allEventsResult.value : [];


        const [
          totalEventsCountResult,
          upcomingEventsCountResult,
          , // Placeholder for allEventsPromise, already handled
          totalUsersCountResult
        ] = results;

        const totalEventsCount = totalEventsCountResult.status === 'fulfilled' ? totalEventsCountResult.value : 0;
        const upcomingEventsCount = upcomingEventsCountResult.status === 'fulfilled' ? upcomingEventsCountResult.value : 0;
        const totalUsersCount = totalUsersCountResult.status === 'fulfilled' ? totalUsersCountResult.value : 0;

        // Derive stats from the single fetch of allEvents
        const { categoriesCount, tagsCount } = getActiveCategoriesAndTagsCountFromEvents(allEvents);
        const averageRating = getOverallAverageRatingFromEvents(allEvents);

        setStats([
          { title: "Total Events", value: totalEventsCount, icon: <CalendarDays className="h-6 w-6 text-primary" /> },
          { title: "Upcoming Events", value: upcomingEventsCount, icon: <CalendarClock className="h-6 w-6 text-green-600" /> },
          { title: "Active Categories", value: categoriesCount, icon: <LayoutGrid className="h-6 w-6 text-purple-600" /> },
          { title: "Unique Tags", value: tagsCount, icon: <Tags className="h-6 w-6 text-orange-600" /> },
          { title: "Registered Users", value: totalUsersCount, icon: <Users className="h-6 w-6 text-blue-600" /> },
          { title: "Avg. Rating", value: averageRating !== null ? averageRating.toFixed(1) : "N/A", icon: <Star className="h-6 w-6 text-yellow-500" /> },
        ]);
      } catch (err) {
        console.error('Stats fetch error:', err);
        setError({
          message: 'Failed to load statistics',
          details: err instanceof Error ? err.message : String(err)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="space-y-2">
      <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
        {error.message}
      </div>
      {error.details && (
        <details className="text-sm text-gray-500 dark:text-gray-400">
          <summary>Technical details</summary>
          <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded overflow-x-auto">
            {error.details}
          </pre>
        </details>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map(stat => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value.toString()}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}

// Type definitions
type StatItem = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
};

// Helper functions (now outside useEffect and accept events as param)
// These are now defined at the top of the file
// async function getActiveCategoriesAndTagsCount() { ... }
// async function getOverallAverageRating() { ... }
