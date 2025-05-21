
"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, collection, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Feedback, ClientFeedback } from "@/lib/types";
import StarRatingDisplay from "@/components/ui/StarRatingDisplay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from "../ui/LoadingSpinner";
import { MessageSquareText } from "lucide-react";

interface FeedbackListProps {
  eventId: string;
}

export default function FeedbackList({ eventId }: FeedbackListProps) {
  const [feedbackItems, setFeedbackItems] = useState<ClientFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const feedbackColRef = collection(db, `events/${eventId}/feedback`);
    const q = query(feedbackColRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data() as Feedback;
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate().toISOString(),
          };
        });
        setFeedbackItems(items);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching feedback:", err);
        setError("Failed to load feedback.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="mt-8 py-10 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive mt-8 text-center">{error}</p>;
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <MessageSquareText className="h-7 w-7 mr-3 text-primary"/>
          Event Feedback
        </CardTitle>
        {feedbackItems.length === 0 && (
           <CardDescription>No feedback submitted yet for this event.</CardDescription>
        )}
      </CardHeader>
      {feedbackItems.length > 0 && (
        <CardContent className="space-y-6">
          {feedbackItems.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg shadow-sm bg-card/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                   <Avatar className="h-9 w-9">
                    {/* Placeholder for user avatar if available */}
                    <AvatarFallback>{item.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-card-foreground">{item.userName}</span>
                </div>
                <StarRatingDisplay rating={item.rating} size={18} />
              </div>
              {item.comment && <p className="text-muted-foreground text-sm mb-2 whitespace-pre-wrap">{item.comment}</p>}
              <p className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
