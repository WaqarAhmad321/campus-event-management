
import EventDetail from "@/components/events/EventDetail";
import { getEventById } from "@/lib/firebase/firestore";
import { notFound } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Metadata, ResolvingMetadata } from 'next'
import type { Event, ClientEvent } from "@/lib/types"; // Added ClientEvent

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const event = await getEventById(id); // This event is of type Event | null

  if (!event) {
    return {
      title: 'Event Not Found | PUCIT Now',
    }
  }
 
  return {
    title: `${event.title} | PUCIT Now`,
    description: event.description.substring(0, 150),
    openGraph: {
      images: [event.posterUrl || 'https://placehold.co/1200x630.png'],
    },
  }
}


export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const eventData = await getEventById(params.id); // Fetches Event (with Timestamps)

  if (!eventData) {
    notFound();
  }
  
  // Serialize Timestamps for the Client Component EventDetail
  const clientEvent: ClientEvent = {
    ...eventData,
    createdAt: eventData.createdAt.toDate().toISOString(),
    updatedAt: eventData.updatedAt.toDate().toISOString(),
  };
  
  return <EventDetail event={clientEvent} />;
}
