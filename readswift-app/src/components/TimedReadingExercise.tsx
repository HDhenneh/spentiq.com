"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Play, Pause, CheckCircle, XCircle, Eye, Brain } from 'lucide-react';
import type { Passage, QuizQuestion } from '@/lib/passages';
import { cn } from "@/lib/utils";

interface TimedReadingExerciseProps {
  passage: Passage;
  onComplete: (results: { wpm: number, comprehensionScore: number }) => void;
}

type QuizAnswer = {
    questionIndex: number;
    selectedAnswer: string;
}

export function TimedReadingExercise({ passage, onComplete }: TimedReadingExerciseProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isReading, setIsReading] = useState(false);
  const [finishedReading, setFinishedReading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startReading = useCallback(() => {
    setStartTime(Date.now() - elapsedTime * 1000); // Adjust for pauses
    setIsReading(true);
    setFinishedReading(false);
    setShowQuiz(false);
    setQuizAnswers([]);
    setQuizScore(null);
    setWpm(null);
    intervalRef.current = setInterval(() => {
        if(startTime) {
           setElapsedTime((Date.now() - startTime) / 1000);
        } else {
            // Fallback in case startTime is somehow null during interval
             setElapsedTime((prev) => prev + 0.1);
        }
    }, 100); // Update timer every 100ms
  }, [elapsedTime, startTime]);

  const pauseReading = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsReading(false);
    if (startTime) {
       setElapsedTime((Date.now() - startTime) / 1000);
    }
  }, [startTime]);

  const finishReading = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsReading(false);
    setFinishedReading(true);
    const finalElapsedTime = startTime ? (Date.now() - startTime) / 1000 : elapsedTime;
    setElapsedTime(finalElapsedTime);

    if (finalElapsedTime > 0) {
      const calculatedWpm = Math.round((passage.wordCount / finalElapsedTime) * 60);
      setWpm(calculatedWpm);
    } else {
      setWpm(0); // Avoid division by zero
    }
    setShowQuiz(true); // Automatically show quiz after finishing reading
  }, [startTime, elapsedTime, passage.wordCount]);

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
      if (wpm !== null) {
        onComplete({ wpm: wpm, comprehensionScore: score });
      }
   }, [passage.quiz, quizAnswers, wpm, onComplete]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const quizProgress = (quizAnswers.length / passage.quiz.length) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{passage.title} - Timed Reading</CardTitle>
        <div className="text-sm text-muted-foreground">Difficulty: {passage.difficulty} | Word Count: {passage.wordCount}</div>
        {!showQuiz && !finishedReading && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-mono font-semibold">{formatTime(elapsedTime)}</span>
             <div className="flex gap-2">
                 {!isReading && elapsedTime === 0 && (
                    <Button onClick={startReading} size="sm">
                        <Play className="mr-2 h-4 w-4" /> Start Reading
                    </Button>
                 )}
                  {isReading && (
                     <Button onClick={pauseReading} variant="outline" size="sm">
                         <Pause className="mr-2 h-4 w-4" /> Pause
                     </Button>
                  )}
                  {!isReading && elapsedTime > 0 && (
                     <Button onClick={startReading} size="sm">
                         <Play className="mr-2 h-4 w-4" /> Resume
                     </Button>
                  )}
                   {(isReading || elapsedTime > 0) && (
                      <Button onClick={finishReading} variant="secondary" size="sm">
                          Finish Reading & Start Quiz
                      </Button>
                   )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!showQuiz && (
          <div className={cn("p-4 border rounded-md bg-secondary/30 text-lg leading-relaxed max-h-[60vh] overflow-y-auto", { 'blur-sm pointer-events-none': !isReading && elapsedTime > 0 && !finishedReading })}>
            {passage.content}
             {!isReading && elapsedTime > 0 && !finishedReading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                    <p className="text-xl font-semibold text-foreground p-4 bg-background/80 rounded-lg shadow-md">Paused</p>
                 </div>
             )}
          </div>
        )}

        {showQuiz && (
            <div className="space-y-6">
                 <h3 className="text-lg font-semibold mb-4 text-center">Comprehension Quiz</h3>
                {passage.quiz.map((q, index) => (
                <Card key={index} className={cn("p-4", quizScore !== null && (quizAnswers.find(a => a.questionIndex === index)?.selectedAnswer === q.correctAnswer ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'))}>
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
         {finishedReading && wpm !== null && quizScore !== null && (
              <Alert variant="default" className="mt-6 bg-accent/10 border-accent/50">
                 <CheckCircle className="h-5 w-5 text-accent" />
                 <AlertTitle className="text-accent font-semibold">Exercise Complete!</AlertTitle>
                 <AlertDescription className="flex flex-col sm:flex-row justify-around items-center mt-2 space-y-2 sm:space-y-0">
                    <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        <span className="font-medium">Reading Speed:</span>
                        <span className="text-lg font-bold text-primary">{wpm} WPM</span>
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
      {finishedReading && !showQuiz && wpm !== null && (
        <CardFooter className="justify-center">
          <p className="text-muted-foreground">Reading finished. Your speed: <span className="font-bold text-primary">{wpm} WPM</span>. Starting quiz...</p>
        </CardFooter>
      )}
    </Card>
  );
}
