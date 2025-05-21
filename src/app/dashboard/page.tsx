
"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MyEventsTab from "@/components/dashboard/MyEventsTab";
import RsvpedEventsList from "@/components/dashboard/RsvpedEventsList";
import { User, CalendarClock, History, Bookmark, GripVertical, Filter, PlusCircle, LibraryBig } from "lucide-react";
import EventList from "@/components/events/EventList";
import CategoryFilterClient from "@/components/events/CategoryFilterClient";
import SearchBarClient from "@/components/events/SearchBarClient";
import TagFilterClient from "@/components/events/TagFilterClient";
import { EVENT_TAGS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import EventTypePieChart from "@/components/analytics/EventTypePieChart";
import EventCategoryBarChart from "@/components/analytics/EventCategoryBarChart";
import StatsDisplay from '@/components/dashboard/StatsDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import Link from "next/link";

function StatsSkeletonFallback() {
  return (
    <div className="mb-12 mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="shadow-lg bg-card rounded-xl border-border/30"> {/* Adjusted border and shadow */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-3/5 bg-muted/70" />
            <Skeleton className="h-6 w-6 rounded-full bg-muted/70" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/4 mb-2 bg-muted/70" />
            <Skeleton className="h-4 w-4/5 bg-muted/70" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [currentUser, authLoading, router]);

  const selectedCategory = searchParams?.get("category") || "All";
  const searchQuery = searchParams?.get("search") || "";
  const selectedTagsQuery = searchParams?.get("tags") || "";

  const searchTermsArray = searchQuery ? searchQuery.toLowerCase().split(/\s+/).filter(Boolean) : [];
  const selectedTagsArray = selectedTagsQuery ? selectedTagsQuery.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8"> {/* Main container is already in layout.tsx for dashboard, so using space-y */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-heading"> {/* Added font-heading */}
          Welcome back, <span className="text-primary">{currentUser.displayName?.split(' ')[0] || 'User'}</span> 👋
        </h1>
        <p className="text-muted-foreground text-lg">Here's what's happening on campus.</p>
      </div>

      {/* <Suspense fallback={<StatsSkeletonFallback />}>
        <StatsDisplay />
      </Suspense> */}

      <Tabs defaultValue="all-events" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6 bg-muted p-1 rounded-lg shadow-inner"> {/* Simplified rounding */}
          <TabsTrigger value="all-events" className="flex items-center gap-2 text-sm sm:text-base rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"> {/* Simplified rounding */}
            <GripVertical className="h-5 w-5" /> All Events
          </TabsTrigger>
          <TabsTrigger value="my-created-events" className="flex items-center gap-2 text-sm sm:text-base rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <User className="h-5 w-5" /> My Created
          </TabsTrigger>
          <TabsTrigger value="upcoming-rsvps" className="flex items-center gap-2 text-sm sm:text-base rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <CalendarClock className="h-5 w-5" /> Upcoming RSVPs
          </TabsTrigger>
          <TabsTrigger value="past-rsvps" className="flex items-center gap-2 text-sm sm:text-base rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <History className="h-5 w-5" /> Past RSVPs
          </TabsTrigger>
          <TabsTrigger value="saved-events" className="flex items-center gap-2 text-sm sm:text-base rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <Bookmark className="h-5 w-5" /> Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-events">
          <Card className="shadow-lg border-border/60 bg-card"> {/* Adjusted border and shadow */}
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Discover Events</CardTitle>
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
                    <Filter className="h-5 w-5 text-primary" />
                    Filters
                  </h3>
                  <div>
                    <p className="text-md font-semibold mb-2 text-foreground/90">Category</p>
                    <CategoryFilterClient />
                  </div>
                  <Separator  className="border-border/50" />
                  <div>
                    <p className="text-md font-semibold mb-2 text-foreground/90">Tags</p>
                    <TagFilterClient availableTags={EVENT_TAGS} />
                  </div>
                  {(currentUser.role === 'admin' || currentUser.role === 'organizer') && (
                    <>
                      <Separator className="border-border/50" />
                       <Button className="w-full bg-primary hover:bg-primary/80 text-primary-foreground rounded-md py-3 text-base shadow-md hover:shadow-lg transform active:scale-95 transition-all">
                        <Link href="/events/new">
                          <PlusCircle className="mr-2 h-5 w-5" /> Create New Event
                        </Link>
                      </Button>
                    </>
                  )}
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
        </TabsContent>

        <TabsContent value="my-created-events">
          <MyEventsTab userId={currentUser.uid} />
        </TabsContent>
        <TabsContent value="upcoming-rsvps">
          <RsvpedEventsList userId={currentUser.uid} filterMode="upcoming" />
        </TabsContent>
        <TabsContent value="past-rsvps">
          <RsvpedEventsList userId={currentUser.uid} filterMode="past" />
        </TabsContent>
        <TabsContent value="saved-events">
          <Card className="shadow-lg rounded-lg bg-card border-border/60"> {/* Adjusted border and shadow */}
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">Saved Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This feature is coming soon! You'll be able to save events you're interested in here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <EventTypePieChart />
        <EventCategoryBarChart />
      </div>
    </div>
  );
}
