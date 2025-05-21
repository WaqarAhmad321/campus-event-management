
"use client";

import { Suspense } from "react";
import EventList from "@/components/events/EventList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface MyEventsTabProps {
  userId: string;
}

export default function MyEventsTab({ userId }: MyEventsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Created Events</CardTitle>
        <CardDescription>Events you have created and are managing.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* EventList is now a Client Component and handles its own loading state */}
        <EventList showUserEventsOnly userId={userId} />
      </CardContent>
    </Card>
  );
}
