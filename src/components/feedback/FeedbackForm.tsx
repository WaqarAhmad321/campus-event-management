
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRatingInput from "@/components/ui/StarRatingInput";
import { useToast } from "@/hooks/use-toast";
import { addFeedback } from "@/lib/firebase/firestore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FeedbackFormProps {
  eventId: string;
  onFeedbackSubmitted?: () => void; // Optional callback
  disabled?: boolean; // To disable form if already submitted
}

export default function FeedbackForm({ eventId, onFeedbackSubmitted, disabled = false }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await addFeedback(eventId, { rating, comment });
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback.",
      });
      setRating(0);
      setComment("");
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit feedback.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (disabled) {
    return (
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
            <CardTitle className="text-xl">Feedback Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You have already submitted feedback for this event. Thank you!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Leave Feedback</CardTitle>
        <CardDescription>Share your experience about this event.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-lg font-medium">Your Rating</Label>
            <StarRatingInput rating={rating} onRatingChange={setRating} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-lg font-medium">Comments (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              disabled={isLoading}
              className="bg-background"
            />
          </div>
          <Button type="submit" disabled={isLoading || rating === 0} className="w-full sm:w-auto">
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
