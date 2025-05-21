
import type { Timestamp } from 'firebase/firestore';
import type { EventTag } from './constants'; // Added for EventTag type

export type UserRole = 'admin' | 'organizer' | 'attendee';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
}

export interface Speaker {
  name: string;
  title: string;
  imageUrl?: string;
  bio?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string; // ISO string or YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  posterUrl: string; // Will store Firebase Storage URL or be empty
  creatorId: string;
  creatorName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rsvpCount?: number;
  tags: string[];
  keywords: string[];
  feedbackCount: number;
  averageRating: number;
  speakers: Speaker[];
  pastEventImageUrls: string[];
}

export interface Rsvp {
  userId: string;
  eventId: string;
  timestamp: Timestamp;
  rsvpToken: string;
  checkedIn: boolean;
  checkedInAt: Timestamp | null;
}

// EventFormData is used for form handling, posterUrl is for existing or manual URL, posterFile for new uploads
export type EventFormData = Omit<Event, 'id' | 'creatorId' | 'createdAt' | 'updatedAt' | 'rsvpCount' | 'creatorName' | 'keywords' | 'tags' | 'feedbackCount' | 'averageRating' | 'speakers' | 'pastEventImageUrls' | 'posterUrl'> & {
  posterUrl?: string; // Optional: for manual URL input or keeping existing URL
  posterFile?: File | null; // For new file uploads
  tags?: string;
  speakers_json_str?: string;
  past_event_image_urls_str?: string;
};

export type ClientEvent = Omit<Event, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export interface Feedback {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Timestamp;
}

export type ClientFeedback = Omit<Feedback, 'createdAt'> & {
  createdAt: string;
};

export type FeedbackFormData = Omit<Feedback, 'id' | 'eventId' | 'userId' | 'userName' | 'createdAt'>;
