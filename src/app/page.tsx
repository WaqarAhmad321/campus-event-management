
"use client" // For using hooks like useSearchParams
import HeroSection from "@/components/ui/HeroSection";
import EventList from "@/components/events/EventList";
import CategoryFilterClient from "@/components/events/CategoryFilterClient";
import SearchBarClient from "@/components/events/SearchBarClient";
import TagFilterClient from "@/components/events/TagFilterClient";
import { EVENT_TAGS } from "@/lib/constants";
import StatsDisplay from "@/components/dashboard/StatsDisplay";
import EventTypePieChart from "@/components/analytics/EventTypePieChart";
import EventCategoryBarChart from "@/components/analytics/EventCategoryBarChart";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { useSearchParams } from "next/navigation"; // Import for searchParams

// Skeleton for StatsDisplay
function StatsSkeletonFallback() {
  return (
    <div className="mb-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"> {/* Adjusted for 6 cards */}
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/4 mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


export default function HomePage() {
  const searchParams = useSearchParams(); // Get searchParams on the client

  const selectedCategory = searchParams?.get("category") || "All";
  const searchQuery = searchParams?.get("search") || "";
  const selectedTagsQuery = searchParams?.get("tags") || "";

  const searchTermsArray = searchQuery ? searchQuery.toLowerCase().split(/\s+/).filter(Boolean) : [];
  const selectedTagsArray = selectedTagsQuery ? selectedTagsQuery.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-12"> {/* Main container is already in layout.tsx */}
      <HeroSection />

      <Suspense fallback={<StatsSkeletonFallback />}>
        <StatsDisplay />
      </Suspense>

      <Card className="shadow-xl border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-3xl font-bold text-primary">Discover Events</CardTitle>
            <div className="w-full sm:w-auto sm:max-w-md">
              <SearchBarClient />
            </div>
          </div>
        </CardHeader>
        <Separator className="mb-6 border-border/50" />
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-1/4 xl:w-1/5 space-y-6 p-1">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5 text-primary" /> Filters
              </h3>
              <div>
                <p className="text-md font-semibold mb-2 text-foreground/90">Category</p>
                <CategoryFilterClient />
              </div>
              <Separator className="border-border/50" />
              <div>
                <p className="text-md font-semibold mb-2 text-foreground/90">Tags</p>
                <TagFilterClient availableTags={EVENT_TAGS} />
              </div>
            </aside>
            <main className="w-full lg:w-3/4 xl:w-4/5">
              <EventList
                selectedCategory={selectedCategory}
                searchTerms={searchTermsArray}
                tags={selectedTagsArray}
              />
            </main>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <EventTypePieChart />
        <EventCategoryBarChart />
      </div>
    </div>
  );
}
