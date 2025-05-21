
"use client";

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingDisplayProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  showCount?: boolean;
  count?: number;
}

export default function StarRatingDisplay({
  rating,
  totalStars = 5,
  size = 20,
  className,
  showCount = false,
  count = 0,
}: StarRatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        if (starValue <= fullStars) {
          return <Star key={index} fill="hsl(var(--primary))" strokeWidth={0} size={size} className="text-primary" />;
        }
        if (hasHalfStar && starValue === fullStars + 1) {
          return <StarHalf key={index} fill="hsl(var(--primary))" strokeWidth={0} size={size} className="text-primary" />;
        }
        return <Star key={index} size={size} className="text-muted-foreground/50" strokeWidth={1.5}/>;
      })}
      {showCount && <span className="ml-1 text-sm text-muted-foreground">({count})</span>}
    </div>
  );
}
