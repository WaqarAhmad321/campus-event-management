
"use client";

import EventForm from "@/components/events/EventForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewEventPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/auth/login?redirect=/events/new");
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]"><LoadingSpinner size="lg" /></div>;
  }

  if (!currentUser) {
    // This should ideally not be reached due to the redirect, but as a fallback
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <p>You need to be logged in to create an event.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Create New Event</CardTitle>
          <CardDescription>Fill in the details below to add a new event to the hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
