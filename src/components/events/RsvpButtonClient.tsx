
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { addRsvp, removeRsvp, getUserRsvpForEvent } from "@/lib/firebase/firestore";
import LoadingSpinner from "../ui/LoadingSpinner";
import { Ticket, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface RsvpButtonClientProps {
  eventId: string;
  size?: ButtonProps['size'];
}

export default function RsvpButtonClient({ eventId, size = "sm" }: RsvpButtonClientProps) {
  const { currentUser, loading: authLoading } = useAuth();
  const [isRsvped, setIsRsvped] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For RSVP action specifically
  const [checkingRsvpStatus, setCheckingRsvpStatus] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const checkRsvpStatus = useCallback(async () => {
    if (!currentUser || !eventId) {
      setCheckingRsvpStatus(false);
      return;
    }
    setCheckingRsvpStatus(true);
    try {
      const rsvp = await getUserRsvpForEvent(eventId, currentUser.uid);
      setIsRsvped(!!rsvp);
    } catch (error) {
      console.error("Error checking RSVP status:", error);
      // Optionally show a toast for checking failure
    } finally {
      setCheckingRsvpStatus(false);
    }
  }, [currentUser, eventId]);

  useEffect(() => {
    if (!authLoading) {
      checkRsvpStatus();
    }
  }, [currentUser, authLoading, checkRsvpStatus]);


  const handleRsvp = async () => {
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please log in to RSVP.", variant: "default" });
      router.push(`/auth/login?redirect=/events/${eventId}`);
      return;
    }
    setIsLoading(true);
    try {
      if (isRsvped) {
        await removeRsvp(eventId);
        toast({ title: "RSVP Removed", description: "You are no longer RSVPed to this event." });
        setIsRsvped(false);
      } else {
        await addRsvp(eventId);
        toast({ title: "RSVP Successful!", description: "You have RSVPed to this event." });
        setIsRsvped(true);
      }
      // Trigger revalidation or refresh of parent data if needed, e.g., router.refresh()
      // For now, count updates on event card/detail will rely on full page reload or eventual consistency.
      // To see immediate RSVP count change, a page refresh might be needed or a more complex state management.
       router.refresh(); // Re-fetch server components data
    } catch (error) {
      toast({ title: "RSVP Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || checkingRsvpStatus) {
    return <Button size={size} disabled className="w-full sm:w-auto"><LoadingSpinner size="sm" /> Checking...</Button>;
  }

  return (
    <Button onClick={handleRsvp} disabled={isLoading} variant={isRsvped ? "secondary" : "default"} size={size} className="w-full sm:w-auto">
      {isLoading ? <LoadingSpinner size="sm" className="mr-2"/> : (isRsvped ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />)}
      {isRsvped ? "RSVPed" : "RSVP Now"}
    </Button>
  );
}
