'use server';

/**
 * @fileOverview AI agent for analyzing the tone and sentiment of journal entries.
 *
 * - analyzeJournalEntry - Analyzes the tone and sentiment of a journal entry.
 * - AnalyzeJournalEntryInput - Input type for the analyzeJournalEntry function.
 * - AnalyzeJournalEntryOutput - Output type for the analyzeJournalEntry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeJournalEntryInputSchema = z.string().describe('The journal entry to analyze.');
export type AnalyzeJournalEntryInput = z.infer<typeof AnalyzeJournalEntryInputSchema>;

const AnalyzeJournalEntryOutputSchema = z.object({
  overallSentiment: z
    .string()
    .describe('The overall sentiment of the journal entry (e.g., positive, negative, neutral).'),
  keyEmotionalSignals: z
    .string()
    .describe('A summary of the key emotional signals present in the journal entry.'),
});
export type AnalyzeJournalEntryOutput = z.infer<typeof AnalyzeJournalEntryOutputSchema>;

export async function analyzeJournalEntry(input: AnalyzeJournalEntryInput): Promise<AnalyzeJournalEntryOutput> {
  return analyzeJournalEntryFlow(input);
}

const analyzeJournalEntryPrompt = ai.definePrompt({
  name: 'analyzeJournalEntryPrompt',
  input: {schema: AnalyzeJournalEntryInputSchema},
  output: {schema: AnalyzeJournalEntryOutputSchema},
  prompt: `Analyze the following journal entry for its tone and sentiment. Provide an overall sentiment and summarize the key emotional signals present.\n\nJournal Entry: {{{$input}}}`,
});

const analyzeJournalEntryFlow = ai.defineFlow(
  {
    name: 'analyzeJournalEntryFlow',
    inputSchema: AnalyzeJournalEntryInputSchema,
    outputSchema: AnalyzeJournalEntryOutputSchema,
  },
  async input => {
    const {output} = await analyzeJournalEntryPrompt(input);
    return output!;
  }
);
