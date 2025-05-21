
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  collectionGroup,
  getCountFromServer,
  runTransaction
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "./config";
import type { Event, EventFormData, Rsvp, UserProfile, UserRole, Feedback, FeedbackFormData, Speaker } from "@/lib/types";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/constants";
import { format } from 'date-fns';

// Events Collection
const eventsCollection = collection(db, "events");
const usersCollection = collection(db, "users"); // Added for user count

// Helper to upload image and get URL
async function uploadImageAndGetURL(file: File, parentId: string, imageType: 'poster' | 'gallery' | 'speaker_avatar', fileNamePrefix: string = ''): Promise<string> {
  const uniqueFileName = `${fileNamePrefix}${Date.now()}_${file.name.replace(/\s+/g, '_')}`; // Sanitize file name slightly
  const filePath = `event_images/${parentId}/${imageType}/${uniqueFileName}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

// Helper to delete image from Firebase Storage
async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
    // Not a Firebase Storage URL or empty, skip deletion
    console.warn("Skipping deletion of non-Firebase Storage URL or empty URL:", imageUrl);
    return;
  }
  try {
    const storageRef = ref(storage, imageUrl); // imageUrl is the full download URL
    await deleteObject(storageRef);
    console.log("Successfully deleted old image from storage:", imageUrl);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn("Old image not found in storage, skipping deletion:", imageUrl);
    } else {
      console.error("Error deleting old image from storage:", imageUrl, error);
      // Optionally re-throw or handle as non-critical
    }
  }
}


// Get current user profile with role
const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const data = userDoc.data();
    return { role: 'attendee', ...data } as UserProfile;
  }
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: 'attendee'
  };
}

const generateKeywords = (title: string, description: string, tags: string[]): string[] => {
  const content = `${title.toLowerCase()} ${description.toLowerCase()} ${tags.join(' ')}`;
  const words = content.split(/\s+/).filter(Boolean);
  return Array.from(new Set(words));
};

const processTags = (tagsString?: string): string[] => {
  if (!tagsString) return [];
  return Array.from(new Set(tagsString.split(',').map(tag => tag.trim()).filter(Boolean)));
};

const processSpeakers = (speakersJsonStr?: string): Speaker[] => {
  if (!speakersJsonStr) return [];
  try {
    const parsedSpeakers = JSON.parse(speakersJsonStr);
    if (Array.isArray(parsedSpeakers)) {
      return parsedSpeakers.filter(sp => sp && typeof sp.name === 'string' && typeof sp.title === 'string');
    }
    console.warn("Invalid JSON format for speakers. Expected an array.");
    return [];
  } catch (error) {
    console.error("Error parsing speakers JSON:", error);
    return [];
  }
};

const processPastEventImageUrls = (urlsStr?: string): string[] => {
  if (!urlsStr) return [];
  return urlsStr.split(',').map(url => url.trim()).filter(Boolean);
};

// Add Event
export const addEvent = async (eventData: EventFormData): Promise<string> => {
  const currentUserProfile = await getCurrentUserProfile();
  if (!currentUserProfile || !currentUserProfile.uid) {
    throw new Error("User not authenticated to add event.");
  }
  if (currentUserProfile.role !== 'admin' && currentUserProfile.role !== 'organizer') {
    throw new Error("User does not have permission to create events.");
  }

  // Temporarily generate an ID for storage path if needed for poster before event doc ID exists
  const tempEventIdForStorage = doc(collection(db, '_temp')).id;
  let finalPosterUrl = eventData.posterUrl || ""; // Use manual URL if no file

  if (eventData.posterFile) {
    finalPosterUrl = await uploadImageAndGetURL(eventData.posterFile, tempEventIdForStorage, 'poster', 'event_poster_');
  }

  const processedTags = processTags(eventData.tags);
  const generatedKeywords = generateKeywords(eventData.title, eventData.description, processedTags);
  const processedSpeakers = processSpeakers(eventData.speakers_json_str);
  const processedPastEventImageUrls = processPastEventImageUrls(eventData.past_event_image_urls_str);

  const newEventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: any, updatedAt?: any } = {
    title: eventData.title,
    description: eventData.description,
    category: eventData.category,
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    posterUrl: finalPosterUrl,
    creatorId: currentUserProfile.uid,
    creatorName: currentUserProfile.displayName || "Anonymous",
    rsvpCount: 0,
    tags: processedTags,
    keywords: generatedKeywords,
    feedbackCount: 0,
    averageRating: 0,
    speakers: processedSpeakers,
    pastEventImageUrls: processedPastEventImageUrls,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(eventsCollection, newEventData);
  
  // If a temp ID was used for an image path, ideally update the path or re-upload to correct ID path (complex)
  // For simplicity, current upload path uses a temp ID. Production might need more robust pathing.
  if (eventData.posterFile && finalPosterUrl.includes(tempEventIdForStorage)) {
    console.warn(`Poster for new event ${docRef.id} was uploaded with temp path ID ${tempEventIdForStorage}. Consider path update strategy.`);
    // A more robust solution might be to create the event doc first, then upload image with final eventId, then update event doc with posterUrl.
    // Or, create a placeholder, upload, then update. This simpler approach is used for now.
  }
  
  return docRef.id;
};

// Get All Events (with optional filters)
interface GetEventsOptions {
  category?: string;
  creatorId?: string;
  limitCount?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  searchTerms?: string[];
  selectedTags?: string[];
  eventIds?: string[];
}
export const getEvents = async (options: GetEventsOptions = {}): Promise<Event[]> => {
  const qConstraints = [];
  if (options.category && options.category !== "All") {
    qConstraints.push(where("category", "==", options.category));
  }
  if (options.creatorId) {
    qConstraints.push(where("creatorId", "==", options.creatorId));
  }
  if (options.searchTerms && options.searchTerms.length > 0) {
    qConstraints.push(where("keywords", "array-contains-any", options.searchTerms.slice(0, 30)));
  }
  if (options.selectedTags && options.selectedTags.length > 0) {
    qConstraints.push(where("tags", "array-contains-any", options.selectedTags.slice(0, 30)));
  }
   if (options.eventIds && options.eventIds.length > 0) {
    if (options.eventIds.length > 30) {
        console.warn("Fetching more than 30 event IDs at once, this might require multiple queries.");
    }
    qConstraints.push(where("__name__", "in", options.eventIds.slice(0,30))); // Max 30 for 'in' query
  }

  qConstraints.push(orderBy(options.orderByField || "date", options.orderDirection || "asc"));

  if (options.limitCount) {
    qConstraints.push(firestoreLimit(options.limitCount));
  }
  
  const q = query(eventsCollection, ...qConstraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
};


// Get Single Event
export const getEventById = async (id: string): Promise<Event | null> => {
  const docRef = doc(db, "events", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const eventData = { id: docSnap.id, ...docSnap.data() } as Event;
    return eventData;
  }
  return null;
};

// Update Event
export const updateEvent = async (id: string, formData: EventFormData): Promise<void> => {
  const currentUserProfile = await getCurrentUserProfile();
  if (!currentUserProfile || !currentUserProfile.uid) {
    throw new Error("User not authenticated.");
  }

  const eventRef = doc(db, "events", id);
  const eventDocSnap = await getDoc(eventRef);
  if (!eventDocSnap.exists()) {
    throw new Error("Event not found.");
  }

  const existingEventData = eventDocSnap.data() as Event;
  if (currentUserProfile.role !== 'admin' && existingEventData.creatorId !== currentUserProfile.uid) {
    throw new Error("User not authorized to update this event.");
  }

  let updateData: { [key: string]: any } = {}; // More flexible type for constructing update object

  // Map provided fields, excluding special handling fields
  for (const key in formData) {
    if (key !== 'tags' && key !== 'speakers_json_str' && key !== 'past_event_image_urls_str' && key !== 'posterFile' && key !== 'posterUrl' && key in initialEventDataForUpdate) {
      (updateData as any)[key] = formData[key as keyof typeof formData];
    }
  }

  // Handle poster update
  let newPosterUrl = existingEventData.posterUrl; // Default to existing
  if (formData.posterFile) {
    // New file uploaded, replace old one
    if (existingEventData.posterUrl) {
      await deleteImageFromStorage(existingEventData.posterUrl);
    }
    newPosterUrl = await uploadImageAndGetURL(formData.posterFile, id, 'poster', 'event_poster_');
  } else if (formData.posterUrl !== undefined && formData.posterUrl !== existingEventData.posterUrl) {
    // Poster URL field was changed (could be set to "" for removal, or a new manual URL)
    if (existingEventData.posterUrl && formData.posterUrl === "") { // Poster explicitly removed
      await deleteImageFromStorage(existingEventData.posterUrl);
    }
    newPosterUrl = formData.posterUrl;
  }
  updateData.posterUrl = newPosterUrl;


  if (formData.tags !== undefined) {
    updateData.tags = processTags(formData.tags);
  }

  if (formData.speakers_json_str !== undefined) {
    updateData.speakers = processSpeakers(formData.speakers_json_str);
  }

  if (formData.past_event_image_urls_str !== undefined) {
    updateData.pastEventImageUrls = processPastEventImageUrls(formData.past_event_image_urls_str);
  }

  const newTitle = updateData.title ?? existingEventData.title;
  const newDescription = updateData.description ?? existingEventData.description;
  const newTags = updateData.tags ?? existingEventData.tags ?? [];

  if (updateData.title || updateData.description || updateData.tags !== undefined) {
    updateData.keywords = generateKeywords(newTitle, newDescription, newTags);
  }

  if (Object.keys(updateData).length > 0 || updateData.posterUrl !== existingEventData.posterUrl) { // check if posterUrl actually changed
    await updateDoc(eventRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  }
};

const initialEventDataForUpdate: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'feedbackCount' | 'averageRating' | 'creatorId' | 'creatorName' | 'rsvpCount' | 'keywords' | 'posterUrl'>> = {
    title: "",
    description: "",
    category: EVENT_CATEGORIES[0] as EventCategory,
    date: "",
    time: "",
    location: "",
    // posterUrl: "", // Handled separately
    tags: [],
    speakers: [],
    pastEventImageUrls: [],
};


// Delete Event
export const deleteEvent = async (id: string): Promise<void> => {
  const currentUserProfile = await getCurrentUserProfile();
  if (!currentUserProfile || !currentUserProfile.uid) {
    throw new Error("User not authenticated.");
  }

  const eventRef = doc(db, "events", id);
  const eventDoc = await getDoc(eventRef);
  if (!eventDoc.exists()) {
    throw new Error("Event not found.");
  }
  const eventData = eventDoc.data() as Event;
  if (currentUserProfile.role !== 'admin' && eventData.creatorId !== currentUserProfile.uid) {
     throw new Error("User not authorized to delete this event.");
  }

  // Delete associated poster image from storage if it exists
  if (eventData.posterUrl) {
    await deleteImageFromStorage(eventData.posterUrl);
  }
  // TODO: Delete gallery images and speaker images if they are also stored in Firebase Storage

  const batch = writeBatch(db);
  batch.delete(eventRef);

  const rsvpsRef = collection(db, `events/${id}/rsvps`);
  const rsvpsQuery = query(rsvpsRef);
  const rsvpSnapshot = await getDocs(rsvpsQuery);
  rsvpSnapshot.forEach(doc => batch.delete(doc.ref));

  const feedbackRef = collection(db, `events/${id}/feedback`);
  const feedbackQuery = query(feedbackRef);
  const feedbackSnapshot = await getDocs(feedbackQuery);
  feedbackSnapshot.forEach(doc => batch.delete(doc.ref));

  await batch.commit();
};


// RSVP System
export const addRsvp = async (eventId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated to RSVP.");

  const eventRef = doc(db, "events", eventId);
  const rsvpRef = doc(db, `events/${eventId}/rsvps`, currentUser.uid);

  const tokenDocRef = doc(collection(db, '_tokens'));
  const rsvpToken = tokenDocRef.id;

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw "Event does not exist!";
      }

      const existingRsvpDoc = await transaction.get(rsvpRef);
      if (existingRsvpDoc.exists()) {
        console.log("User already RSVPed for this event.");
        return;
      }

      transaction.set(rsvpRef, {
        userId: currentUser.uid,
        eventId: eventId,
        timestamp: serverTimestamp(),
        rsvpToken: rsvpToken,
        checkedIn: false,
        checkedInAt: null,
      });

      const currentRsvpCount = eventDoc.data()?.rsvpCount || 0;
      transaction.update(eventRef, { rsvpCount: currentRsvpCount + 1 });
    });
  } catch (e) {
    console.error("RSVP transaction failed: ", e);
    throw e;
  }
};

export const removeRsvp = async (eventId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated.");

  const eventRef = doc(db, "events", eventId);
  const rsvpRef = doc(db, `events/${eventId}/rsvps`, currentUser.uid);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw "Event does not exist!";
      }
      const rsvpDoc = await transaction.get(rsvpRef);
      if (!rsvpDoc.exists()) {
        return;
      }

      transaction.delete(rsvpRef);

      const currentRsvpCount = eventDoc.data()?.rsvpCount || 0;
      transaction.update(eventRef, { rsvpCount: Math.max(0, currentRsvpCount - 1) });
    });
  } catch (e) {
    console.error("Remove RSVP transaction failed: ", e);
    throw e;
  }
};

export const getUserRsvpForEvent = async (eventId: string, userId: string): Promise<Rsvp | null> => {
  if (!userId) return null;
  const rsvpRef = doc(db, `events/${eventId}/rsvps`, userId);
  const docSnap = await getDoc(rsvpRef);
  return docSnap.exists() ? docSnap.data() as Rsvp : null;
};

export const getRsvpsForEvent = async (eventId: string): Promise<Rsvp[]> => {
  const rsvpsRef = collection(db, `events/${eventId}/rsvps`);
  const q = query(rsvpsRef);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Rsvp);
};

export const getRsvpCountForEvent = async (eventId: string): Promise<number> => {
  const rsvpsRef = collection(db, `events/${eventId}/rsvps`);
  const snapshot = await getCountFromServer(rsvpsRef);
  return snapshot.data().count;
}

export const checkInUserWithToken = async (eventId: string, rsvpToken: string): Promise<{success: boolean, message: string}> => {
  const rsvpsRef = collection(db, 'events', eventId, 'rsvps');
  const q = query(rsvpsRef, where('rsvpToken', '==', rsvpToken));

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: false, message: 'Invalid RSVP token or token not found for this event.' };
    }

    const rsvpDocSnapshot = querySnapshot.docs[0];
    const rsvpData = rsvpDocSnapshot.data() as Rsvp;

    if (rsvpData.checkedIn) {
      const checkedInTime = rsvpData.checkedInAt ? new Date(rsvpData.checkedInAt.toDate()).toLocaleTimeString() : 'an unknown time';
      return { success: false, message: `User already checked in at ${checkedInTime}.` };
    }

    await updateDoc(rsvpDocSnapshot.ref, {
      checkedIn: true,
      checkedInAt: serverTimestamp(),
    });

    return { success: true, message: `Successfully checked in user.` };

  } catch (error) {
    console.error("Error during check-in with token:", error);
    return { success: false, message: 'An error occurred during check-in.' };
  }
};

// Feedback System
const feedbackCollection = (eventId: string) => collection(db, `events/${eventId}/feedback`);

export const addFeedback = async (eventId: string, feedbackData: FeedbackFormData): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated to add feedback.");
  }

  const userProfile = await getCurrentUserProfile();
  if (!userProfile) {
    throw new Error("User profile not found.");
  }

  const existingFeedback = await getUserFeedbackForEvent(eventId, currentUser.uid);
  if (existingFeedback) {
    throw new Error("You have already submitted feedback for this event.");
  }

  const newFeedback: Omit<Feedback, 'id'> & { createdAt?: any } = {
    ...feedbackData,
    eventId: eventId,
    userId: currentUser.uid,
    userName: userProfile.displayName || "Anonymous",
    createdAt: serverTimestamp(),
  };

  const eventRef = doc(db, "events", eventId);

  try {
    const feedbackDocRefId = await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error("Event not found.");
      }

      const currentEventData = eventDoc.data() as Event;
      const currentFeedbackCount = currentEventData.feedbackCount || 0;
      const currentTotalRating = (currentEventData.averageRating || 0) * currentFeedbackCount;

      const newFeedbackCount = currentFeedbackCount + 1;
      const newTotalRating = currentTotalRating + feedbackData.rating;
      const newAverageRating = newTotalRating / newFeedbackCount;

      const tempFeedbackDocRef = doc(feedbackCollection(eventId));
      transaction.set(tempFeedbackDocRef, newFeedback);


      transaction.update(eventRef, {
        feedbackCount: newFeedbackCount,
        averageRating: parseFloat(newAverageRating.toFixed(2)),
        updatedAt: serverTimestamp(),
      });

      return tempFeedbackDocRef.id;
    });
    return feedbackDocRefId;
  } catch (error) {
    console.error("Error adding feedback:", error);
    throw error;
  }
};

export const getFeedbackForEvent = async (eventId: string): Promise<Feedback[]> => {
  const q = query(feedbackCollection(eventId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
};

export const getUserFeedbackForEvent = async (eventId: string, userId: string): Promise<Feedback | null> => {
  if (!userId) return null;
  const q = query(feedbackCollection(eventId), where("userId", "==", userId), firestoreLimit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Feedback;
  }
  return null;
};

// Stats Functions
export const getTotalEventsCount = async (): Promise<number> => {
  const snapshot = await getCountFromServer(eventsCollection);
  return snapshot.data().count;
};

export const getUpcomingEventsCount = async (): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDateString = format(today, 'yyyy-MM-dd');

  const q = query(eventsCollection, where("date", ">=", todayDateString));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};

export const getTotalUsersCount = async (): Promise<number> => {
  const snapshot = await getCountFromServer(usersCollection);
  return snapshot.data().count;
};


// User Dashboard Functions
export const getEventsByCreator = async (userId: string): Promise<Event[]> => {
  return getEvents({ creatorId: userId, orderByField: "createdAt", orderDirection: "desc" });
};

export const getRsvpsByUserId = async (userId: string): Promise<Rsvp[]> => {
  const rsvpsCg = collectionGroup(db, 'rsvps');
  const q = query(rsvpsCg, where('userId', '==', userId), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Rsvp);
};
