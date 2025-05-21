
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { checkInUserWithToken } from '@/lib/firebase/firestore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { QrCode, TicketCheck } from 'lucide-react';

interface EventCheckinProps {
  eventId: string;
}

export default function EventCheckin({ eventId }: EventCheckinProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast({
        title: 'Token Required',
        description: 'Please enter an RSVP token.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkInUserWithToken(eventId, tokenInput.trim());
      if (result.success) {
        toast({
          title: 'Check-in Successful',
          description: result.message,
        });
        setTokenInput(''); // Clear input on success
      } else {
        toast({
          title: 'Check-in Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during check-in.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <TicketCheck className="h-7 w-7 mr-3 text-primary" />
          Attendee Check-in
        </CardTitle>
        <CardDescription>
          Enter the attendee's RSVP token to mark them as checked-in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheckin} className="space-y-4">
          <div className="relative">
             <QrCode className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter RSVP Token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <TicketCheck className="mr-2 h-4 w-4" />}
            Check-in Attendee
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
