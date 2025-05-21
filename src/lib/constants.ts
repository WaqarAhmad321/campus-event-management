
export const EVENT_CATEGORIES = [
  "Tech",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Social",
  "Music",
  "Art",
  "Food",
  "Networking",
  "Charity",
  "Other",
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

export const EVENT_TAGS = [
  "Beginner-Friendly",
  "Advanced",
  "Free Food",
  "Guest Speaker",
  "Competition",
  "Outdoor",
  "Indoor",
  "Fundraiser",
  "Alumni",
  "Family-Friendly",
] as const;

export type EventTag = typeof EVENT_TAGS[number];
