"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PacingExercise } from "@/components/PacingExercise";
import { TimedReadingExercise } from "@/components/TimedReadingExercise";
import { PersonalizedFeedback } from "@/components/PersonalizedFeedback";
import { Button } from "@/components/ui/button";
import { getRandomPassage, type Passage } from '@/lib/passages';
import { RefreshCw, Zap, Timer, Brain } from 'lucide-react';
import type { PersonalizedFeedbackInput } from '@/ai/flows/personalized-feedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils"; // Import cn

type Difficulty = 'easy' | 'medium' | 'hard' | 'random';

export default function Home() {
  const [currentPacingPassage, setCurrentPacingPassage] = useState<Passage | null>(null);
  const [currentTimedPassage, setCurrentTimedPassage] = useState<Passage | null>(null);
  const [lastPerformanceData, setLastPerformanceData] = useState<PersonalizedFeedbackInput | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('random');
  const [activeTab, setActiveTab] = useState<string>("timed");


  const loadNewPassage = (type: 'pacing' | 'timed', difficulty: Difficulty) => {
    const diffParam = difficulty === 'random' ? undefined : difficulty;
    const passage = getRandomPassage(diffParam);
    if (type === 'pacing') {
      setCurrentPacingPassage(passage);
       // Reset feedback when loading a new pacing passage if pacing tab is active
      if (activeTab === 'pacing') {
        setLastPerformanceData(null);
      }
    } else {
      setCurrentTimedPassage(passage);
      // Reset feedback when loading a new timed passage if timed tab is active
       if (activeTab === 'timed') {
         setLastPerformanceData(null);
       }
    }
  };

  // Load initial passages on mount
  useEffect(() => {
    loadNewPassage('pacing', selectedDifficulty);
    loadNewPassage('timed', selectedDifficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDifficulty]); // Reload when difficulty changes

  // Reset feedback when tab changes
   useEffect(() => {
     setLastPerformanceData(null);
   }, [activeTab]);


  const handlePacingComplete = (results: { wpm: number, comprehensionScore: number }) => {
    console.log("Pacing Exercise Completed:", results);
    // Pacing now has a quiz, so send the data to feedback
    setLastPerformanceData({
      readingSpeedWPM: results.wpm,
      comprehensionScore: results.comprehensionScore, // Now it has a score
      exerciseType: 'Pacing',
    });
    // setLastPerformanceData(null); // Remove this line
  };

  const handleTimedComplete = (results: { wpm: number, comprehensionScore: number }) => {
    console.log("Timed Reading Exercise Completed:", results);
    setLastPerformanceData({
      readingSpeedWPM: results.wpm,
      comprehensionScore: results.comprehensionScore,
      exerciseType: 'Timed Reading',
    });
  };

  const handleRefreshPassage = () => {
       if (activeTab === 'pacing' && currentPacingPassage) {
           loadNewPassage('pacing', selectedDifficulty);
       } else if (activeTab === 'timed' && currentTimedPassage) {
           loadNewPassage('timed', selectedDifficulty);
       }
   };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
           <Zap className="h-8 w-8" /> ReadSwift
        </h1>
        <p className="text-lg text-muted-foreground">Learn to Read Faster and Better</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
         <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <TabsList>
              <TabsTrigger value="timed" className="flex items-center gap-1">
                <Timer className="h-4 w-4"/> Timed Reading
              </TabsTrigger>
              <TabsTrigger value="pacing" className="flex items-center gap-1">
                 <Brain className="h-4 w-4"/> Pacing
              </TabsTrigger>
              {/* Add more TabsTrigger for other exercises here */}
            </TabsList>

            <div className="flex items-center gap-2">
                 <Select value={selectedDifficulty} onValueChange={(value: Difficulty) => setSelectedDifficulty(value)}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
                 <Button onClick={handleRefreshPassage} variant="outline" size="icon" aria-label="Load new passage">
                    <RefreshCw className="h-4 w-4" />
                 </Button>
             </div>
         </div>

        <TabsContent value="timed">
          {currentTimedPassage ? (
            <TimedReadingExercise
              key={`timed-${currentTimedPassage.id}-${selectedDifficulty}`} // Force re-render when passage or difficulty changes
              passage={currentTimedPassage}
              onComplete={handleTimedComplete}
            />
          ) : (
             <div className="flex justify-center items-center h-64">
               <RefreshCw className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-3 text-muted-foreground">Loading passage...</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="pacing">
          {currentPacingPassage ? (
            <PacingExercise
              key={`pacing-${currentPacingPassage.id}-${selectedDifficulty}`} // Force re-render when passage or difficulty changes
              passage={currentPacingPassage}
              onComplete={handlePacingComplete}
            />
          ) : (
             <div className="flex justify-center items-center h-64">
               <RefreshCw className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-3 text-muted-foreground">Loading passage...</p>
            </div>
          )}
        </TabsContent>
        {/* Add more TabsContent for other exercises here */}
      </Tabs>

      <div className="w-full max-w-4xl mx-auto mt-8">
         {lastPerformanceData && <PersonalizedFeedback performanceData={lastPerformanceData} />}
      </div>

       <footer className="text-center mt-12 text-sm text-muted-foreground">
            Built with Firebase & Genkit
       </footer>
    </div>
  );
}