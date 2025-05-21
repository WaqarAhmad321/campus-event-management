
"use client"; // Make it a Client Component

import { useEffect, useState } from "react";
import { getEvents } from "@/lib/firebase/firestore";
import EventCard from "./EventCard";
import EmptyState from "../ui/EmptyState";
import { FileText, SearchX } from "lucide-react";
import type { Event as FirestoreEvent, ClientEvent } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface EventListProps {
  selectedCategory?: string;
  searchTerms?: string[];
  tags?: string[];
  limit?: number;
  showUserEventsOnly?: boolean;
  userId?: string;
}

export default function EventList({
  selectedCategory = "All",
  searchTerms,
  tags,
  limit,
  showUserEventsOnly = false,
  userId
}: EventListProps) {
  const [clientEvents, setClientEvents] = useState<ClientEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const eventsData: FirestoreEvent[] = await getEvents({
          category: selectedCategory === "All" ? undefined : selectedCategory,
          searchTerms: searchTerms?.length ? searchTerms : undefined,
          selectedTags: tags?.length ? tags : undefined,
          limitCount: limit,
          creatorId: showUserEventsOnly ? userId : undefined,
          orderByField: "date",
          orderDirection: "asc",
        });

        const serializableEvents: ClientEvent[] = eventsData.map(event => ({
          ...event,
          // Ensure createdAt and updatedAt are valid Timestamp objects before calling toDate()
          createdAt: event.createdAt?.toDate ? event.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: event.updatedAt?.toDate ? event.updatedAt.toDate().toISOString() : new Date().toISOString(),
        }));
        setClientEvents(serializableEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, JSON.stringify(searchTerms), JSON.stringify(tags), limit, showUserEventsOnly, userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center py-10">{error}</p>;
  }

  if (clientEvents.length === 0) {
    let emptyTitle = "No Events Found";
    let emptyDescription = "There are no events currently. Why not create one?";
    let icon = <FileText className="w-16 h-16 text-muted-foreground" />;

    if (searchTerms?.length || tags?.length || (selectedCategory && selectedCategory !== "All")) {
      emptyTitle = "No Matching Events";
      emptyDescription = "Try adjusting your search, category, or tag filters.";
      icon = <SearchX className="w-16 h-16 text-muted-foreground" />;
    }

    return <EmptyState
      icon={icon}
      title={emptyTitle}
      description={emptyDescription}
      actionButton={!showUserEventsOnly && !(searchTerms?.length || tags?.length || (selectedCategory && selectedCategory !== "All"))
         ? { text: "Create Event", href: "/events/new" }
         : undefined
      }
      />;
  }

  return (
    <div id="events" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {clientEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
