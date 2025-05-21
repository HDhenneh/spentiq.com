// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
// Import XCircle
import { Play, Pause, RotateCcw, CheckCircle, Eye, Brain, XCircle } from 'lucide-react';
import type { Passage, QuizQuestion } from '@/lib/passages';
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PacingExerciseProps {
  passage: Passage;
  onComplete: (results: { wpm: number, comprehensionScore: number }) => void;
}

type QuizAnswer = {
    questionIndex: number;
    selectedAnswer: string;
}

export function PacingExercise({ passage, onComplete }: PacingExerciseProps) {
  const [speed, setSpeed] = useState(250); // Default WPM
  const [isRunning, setIsRunning] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [finishedPacing, setFinishedPacing] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const words = useRef<string[]>(passage.content.split(/\s+/));


  const finishPacing = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setFinishedPacing(true);
    setShowQuiz(true); // Show quiz immediately after pacing finishes
    setQuizAnswers([]); // Reset answers for new quiz
    setQuizScore(null); // Reset score
  }, []);

  const startPacing = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(true);
    setFinishedPacing(false);
    setShowQuiz(false);
    setQuizScore(null);
    setQuizAnswers([]);
     // Reset currentWordIndex if starting over after finishing
     if (currentWordIndex >= words.current.length - 1) {
        setCurrentWordIndex(0);
     }


    const highlightDelay = (60 / speed) * 1000; // milliseconds per word
    intervalRef.current = setInterval(() => {
      setCurrentWordIndex((prevIndex) => {
        if (prevIndex < words.current.length - 1) {
          return prevIndex + 1;
        } else {
          // Pacing finished
          finishPacing();
          return prevIndex; // Keep index at the end
        }
      });
    }, highlightDelay);
  }, [speed, finishPacing, currentWordIndex]);


  const pausePacing = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  }, []);

  const resetPacing = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setFinishedPacing(false);
    setShowQuiz(false);
    setCurrentWordIndex(0);
    setQuizAnswers([]);
    setQuizScore(null);
    // Reset words ref in case passage changed
    words.current = passage.content.split(/\s+/);
  }, [passage.content]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

   // Adjust interval speed when the speed slider changes
   useEffect(() => {
     if (isRunning) {
       pausePacing();
       startPacing();
     }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [speed]);

   // Effect to reset words and state when passage changes
   useEffect(() => {
      words.current = passage.content.split(/\s+/);
      resetPacing();
   }, [passage, resetPacing]);

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value[0]);
  };

  const handleQuizAnswer = (questionIndex: number, selectedAnswer: string) => {
    setQuizAnswers(prevAnswers => {
        const existingAnswerIndex = prevAnswers.findIndex(a => a.questionIndex === questionIndex);
        if (existingAnswerIndex > -1) {
            const updatedAnswers = [...prevAnswers];
            updatedAnswers[existingAnswerIndex] = { questionIndex, selectedAnswer };
            return updatedAnswers;
        } else {
            return [...prevAnswers, { questionIndex, selectedAnswer }];
        }
    });
 };

 const submitQuiz = useCallback(() => {
    let correctCount = 0;
    passage.quiz.forEach((question, index) => {
        const userAnswer = quizAnswers.find(a => a.questionIndex === index);
        if (userAnswer && userAnswer.selectedAnswer === question.correctAnswer) {
            correctCount++;
        }
    });
    const score = Math.round((correctCount / passage.quiz.length) * 100);
    setQuizScore(score);
    onComplete({ wpm: speed, comprehensionScore: score }); // Pass the calculated score

 }, [passage.quiz, quizAnswers, onComplete, speed]);

 const quizProgress = (quizAnswers.length / passage.quiz.length) * 100;


  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{passage.title} - Pacing Exercise</CardTitle>
         <div className="text-sm text-muted-foreground">Difficulty: {passage.difficulty} | Target WPM: {speed}</div>
      </CardHeader>
      <CardContent>
        {!showQuiz && (
            <>
             <div className="mb-6 p-4 border rounded-md bg-secondary/30 text-lg leading-relaxed" style={{ minHeight: '200px' }}>
                {words.current.map((word, index) => (
                <span
                    key={index}
                    className={cn(
                    "transition-colors duration-100 ease-linear",
                    isRunning && index === currentWordIndex ? 'bg-primary/30 text-primary-foreground p-1 rounded' : 'text-foreground' // Only highlight if running
                    )}
                >
                    {word}{' '}
                </span>
                ))}
                 {!isRunning && currentWordIndex > 0 && !finishedPacing && (
                     <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                         <p className="text-xl font-semibold text-foreground p-4 bg-background/80 rounded-lg shadow-md">Paused</p>
                     </div>
                 )}
             </div>
              <div className="flex items-center gap-4 mb-4">
                <Label htmlFor="speed-slider" className="whitespace-nowrap">Speed (WPM): {speed}</Label>
                <Slider
                  id="speed-slider"
                  min={100}
                  max={1000}
                  step={10}
                  value={[speed]}
                  onValueChange={handleSpeedChange}
                  disabled={isRunning || finishedPacing || showQuiz}
                  className="w-full"
                />
              </div>
            </>
        )}

        {showQuiz && (
            <div className="space-y-6">
                 <h3 className="text-lg font-semibold mb-4 text-center">Comprehension Quiz</h3>
                {passage.quiz.map((q, index) => (
                <Card key={index} className={cn("p-4", quizScore !== null && (quizAnswers.find(a => a.questionIndex === index)?.selectedAnswer === q.correctAnswer ? 'border-green-500 bg-green-50/80' : 'border-red-500 bg-red-50/80'))}>
                    <p className="font-medium mb-3">{index + 1}. {q.question}</p>
                    <RadioGroup
                    onValueChange={(value) => handleQuizAnswer(index, value)}
                    value={quizAnswers.find(a => a.questionIndex === index)?.selectedAnswer}
                    disabled={quizScore !== null}
                    >
                    {q.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`q${index}-opt${optionIndex}`} />
                        <Label htmlFor={`q${index}-opt${optionIndex}`} className={cn(quizScore !== null && option === q.correctAnswer ? 'text-green-700 font-semibold' : '')}>{option}</Label>
                         {quizScore !== null && quizAnswers.find(a => a.questionIndex === index)?.selectedAnswer === option && option !== q.correctAnswer && (
                              <XCircle className="h-4 w-4 text-red-600 ml-2" />
                          )}
                           {quizScore !== null && option === q.correctAnswer && (
                               <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                           )}
                        </div>
                    ))}
                    </RadioGroup>
                </Card>
                ))}
                 {quizScore === null && (
                     <>
                        <Progress value={quizProgress} className="w-full" />
                        <Button onClick={submitQuiz} disabled={quizAnswers.length !== passage.quiz.length} className="w-full">
                            Submit Quiz
                        </Button>
                     </>
                 )}
            </div>
        )}

         {finishedPacing && quizScore !== null && (
              <Alert variant="default" className="mt-6 bg-accent/10 border-accent/50">
                 <CheckCircle className="h-5 w-5 text-accent" />
                 <AlertTitle className="text-accent font-semibold">Exercise Complete!</AlertTitle>
                 <AlertDescription className="flex flex-col sm:flex-row justify-around items-center mt-2 space-y-2 sm:space-y-0">
                    <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        <span className="font-medium">Target Speed:</span>
                        <span className="text-lg font-bold text-primary">{speed} WPM</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <Brain className="h-5 w-5 text-accent" />
                         <span className="font-medium">Comprehension:</span>
                         <span className={cn("text-lg font-bold", quizScore >= 70 ? 'text-accent' : 'text-destructive')}>{quizScore}%</span>
                    </div>
                 </AlertDescription>
              </Alert>
          )}

      </CardContent>
      <CardFooter className="flex justify-center gap-4">
         {!showQuiz && !finishedPacing && (
            <>
             <Button onClick={isRunning ? pausePacing : startPacing} variant="outline" size="icon" disabled={currentWordIndex >= words.current.length -1}>
                {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                 <span className="sr-only">{isRunning ? 'Pause' : 'Start'}</span>
             </Button>
             <Button onClick={resetPacing} variant="outline" size="icon">
                <RotateCcw className="h-5 w-5" />
                <span className="sr-only">Reset</span>
             </Button>
            </>
         )}
          {(showQuiz || finishedPacing) && (
              <Button onClick={resetPacing} variant="outline">
                 <RotateCcw className="mr-2 h-5 w-5" /> Try Again
              </Button>
          )}
      </CardFooter>
    </Card>
  );
}
