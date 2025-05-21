
"use client";

import { useState, useEffect, useMemo } from "react";
import type { ClientEvent, Event as FirestoreEvent, Rsvp } from "@/lib/types";
import { getRsvpsByUserId, getEvents } from "@/lib/firebase/firestore";
import EventCard from "@/components/events/EventCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EmptyState from "../ui/EmptyState";
import { CalendarCheck, CalendarX } from "lucide-react";

interface RsvpedEventsListProps {
  userId: string;
  filterMode: "upcoming" | "past";
}

export default function RsvpedEventsList({ userId, filterMode }: RsvpedEventsListProps) {
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRsvpedEvents = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const rsvps = await getRsvpsByUserId(userId);
        const eventIds = rsvps.map((rsvp) => rsvp.eventId);

        if (eventIds.length === 0) {
          setEvents([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch events by IDs. Note: getEvents with eventIds might need batching if many IDs.
        const fetchedEvents: FirestoreEvent[] = await getEvents({ eventIds: eventIds.slice(0,30) }); // Max 30 for 'in' query

         const clientEvents: ClientEvent[] = fetchedEvents.map(event => ({
          ...event,
          createdAt: event.createdAt.toDate().toISOString(),
          updatedAt: event.updatedAt.toDate().toISOString(),
        }));

        setEvents(clientEvents);
      } catch (err) {
        console.error("Error fetching RSVPed events:", err);
        setError("Failed to load your RSVPed events.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRsvpedEvents();
  }, [userId]);

  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare date part only

    return events.filter((event) => {
      const eventDate = new Date(event.date); // Assuming event.date is YYYY-MM-DD
      eventDate.setHours(0,0,0,0); // Normalize event date as well

      if (filterMode === "upcoming") {
        return eventDate >= today;
      } else { // past
        return eventDate < today;
      }
    }).sort((a, b) => { // Sort: upcoming ascending, past descending
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filterMode === "upcoming" ? dateA - dateB : dateB - dateA;
    });
  }, [events, filterMode]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  const cardTitle = filterMode === "upcoming" ? "Upcoming RSVPed Events" : "Past RSVPed Events";
  const cardDescription = filterMode === "upcoming"
    ? "Events you have RSVPed to that are yet to happen."
    : "Events you RSVPed to that have already passed.";

  if (filteredEvents.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{cardTitle}</CardTitle>
                <CardDescription>{cardDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                 <EmptyState 
                    icon={filterMode === "upcoming" ? <CalendarCheck className="w-12 h-12 text-muted-foreground" /> : <CalendarX className="w-12 h-12 text-muted-foreground" />}
                    title={`No ${filterMode} events`}
                    description={filterMode === "upcoming" ? "You haven't RSVPed to any upcoming events yet. Explore and find something exciting!" : "No past events you RSVPed to."}
                    actionButton={filterMode === "upcoming" ? { text: "Explore Events", href: "/" } : undefined}
                />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
