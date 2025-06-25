'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { useTheme } from 'next-themes';
import { 
  Calendar as CalendarIcon, Code, BookOpen, Split, Download, Upload, Menu, Settings, SunMoon, Languages, CalendarDays, Apple, BedDouble, Dumbbell, GraduationCap, Palette, Trash2 
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import * as store from '@/lib/journal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import MarkdownPreview from '@/components/markdown-preview';
import { AnalyzeButton } from '@/components/analyze-button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { MarkdownToolbar } from './markdown-toolbar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';


type ViewMode = 'split' | 'editor' | 'preview';

const checklistItems = [
    {id: 'alimentazione', label: 'Alimentazione', icon: <Apple className="h-4 w-4 text-muted-foreground" />},
    {id: 'sonno', label: 'Sonno', icon: <BedDouble className="h-4 w-4 text-muted-foreground" />},
    {id: 'esercizio', label: 'Esercizio fisico', icon: <Dumbbell className="h-4 w-4 text-muted-foreground" />},
    {id: 'studio', label: 'Studio', icon: <GraduationCap className="h-4 w-4 text-muted-foreground" />},
    {id: 'lettura', label: 'Lettura', icon: <BookOpen className="h-4 w-4 text-muted-foreground" />},
];

const colorThemes = [
    { name: 'blue', label: 'Blu', className: 'bg-blue-500' },
    { name: 'green', label: 'Verde', className: 'bg-green-500' },
    { name: 'orange', label: 'Arancione', className: 'bg-orange-500' },
    { name: 'rose', label: 'Rosa', className: 'bg-rose-500' },
]

export function JournalLayout() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [entry, setEntry] = useState<store.JournalEntry>({ content: '', checklist: [] });
  const [datesWithNotes, setDatesWithNotes] = useState<Date[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const debouncedEntry = useDebounce(entry, 500);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const { setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState('blue');

  useEffect(() => {
    // Set date on mount to avoid hydration mismatch
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme') || 'blue';
    setColorTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-theme', colorTheme)
    localStorage.setItem('color-theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    if (selectedDate) {
      const loadedEntry = store.getNote(selectedDate);
      setEntry(loadedEntry);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      store.saveNote(selectedDate, debouncedEntry);
      setDatesWithNotes(store.getDatesWithNotes());
    }
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
    if (!selectedDate) return;
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
  
  const handleDeleteNote = (date: Date) => {
    if (!selectedDate) return;
    store.deleteNote(date);
    setDatesWithNotes(store.getDatesWithNotes());
    if (format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')) {
        setEntry({ content: '', checklist: [] });
    }
    toast({ title: 'Nota cancellata' });
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
              
              const dayContent = (
                <div className="relative h-full w-full flex items-center justify-center">
                  {date.getDate()}
                  {isModified && (
                    <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                  )}
                </div>
              );

              if (isModified) {
                return (
                  <ContextMenu>
                    <ContextMenuTrigger className="h-full w-full">
                      {dayContent}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleDeleteNote(date)} className="text-destructive cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Cancella nota</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              }

              return dayContent;
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
                    entry.mood === emoji ? 'bg-primary/20 scale-110' : 'hover:bg-muted'
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
                        <Label htmlFor={item.id} className="font-normal text-sm cursor-pointer flex items-center gap-2">
                          {item.icon}
                          <span>{item.label}</span>
                        </Label>
                    </div>
                ))}
            </div>
        </div>
      </div>
       <div className="p-4 border-t mt-auto">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".md,.markdown" />
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
              <span className="text-lg">{selectedDate ? format(selectedDate, 'PPP') : 'Loading date...'}</span>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Impostazioni</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Importa Nota</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Esporta Nota</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <SunMoon className="mr-2 h-4 w-4" />
                    <span>Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme('light')}>Chiaro</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>Scuro</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>Sistema</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Colore Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {colorThemes.map(theme => (
                        <DropdownMenuItem key={theme.name} onClick={() => setColorTheme(theme.name)}>
                           <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: `hsl(var(--${theme.name}-preview, var(--primary)))` }} />
                          {theme.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>Lingua</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>English</DropdownMenuItem>
                      <DropdownMenuItem>Italiano</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Formato Data</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>dd-MM-yyyy</DropdownMenuItem>
                      <DropdownMenuItem>MM-dd-yyyy</DropdownMenuItem>
                      <DropdownMenuItem>yyyy-MM-dd</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-grow grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          <div className={cn('h-full flex flex-col', viewMode === 'preview' ? 'hidden' : 'block', viewMode === 'editor' ? 'col-span-2' : '')}>
             <div className="flex-1 overflow-y-auto">
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
          <div className={cn('h-full overflow-y-auto border-l', viewMode === 'editor' ? 'hidden' : 'block', viewMode === 'preview' ? 'col-span-2' : '')}>
            <MarkdownPreview content={entry.content} />
          </div>
        </main>
      </div>
    </div>
  );
}
