
"use client";

import { useState, useEffect, type FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Event, EventFormData, Speaker } from "@/lib/types";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/constants";
import { addEvent, updateEvent } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "../ui/LoadingSpinner";
import { UploadCloud, XCircle } from "lucide-react";

const initialFormData: Omit<EventFormData, 'posterFile'> = { // Omit posterFile for initial state not holding File
  title: "",
  description: "",
  category: EVENT_CATEGORIES[0],
  date: "",
  time: "",
  location: "",
  posterUrl: "",
  tags: "",
  speakers_json_str: "",
  past_event_image_urls_str: "",
};

export default function EventForm({ mode, event }: EventFormProps) {
  const [formData, setFormData] = useState<Omit<EventFormData, 'posterFile'>>(initialFormData);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "edit" && event) {
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category as EventCategory,
        date: event.date,
        time: event.time,
        location: event.location,
        posterUrl: event.posterUrl || "",
        tags: event.tags?.join(', ') || "",
        speakers_json_str: event.speakers ? JSON.stringify(event.speakers, null, 2) : "",
        past_event_image_urls_str: event.pastEventImageUrls?.join(', ') || "",
      });
      if (event.posterUrl) {
        setImagePreviewUrl(event.posterUrl);
      }
      setPosterFile(null); // Reset file on edit load
    } else {
      // Reset for create mode or if event is not provided for edit
      setFormData(initialFormData);
      setImagePreviewUrl(null);
      setPosterFile(null);
    }
  }, [mode, event]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      // When a new file is selected, we prioritize it, so clear posterUrl from formData
      // This signals backend to use posterFile. If user then *removes* selection, posterUrl remains empty.
      setFormData(prev => ({ ...prev, posterUrl: "" }));
    }
  };

  const handleRemoveImage = () => {
    setPosterFile(null);
    setImagePreviewUrl(null);
    setFormData(prev => ({ ...prev, posterUrl: "" })); // Signal removal of poster
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value as EventCategory }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!currentUser) {
      setError("You must be logged in to perform this action.");
      setIsLoading(false);
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive"});
      return;
    }

    if (!formData.title || !formData.date || !formData.time || !formData.location || !formData.category) {
        setError("Please fill in all required fields: Title, Date, Time, Location, Category.");
        setIsLoading(false);
        toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive"});
        return;
    }

    if (formData.speakers_json_str) {
      try {
        const parsedSpeakers = JSON.parse(formData.speakers_json_str);
        if (!Array.isArray(parsedSpeakers)) throw new Error("Speakers data must be a JSON array.");
      } catch (jsonError) {
        setError("Invalid JSON format for speakers. Example: [{\"name\": \"John Doe\", \"title\": \"Speaker\"}]");
        setIsLoading(false);
        toast({ title: "Invalid Speakers Data", description: (jsonError as Error).message, variant: "destructive" });
        return;
      }
    }

    // Construct the data to submit, including the posterFile
    const dataToSubmit: EventFormData = {
      ...formData,
      posterFile: posterFile,
      // posterUrl in formData is already managed to be "" if new file or removed, or manual URL if no file
    };

    try {
      if (mode === "create") {
        const eventId = await addEvent(dataToSubmit);
        toast({ title: "Event Created!", description: "Your event has been successfully added." });
        router.push(`/events/${eventId}`);
      } else if (mode === "edit" && event) {
        if (event.creatorId !== currentUser.uid && currentUser.role !== 'admin') {
          setError("You are not authorized to edit this event.");
          setIsLoading(false);
          toast({ title: "Authorization Error", description: "You cannot edit this event.", variant: "destructive"});
          return;
        }
        await updateEvent(event.id, dataToSubmit);
        toast({ title: "Event Updated!", description: "Your event has been successfully updated." });
        router.push(`/events/${event.id}`);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({ title: mode === "create" ? "Creation Failed" : "Update Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Annual Tech Fest" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Describe your event..."/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" value={formData.category} onValueChange={handleSelectChange} required>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., Main Auditorium"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="poster">Event Poster</Label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {imagePreviewUrl ? (
              <div className="relative group w-full max-w-md mx-auto">
                <Image src={imagePreviewUrl} alt="Poster preview" width={400} height={225} className="mx-auto rounded-md object-contain max-h-60" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 opacity-70 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            )}
            <div className="flex text-sm text-muted-foreground justify-center">
              <label
                htmlFor="posterFile"
                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
              >
                <span>{imagePreviewUrl ? "Change image" : "Upload a file"}</span>
                <input id="posterFile" name="posterFile" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
              </label>
              {!imagePreviewUrl && <p className="pl-1">or drag and drop</p>}
            </div>
            {!imagePreviewUrl && <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>}
            { mode === "edit" && !posterFile && formData.posterUrl && !imagePreviewUrl && (
              <p className="text-xs text-muted-foreground mt-1">Current poster URL: {formData.posterUrl}</p>
            )}
             { mode === "edit" && !posterFile && !formData.posterUrl && !imagePreviewUrl && (
              <p className="text-xs text-muted-foreground mt-1">No poster image set. Upload one or provide a URL below.</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
            Optionally, provide a direct URL if not uploading:
        </p>
        <Input 
            id="posterUrl" 
            name="posterUrl" 
            type="url" 
            value={formData.posterUrl || ""} 
            onChange={handleChange} 
            placeholder="https://example.com/poster.jpg"
            disabled={!!posterFile} // Disable if a file is selected for upload
        />
         {posterFile && <p className="text-xs text-green-600">Local file selected. URL input will be ignored.</p>}

      </div>


      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" value={formData.tags || ""} onChange={handleChange} placeholder="e.g., tech, fun, music"/>
        <p className="text-xs text-muted-foreground">Enter relevant tags separated by commas.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="speakers_json_str">Speakers (JSON format)</Label>
        <Textarea
          id="speakers_json_str"
          name="speakers_json_str"
          value={formData.speakers_json_str || ""}
          onChange={handleChange}
          rows={5}
          placeholder='[{"name": "Dr. Jane Doe", "title": "Keynote Speaker", "imageUrl": "url.jpg", "bio": "Short bio..."}, {"name": "Mr. John Smith", "title": "Panelist"}]'
        />
        <p className="text-xs text-muted-foreground">
          Enter speaker details as a JSON array. Each object should have "name" and "title", "imageUrl" (optional), and "bio" (optional).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="past_event_image_urls_str">Past Event Image URLs (comma-separated)</Label>
        <Textarea
          id="past_event_image_urls_str"
          name="past_event_image_urls_str"
          value={formData.past_event_image_urls_str || ""}
          onChange={handleChange}
          rows={3}
          placeholder="https://example.com/image1.jpg, https://example.com/image2.png"
        />
        <p className="text-xs text-muted-foreground">Provide URLs for images from past instances of this event, separated by commas.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="sm" className="mr-2"/> : null}
        {mode === "create" ? "Create Event" : "Save Changes"}
      </Button>
    </form>
  );
}

interface EventFormProps {
  mode: "create" | "edit";
  event?: Event;
}
