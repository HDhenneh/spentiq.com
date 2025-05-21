'use server';
/**
 * @fileOverview Personalized feedback and recommendations based on user performance.
 *
 * - getPersonalizedFeedback - A function that provides personalized feedback based on user performance.
 * - PersonalizedFeedbackInput - The input type for the getPersonalizedFeedback function.
 * - PersonalizedFeedbackOutput - The return type for the getPersonalizedFeedback function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const PersonalizedFeedbackInputSchema = z.object({
  readingSpeedWPM: z.number().describe('The user reading speed in words per minute (for Timed Reading) or the target speed (for Pacing).'),
  comprehensionScore: z.number().describe('The user comprehension score (0-100) from the quiz.'),
  exerciseType: z.string().describe('The type of exercise the user completed (e.g., Pacing, Timed Reading).'),
});
export type PersonalizedFeedbackInput = z.infer<typeof PersonalizedFeedbackInputSchema>;

const PersonalizedFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Personalized feedback and recommendations for the user.'),
});
export type PersonalizedFeedbackOutput = z.infer<typeof PersonalizedFeedbackOutputSchema>;

export async function getPersonalizedFeedback(input: PersonalizedFeedbackInput): Promise<PersonalizedFeedbackOutput> {
  return personalizedFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFeedbackPrompt',
  input: {
    schema: z.object({
        readingSpeedWPM: z.number().describe('The user reading speed in words per minute (for Timed Reading) or the target speed (for Pacing).'),
        comprehensionScore: z.number().describe('The user comprehension score (0-100) from the quiz.'),
        exerciseType: z.string().describe('The type of exercise the user completed (e.g., Pacing, Timed Reading).'),
    }),
  },
  output: {
    schema: z.object({
      feedback: z.string().describe('Personalized feedback and recommendations for the user.'),
    }),
  },
  prompt: `You are an AI reading coach providing personalized feedback to a user based on their performance in a speed reading exercise.

Consider the user's performance data to provide tailored recommendations.

Exercise Type: {{{exerciseType}}}
Speed/Target Speed (WPM): {{{readingSpeedWPM}}}
Comprehension Score: {{{comprehensionScore}}}

Provide feedback that:
*   Identifies areas of potential improvement (speed/pacing and comprehension).
*   Suggests specific exercises or lessons to improve.
*   Is encouraging and motivating.
*   If the exercise type is 'Pacing', comment on whether the user likely maintained the target speed based on their comprehension. High comprehension suggests they kept up; low comprehension suggests the pace might have been too fast.
*   If the exercise type is 'Timed Reading', comment on the balance between speed and comprehension.
`,
});

const personalizedFeedbackFlow = ai.defineFlow<
  typeof PersonalizedFeedbackInputSchema,
  typeof PersonalizedFeedbackOutputSchema
>({
  name: 'personalizedFeedbackFlow',
  inputSchema: PersonalizedFeedbackInputSchema,
  outputSchema: PersonalizedFeedbackOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
