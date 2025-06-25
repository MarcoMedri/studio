'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { analyzeJournalEntry } from '@/ai/flows/analyze-journal-entry';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Analysis = {
  overallSentiment: string;
  keyEmotionalSignals: string;
};

export function AnalyzeButton({ content }: { content: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!content.trim()) {
       toast({
        variant: 'destructive',
        title: 'Cannot Analyze',
        description: 'Please write something before analyzing the tone.',
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeJournalEntry(content);
      setAnalysis(result);
    } catch (e) {
      setError('Failed to analyze entry. Please try again.');
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'An error occurred while analyzing the entry.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover onOpenChange={() => {
        setError(null);
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" onClick={handleAnalysis} disabled={isLoading}>
          <Wand2 className="mr-2 h-4 w-4" />
          <span>Analyze Tone</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>Tone Analysis</CardTitle>
            <CardDescription>AI-powered insights into your writing.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {analysis && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Overall Sentiment</h4>
                  <p className="text-sm text-muted-foreground">{analysis.overallSentiment}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Key Emotional Signals</h4>
                  <p className="text-sm text-muted-foreground">{analysis.keyEmotionalSignals}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
