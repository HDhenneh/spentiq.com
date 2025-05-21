"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Update import to expect non-nullable comprehensionScore
import { getPersonalizedFeedback, type PersonalizedFeedbackInput } from '@/ai/flows/personalized-feedback';

interface PersonalizedFeedbackProps {
  performanceData: PersonalizedFeedbackInput | null;
}

export function PersonalizedFeedback({ performanceData }: PersonalizedFeedbackProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async (data: PersonalizedFeedbackInput) => {
    if (!data) return;
    setIsLoading(true);
    setError(null);
    setFeedback(null); // Clear previous feedback
    try {
      // Data now always includes a non-null comprehensionScore
      const result = await getPersonalizedFeedback(data);
      setFeedback(result.feedback);
    } catch (err) {
      console.error("Error fetching personalized feedback:", err);
      setError("Could not generate feedback at this time. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (performanceData) {
      fetchFeedback(performanceData);
    } else {
      // Clear feedback if performanceData becomes null (e.g., switching tabs or resetting)
       setFeedback(null);
       setError(null);
       setIsLoading(false);
    }
  }, [performanceData]); // Refetch when performance data changes or becomes null

  const handleRetry = () => {
    if (performanceData) {
        fetchFeedback(performanceData);
    }
  }

  return (
    <Card className="w-full shadow-md mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
           <Lightbulb className="h-5 w-5" /> Personalized Feedback & Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Generating feedback...</p>
          </div>
        )}
        {error && !isLoading && (
          <Alert variant="destructive" className="mb-4">
             <AlertTitle>Error</AlertTitle>
             <AlertDescription className="flex items-center justify-between">
               {error}
               <Button onClick={handleRetry} variant="outline" size="sm">
                 <RefreshCw className="mr-2 h-4 w-4" /> Retry
               </Button>
             </AlertDescription>
           </Alert>
        )}
        {!isLoading && !error && feedback && (
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{feedback}</p>
        )}
        {!isLoading && !error && !feedback && !performanceData && (
            <p className="text-muted-foreground text-center p-4">Complete an exercise to receive personalized feedback.</p>
        )}
         {!isLoading && !error && !feedback && performanceData && (
              <p className="text-muted-foreground text-center p-4">Waiting for feedback generation...</p>
          )}
      </CardContent>
    </Card>
  );
}
