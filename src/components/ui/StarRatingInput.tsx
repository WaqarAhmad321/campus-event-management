
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  totalStars?: number;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export default function StarRatingInput({
  rating,
  onRatingChange,
  totalStars = 5,
  size = 24,
  className,
  disabled = false,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rate: number) => {
    if (disabled) return;
    onRatingChange(rate);
  };

  const handleMouseEnter = (rate: number) => {
    if (disabled) return;
    setHoverRating(rate);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(0);
  };

  return (
    <div className={cn("flex items-center gap-1", className, { "cursor-not-allowed": disabled })}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button"
            key={index}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className={cn("p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", { "cursor-pointer": !disabled })}
            aria-label={`Rate ${starValue} out of ${totalStars} stars`}
            disabled={disabled}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                starValue <= (hoverRating || rating) ? "text-primary" : "text-muted-foreground/30",
                { "text-primary": starValue <= rating && !hoverRating }
              )}
              fill={starValue <= (hoverRating || rating) ? "hsl(var(--primary))" : "transparent"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
