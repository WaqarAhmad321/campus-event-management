
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus } from "lucide-react";
import { getGoogleCalendarUrl, getOutlookCalendarUrl } from "@/lib/calendarUtils";
import type { ClientEvent } from "@/lib/types";

interface AddToCalendarButtonProps {
  event: ClientEvent;
}

const GoogleCalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 5v2H5V8h14zM5 19V10h14v9H5z"/>
    <path d="M12.5 11.5h-1v1h1v-1zm2 0h-1v1h1v-1zm-2 2h-1v1h1v-1zm2 0h-1v1h1v-1zm-2 2h-1v1h1v-1zm2 0h-1v1h1v-1z" opacity=".3"/>
    <path d="M12 11h5v5h-5z" fill="#34A853"/> {/* Example: A colored block within, adjust as needed */}
     <rect x="7" y="14" width="3" height="3" fill="#4285F4"/>
     <rect x="14" y="14" width="3" height="3" fill="#FBBC05"/>
  </svg>
);

const OutlookCalendarIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor" color="#0078D4">
    <path d="M21.42,6.08H18.33V4.43a.75.75,0,0,0-1.5,0v1.65H7.17V4.43a.75.75,0,0,0-1.5,0v1.65H2.58A.76.76,0,0,0,2,6.57v1.1H22v-1.1A.76.76,0,0,0,21.42,6.08Z"/>
    <path d="M2.57,20.75H21.42a.75.75,0,0,0,.75-.75V8.33H1.83v11.67A.75.75,0,0,0,2.57,20.75ZM5.83,11.25h3v1.5h-3Zm0,3.75h3v1.5h-3Zm0,3.75h3v1.5h-3Zm4.5-7.5h3v1.5h-3Zm0,3.75h3v1.5h-3Zm0,3.75h3v1.5h-3Zm4.5-7.5h3v1.5h-3Zm0,3.75h3v1.5h-3Z"/>
 </svg>
);


export default function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  if (!event) return null;

  const googleUrl = getGoogleCalendarUrl(event);
  const outlookUrl = getOutlookCalendarUrl(event);

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="w-full sm:w-auto">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleOpenUrl(googleUrl)} className="cursor-pointer">
          <GoogleCalendarIcon />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenUrl(outlookUrl)} className="cursor-pointer">
          <OutlookCalendarIcon />
          Outlook Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

