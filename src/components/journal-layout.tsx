'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Code, BookOpen, Split, Download, Upload, Menu, Wand2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import * as store from '@/lib/journal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import MarkdownPreview from '@/components/markdown-preview';
import { AnalyzeButton } from '@/components/analyze-button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';


type ViewMode = 'split' | 'editor' | 'preview';

export function JournalLayout() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [noteContent, setNoteContent] = useState('');
  const [datesWithNotes, setDatesWithNotes] = useState<Date[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const debouncedContent = useDebounce(noteContent, 500);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const content = store.getNote(selectedDate);
    setNoteContent(content);
  }, [selectedDate]);

  useEffect(() => {
    store.saveNote(selectedDate, debouncedContent);
    setDatesWithNotes(store.getDatesWithNotes());
  }, [debouncedContent, selectedDate]);

  useEffect(() => {
    if (isMobile) setViewMode('editor');
    else setViewMode('split');
  }, [isMobile]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleExport = () => {
    const content = store.getNote(selectedDate);
    const dateString = format(selectedDate, 'dd-MM-yyyy');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dateString}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Note Exported', description: `Entry for ${dateString} saved.` });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
          const newDate = store.importNote(file.name, content);
          if (newDate) {
            setSelectedDate(newDate);
            setDatesWithNotes(store.getDatesWithNotes());
            toast({
              title: 'Import Successful',
              description: `Imported note for ${format(newDate, 'PPP')}.`,
            });
          } else {
            throw new Error('Invalid filename format.');
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'Please use dd-mm-yyyy.md format.',
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if(e.target) e.target.value = '';
  };
  
  const calendarModifiers = useMemo(() => ({
      ...datesWithNotes.length > 0 && { hasNote: datesWithNotes },
  }), [datesWithNotes]);

  const calendar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold font-headline text-primary">Mark Journal</h1>
      </div>
      <div className="p-4 flex-grow">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md"
          modifiers={calendarModifiers}
          modifiersStyles={{
            hasNote: {
              position: 'relative',
              overflow: 'visible',
            },
          }}
          components={{
            DayContent: (props) => {
              const { date } = props;
              const isModified = calendarModifiers.hasNote && calendarModifiers.hasNote.some(
                d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
              );
              return (
                <div className="relative">
                  {props.children}
                  {isModified && (
                    <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-accent"></div>
                  )}
                </div>
              );
            },
          }}
        />
      </div>
      <div className="p-4 border-t space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" /> Import Note
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".md,.markdown" />
        <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export Note
        </Button>
      </div>
      <div className="p-4 mt-auto border-t">
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {!isMobile && (
        <aside className="w-80 border-r flex-shrink-0">
          {calendar}
        </aside>
      )}

      <div className="flex flex-col flex-grow">
        <header className="flex items-center justify-between p-2 border-b h-16 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  {calendar}
                </SheetContent>
              </Sheet>
            )}
            <Button variant="ghost" size="sm" className="hidden md:flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="text-lg">{format(selectedDate, 'PPP')}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-md">
              <Button variant={viewMode === 'editor' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('editor')} title="Editor">
                <Code className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'split' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('split')} title="Split View">
                <Split className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'preview' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('preview')} title="Preview">
                <BookOpen className="h-4 w-4" />
              </Button>
            </div>
            <AnalyzeButton content={noteContent} />
          </div>
        </header>
        <main className="flex-grow grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          <div className={cn('h-full overflow-y-auto', viewMode === 'preview' ? 'hidden md:hidden' : 'md:block', viewMode === 'editor' ? 'md:col-span-2' : '')}>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Start writing your journal entry here..."
              className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-8 text-base font-code bg-transparent"
            />
          </div>
          <div className={cn('h-full overflow-y-auto border-l', viewMode === 'editor' ? 'hidden md:hidden' : 'md:block', viewMode === 'preview' ? 'md:col-span-2' : '')}>
            <MarkdownPreview content={noteContent} />
          </div>
        </main>
      </div>
    </div>
  );
}
