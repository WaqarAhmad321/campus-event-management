
"use client";

import type { ClientEvent } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, MapPin, Users2, Edit3, Tag, ArrowRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RsvpButtonClient from "./RsvpButtonClient";
import DeleteEventButtonClient from "./DeleteEventButtonClient";
import CurrentUserContextClient from "./CurrentUserContextClient";
import { useState, useEffect } from "react";
import StarRatingDisplay from "@/components/ui/StarRatingDisplay";

interface EventCardProps {
  event: ClientEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const [displayDate, setDisplayDate] = useState<string>(event.date);

  useEffect(() => {
    const parts = event.date.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const localEventDate = new Date(year, month, day);

    setDisplayDate(localEventDate.toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    }));
  }, [event.date]);

  const MAX_TAGS_DISPLAY = 2;
  const displayedTags = event.tags?.slice(0, MAX_TAGS_DISPLAY) || [];
  const remainingTagsCount = event.tags ? Math.max(0, event.tags.length - MAX_TAGS_DISPLAY) : 0;

  return (
    <Card className="group flex flex-col overflow-hidden rounded-xl border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out h-full">
      <CardHeader className="p-0 relative">
        <div className="aspect-[16/9] w-full overflow-hidden">
          <Image
            src={event.posterUrl || "https://placehold.co/600x338.png"}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint="event poster"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <Badge variant="secondary" className="absolute top-3 right-3 text-sm bg-background/80 text-foreground backdrop-blur-sm shadow-md">
          {event.category}
        </Badge>
      </CardHeader>
      <CardContent className="p-5 flex-grow flex flex-col">
        <div className="mb-3 flex flex-wrap gap-2 items-center">
          {displayedTags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs font-medium">{tag}</Badge>
          ))}
          {remainingTagsCount > 0 && (
            <Badge variant="outline" className="text-xs font-medium">+{remainingTagsCount} more</Badge>
          )}
        </div>
        <CardTitle className="text-xl font-bold font-heading mb-2 leading-tight">
          <Link href={`/events/${event.id}`} className="hover:text-primary transition-colors line-clamp-2" title={event.title}>
            {event.title}
          </Link>
        </CardTitle>
        
        {event.feedbackCount > 0 && (
          <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
            <StarRatingDisplay rating={event.averageRating} size={16} />
            <span>({event.averageRating.toFixed(1)})</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">{event.description || "No description available."}</p>
        
        <div className="space-y-1.5 text-sm text-muted-foreground mt-auto border-t border-border/50 pt-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{displayDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate" title={event.location}>{event.location}</span>
          </div>
        </div>
      </CardContent>
      <CurrentUserContextClient>
        {(currentUser) => (
          <CardFooter className="p-4 border-t bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users2 className="h-4 w-4 text-primary" />
              <span>{event.rsvpCount || 0} RSVP{event.rsvpCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
            {currentUser?.uid === event.creatorId || currentUser?.role === 'admin' ? (
                <>
                  <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                    <Link href={`/events/edit/${event.id}`}>
                      <Edit3 className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                       <span className="sm:hidden">Edit</span>
                    </Link>
                  </Button>
                  <DeleteEventButtonClient eventId={event.id} />
                </>
              ) : (
                 <RsvpButtonClient eventId={event.id} className="flex-1 sm:flex-none"/>
              )}
            </div>
          </CardFooter>
        )}
      </CurrentUserContextClient>
    </Card>
  );
}
