'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Code, BookOpen, Split, Download, Upload, Menu } from 'lucide-react';
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
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { MarkdownToolbar } from './markdown-toolbar';


type ViewMode = 'split' | 'editor' | 'preview';

const checklistItems = [
    {id: 'alimentazione', label: 'Alimentazione'},
    {id: 'sonno', label: 'Sonno'},
    {id: 'esercizio', label: 'Esercizio fisico'},
    {id: 'studio', label: 'Studio'},
    {id: 'lettura', label: 'Lettura'},
];

export function JournalLayout() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState<store.JournalEntry>({ content: '', checklist: [] });
  const [datesWithNotes, setDatesWithNotes] = useState<Date[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const debouncedEntry = useDebounce(entry, 500);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadedEntry = store.getNote(selectedDate);
    setEntry(loadedEntry);
  }, [selectedDate]);

  useEffect(() => {
    store.saveNote(selectedDate, debouncedEntry);
    setDatesWithNotes(store.getDatesWithNotes());
  }, [debouncedEntry, selectedDate]);

  useEffect(() => {
    if (isMobile) setViewMode('editor');
    else setViewMode('split');
  }, [isMobile]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleContentChange = (content: string) => {
    setEntry(prev => ({...prev, content}));
  }
  
  const handleMoodChange = (mood: string) => {
    setEntry(prev => ({...prev, mood: prev.mood === mood ? undefined : mood }));
  }
  
  const handleChecklistChange = (item: string, checked: boolean) => {
    setEntry(prev => {
        const newChecklist = prev.checklist ? [...prev.checklist] : [];
        if (checked) {
            if (!newChecklist.includes(item)) newChecklist.push(item);
        } else {
            const index = newChecklist.indexOf(item);
            if (index > -1) newChecklist.splice(index, 1);
        }
        return {...prev, checklist: newChecklist};
    });
  }

  const handleExport = () => {
    const content = entry.content;
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
      <div className="p-4 flex-grow overflow-y-auto">
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
        <div className="p-4 border-t mt-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Umore della giornata</h3>
            <div className="flex justify-around">
                {['😄', '😊', '😐', '😕', '😢'].map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => handleMoodChange(emoji)}
                    className={cn(
                    "text-3xl rounded-full p-1 transition-all",
                    entry.mood === emoji ? 'bg-accent/50 scale-110' : 'hover:bg-muted'
                    )}
                >
                    {emoji}
                </button>
                ))}
            </div>
        </div>
        <div className="p-4 border-t">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Checklist Giornaliera</h3>
            <div className="space-y-2">
                {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={item.id}
                            checked={entry.checklist?.includes(item.id)}
                            onCheckedChange={(checked) => handleChecklistChange(item.id, !!checked)}
                        />
                        <Label htmlFor={item.id} className="font-normal text-sm cursor-pointer">{item.label}</Label>
                    </div>
                ))}
            </div>
        </div>
      </div>
      <div className="p-4 border-t space-y-2 mt-auto">
        <Button variant="outline" className="w-full justify-start" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" /> Import Note
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".md,.markdown" />
        <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export Note
        </Button>
      </div>
      <div className="p-4 border-t">
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
            <AnalyzeButton content={entry.content} />
          </div>
        </header>
        <main className="flex-grow grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          <div className={cn('h-full flex flex-col', viewMode === 'preview' ? 'hidden md:hidden' : 'md:block', viewMode === 'editor' ? 'md:col-span-2' : '')}>
            <div className="flex-grow h-full overflow-y-auto">
              <Textarea
                ref={textareaRef}
                value={entry.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing your journal entry here..."
                className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-8 text-base font-code bg-transparent"
              />
            </div>
            <MarkdownToolbar 
              textareaRef={textareaRef}
              content={entry.content}
              onContentChange={handleContentChange}
            />
          </div>
          <div className={cn('h-full overflow-y-auto border-l', viewMode === 'editor' ? 'hidden md:hidden' : 'md:block', viewMode === 'preview' ? 'md:col-span-2' : '')}>
            <MarkdownPreview content={entry.content} />
          </div>
        </main>
      </div>
    </div>
  );
}
