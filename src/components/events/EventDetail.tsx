
"use client";

import type { ClientEvent, Feedback as FeedbackType, Speaker } from "@/lib/types";
import Image from "next/image";
import { CalendarDays, Clock, MapPin, UserCircle, Users2, Edit3, Tags, MessageCircle, Users, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import RsvpButtonClient from "./RsvpButtonClient";
import DeleteEventButtonClient from "./DeleteEventButtonClient";
import CurrentUserContextClient from "./CurrentUserContextClient";
import RealtimeRsvpGraph from './RealtimeRsvpGraph';
import EventCheckin from './EventCheckin';
import AddToCalendarButton from "./AddToCalendarButton";
import { useState, useEffect } from "react";
import StarRatingDisplay from "@/components/ui/StarRatingDisplay";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackList from "@/components/feedback/FeedbackList";
import { getUserFeedbackForEvent } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function EventDetail({ event }: { event: ClientEvent }) {
  const [displayDate, setDisplayDate] = useState<string>(event.date);
  const [isEventPast, setIsEventPast] = useState(false);
  const [userHasSubmittedFeedback, setUserHasSubmittedFeedback] = useState(false);
  const [checkingFeedbackStatus, setCheckingFeedbackStatus] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const parts = event.date.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const localEventDate = new Date(year, month, day);

    setDisplayDate(localEventDate.toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDateObj = new Date(year, month, day, 23, 59, 59);
    setIsEventPast(eventDateObj < today);

  }, [event.date]);

  useEffect(() => {
    if (currentUser && event.id) {
      setCheckingFeedbackStatus(true);
      getUserFeedbackForEvent(event.id, currentUser.uid)
        .then((feedback) => {
          setUserHasSubmittedFeedback(!!feedback);
        })
        .catch(console.error)
        .finally(() => setCheckingFeedbackStatus(false));
    } else {
      setUserHasSubmittedFeedback(false);
      setCheckingFeedbackStatus(false);
    }
  }, [currentUser, event.id]);

  const handleFeedbackSubmitted = () => {
    setUserHasSubmittedFeedback(true);
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <CurrentUserContextClient>
      {(currentUserFromContext) => (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          <div className="bg-card shadow-xl rounded-lg overflow-hidden">
            <div className="relative w-full h-64 md:h-96">
              <Image
                src={event.posterUrl || "https://placehold.co/1200x600.png"}
                alt={event.title}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint="event banner"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw"
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="secondary" className="text-accent-foreground bg-accent text-sm px-3 py-1">
                    <Tags className="h-4 w-4 mr-2" />
                    {event.category}
                  </Badge>
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      {event.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {(currentUser?.uid === event.creatorId || currentUser?.role === 'admin') && (
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/edit/${event.id}`}>
                        <Edit3 className="h-4 w-4 mr-2" /> Edit
                      </Link>
                    </Button>
                  <DeleteEventButtonClient eventId={event.id} redirectOnDelete />
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4 font-heading">{event.title}</h1>

              <div className="flex items-center gap-x-4 mb-4 text-muted-foreground">
                 {event.feedbackCount > 0 && (
                    <div className="flex items-center gap-1">
                      <StarRatingDisplay rating={event.averageRating} size={20} />
                      <span className="text-sm">({event.averageRating.toFixed(1)} average)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span className="text-sm">{event.feedbackCount} review{event.feedbackCount !== 1 ? 's' : ''}</span>
                  </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-muted-foreground">
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-3 text-primary" />
                  <span>{displayDate}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-primary" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center col-span-1 md:col-span-2">
                  <MapPin className="h-5 w-5 mr-3 text-primary shrink-0" />
                  <span className="truncate" title={event.location}>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <UserCircle className="h-5 w-5 mr-3 text-primary" />
                  <span>Organized by: {event.creatorName || "Campus Group"}</span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none mb-6 text-foreground">
                <h2 className="text-xl font-semibold mb-2 font-heading">About this event</h2>
                <p className="whitespace-pre-wrap">{event.description || "No description provided."}</p>
              </div>

              <Separator className="my-6" />

              {event.speakers && event.speakers.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 font-heading flex items-center">
                    <Users className="h-6 w-6 mr-3 text-primary" />
                    Speakers & Guests
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {event.speakers.map((speaker, index) => (
                      <Card key={index} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Avatar className="w-24 h-24 mx-auto mb-3 border-2 border-primary">
                            <AvatarImage src={speaker.imageUrl || `https://placehold.co/150x150.png?text=${getInitials(speaker.name)}`} alt={speaker.name} data-ai-hint="speaker photo" />
                            <AvatarFallback>{getInitials(speaker.name)}</AvatarFallback>
                          </Avatar>
                          <h3 className="text-lg font-semibold font-heading text-primary">{speaker.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">{speaker.title}</p>
                          {speaker.bio && <p className="text-xs text-muted-foreground italic line-clamp-3">{speaker.bio}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                   <Separator className="my-8" />
                </div>
              )}


              <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-lg">
                  <Users2 className="h-6 w-6 text-primary" />
                  <span className="font-semibold">{event.rsvpCount || 0}</span>
                  <span className="text-muted-foreground">RSVP{event.rsvpCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
                  {currentUser?.uid !== event.creatorId && (
                    <RsvpButtonClient eventId={event.id} size="lg" />
                  )}
                  <AddToCalendarButton event={event} />
                </div>
              </div>
            </div>
          </div>

          {(currentUser?.uid === event.creatorId || currentUser?.role === 'admin') && (
            <>
              <RealtimeRsvpGraph eventId={event.id} />
              <EventCheckin eventId={event.id} />
            </>
          )}

          {isEventPast && event.pastEventImageUrls && event.pastEventImageUrls.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 font-heading flex items-center">
                <Camera className="h-6 w-6 mr-3 text-primary" />
                Event Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {event.pastEventImageUrls.map((url, index) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <Image
                      src={url || "https://placehold.co/400x400.png"}
                      alt={`Event gallery image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="hover:scale-105 transition-transform duration-300"
                      data-ai-hint="event photo"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>
              <Separator className="my-8" />
            </div>
          )}

          <div className="space-y-8">
            {isEventPast && currentUser && !checkingFeedbackStatus && (
              <FeedbackForm
                eventId={event.id}
                onFeedbackSubmitted={handleFeedbackSubmitted}
                disabled={userHasSubmittedFeedback}
              />
            )}
            <FeedbackList eventId={event.id} />
          </div>

        </div>
      )}
    </CurrentUserContextClient>
  );
}
