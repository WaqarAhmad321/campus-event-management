
"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface RsvpCountState {
  count: number;
  loading: boolean;
  error: FirestoreError | null;
}

export function useRsvpCount(eventId: string): RsvpCountState {
  const [rsvpState, setRsvpState] = useState<RsvpCountState>({
    count: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!eventId) {
      setRsvpState({ count: 0, loading: false, error: null });
      return;
    }

    // Reset loading state for new eventId
    setRsvpState(prevState => ({ count: prevState.count, loading: true, error: null }));

    const rsvpsRef = collection(db, 'events', eventId, 'rsvps');
    const q = query(rsvpsRef);

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setRsvpState({
          count: snapshot.size,
          loading: false,
          error: null,
        });
      },
      (err: FirestoreError) => {
        console.error(`Error fetching RSVP count for event ${eventId}:`, err);
        setRsvpState({
          count: 0,
          loading: false,
          error: err,
        });
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  return rsvpState;
}
