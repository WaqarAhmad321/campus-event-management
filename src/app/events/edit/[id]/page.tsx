
"use client"; // Needs to be client for useAuth and router, and to pass event data to form

import EventForm from "@/components/events/EventForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getEventById } from "@/lib/firebase/firestore"; // Fetch on client for simplicity here
import type { Event } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditEventPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push(`/auth/login?redirect=/events/edit/${eventId}`);
      return;
    }

    if (eventId) {
      getEventById(eventId)
        .then((fetchedEvent) => {
          if (fetchedEvent) {
            if (fetchedEvent.creatorId !== currentUser.uid) {
              toast({ title: "Unauthorized", description: "You are not authorized to edit this event.", variant: "destructive" });
              router.push(`/events/${eventId}`); // Redirect to event detail page
            } else {
              setEvent(fetchedEvent);
            }
          } else {
            setError("Event not found.");
            toast({ title: "Error", description: "Event not found.", variant: "destructive"});
          }
        })
        .catch((err) => {
          console.error("Error fetching event:", err);
          setError("Failed to load event data.");
          toast({ title: "Error", description: "Failed to load event data.", variant: "destructive"});
        })
        .finally(() => setLoadingEvent(false));
    }
  }, [currentUser, authLoading, router, eventId, toast]);

  if (authLoading || loadingEvent) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]"><p className="text-destructive">{error}</p></div>;
  }

  if (!event) {
     // This state could be reached if event fetching finished but event is null (e.g. not found after auth check)
    return <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]"><p>Event not found or access denied.</p></div>;
  }
  

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Event</CardTitle>
          <CardDescription>Update the details for your event below.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm mode="edit" event={event} />
        </CardContent>
      </Card>
    </div>
  );
}
