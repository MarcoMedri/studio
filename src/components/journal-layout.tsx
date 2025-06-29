'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { format, subDays, subYears } from 'date-fns';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { 
  Calendar as CalendarIcon, Code, BookOpen, Split, Download, Upload, Menu, Settings, SunMoon, Languages, CalendarDays, Apple, BedDouble, Dumbbell, GraduationCap, Palette, Trash2, BarChart, LogOut
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
import { Skeleton } from './ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from '@/lib/i18n';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';


type ViewMode = 'split' | 'editor' | 'preview';
type PendingDeletion = {
  type: 'range' | 'all';
  range?: { start: Date; end: Date };
  label: string;
};

const checklistItems = [
    {id: 'alimentazione', labelKey: 'checklist.food', icon: <Apple className="h-4 w-4 text-muted-foreground" />},
    {id: 'sonno', labelKey: 'checklist.sleep', icon: <BedDouble className="h-4 w-4 text-muted-foreground" />},
    {id: 'esercizio', labelKey: 'checklist.exercise', icon: <Dumbbell className="h-4 w-4 text-muted-foreground" />},
    {id: 'studio', labelKey: 'checklist.study', icon: <GraduationCap className="h-4 w-4 text-muted-foreground" />},
    {id: 'lettura', labelKey: 'checklist.reading', icon: <BookOpen className="h-4 w-4 text-muted-foreground" />},
];

const colorThemes = [
    { name: 'blue', labelKey: 'blue' },
    { name: 'green', labelKey: 'green' },
    { name: 'orange', labelKey: 'orange' },
    { name: 'rose', labelKey: 'rose' },
    { name: 'violet', labelKey: 'violet' },
    { name: 'yellow', labelKey: 'yellow' },
    { name: 'cyan', labelKey: 'cyan' },
    { name: 'slate', labelKey: 'slate' },
];

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
  const [isMounted, setIsMounted] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const { t, language, setLanguage, dateLocale } = useTranslation();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };


  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('color-theme') || 'blue';
    setColorTheme(savedTheme);
  }, []);

  useEffect(() => {
    if(!isMounted) return;
    document.documentElement.setAttribute('data-color-theme', colorTheme)
    localStorage.setItem('color-theme', colorTheme);
  }, [colorTheme, isMounted]);

  useEffect(() => {
    if (isMounted) {
      if (selectedDate) {
        const loadedEntry = store.getNote(selectedDate);
        setEntry(loadedEntry);
      } else {
        setSelectedDate(new Date());
      }
    }
  }, [selectedDate, isMounted]);

  useEffect(() => {
    if (selectedDate && isMounted) {
      store.saveNote(selectedDate, debouncedEntry);
      setDatesWithNotes(store.getDatesWithNotes());
    }
  }, [debouncedEntry, selectedDate, isMounted]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const { selectionStart, value } = textarea;
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(lineStart, selectionStart);

      const listMatch = currentLine.match(/^(\s*([-*]|\d+\.)\s).*/);
      
      if (listMatch && currentLine.trim().length > listMatch[1].trim().length) {
        e.preventDefault();
        let prefix = '';
        const olMatch = currentLine.match(/^(\s*)(\d+)(\.\s)/);

        if (olMatch) {
            const nextNumber = parseInt(olMatch[2], 10) + 1;
            prefix = `\n${olMatch[1]}${nextNumber}${olMatch[3]}`;
        } else {
            prefix = `\n${listMatch[1]}`;
        }
        
        const newContent =
          value.substring(0, selectionStart) +
          prefix +
          value.substring(selectionStart);
        handleContentChange(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + prefix.length;
        }, 0);
        return;
      }
    }
  };

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
    toast({ title: t('toasts.noteExported'), description: t('toasts.noteExportedDesc', { date: dateString }) });
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
              title: t('toasts.importSuccess'),
              description: t('toasts.importSuccessDesc', { date: format(newDate, 'PPP', { locale: dateLocale }) }),
            });
          } else {
            throw new Error('Invalid filename format.');
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: t('toasts.importFailed'),
            description: t('toasts.importFailedDesc'),
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
    toast({ title: t('toasts.noteDeleted') });
  };
  
  const handleConfirmDelete = () => {
    if (!pendingDeletion) return;

    if (pendingDeletion.type === 'range' && pendingDeletion.range) {
      store.deleteNotesByDateRange(pendingDeletion.range.start, pendingDeletion.range.end);
    } else if (pendingDeletion.type === 'all') {
      store.deleteAllNotes();
    }

    setDatesWithNotes(store.getDatesWithNotes());
    if (selectedDate) {
        const loadedEntry = store.getNote(selectedDate);
        setEntry(loadedEntry);
    }
    
    toast({ title: t('toasts.notesDeleted'), description: t('toasts.notesDeletedDesc') });
    setPendingDeletion(null);
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
        <Button
          onClick={() => handleDateSelect(new Date())}
          className="w-full mb-4"
          variant="outline"
        >
          {t('today')}
        </Button>
        {isMounted ? (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md"
              modifiers={calendarModifiers}
              locale={dateLocale}
              showWeekNumber
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
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary"></div>
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
                            <span>{t('toasts.noteDeleted')}</span>
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  }

                  return dayContent;
                },
              }}
            />
        ) : (
          <div className="p-3">
              <Skeleton className="h-[290px] w-full" />
          </div>
        )}
        <div className="p-4 border-t mt-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{t('mood')}</h3>
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
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{t('checklist.title')}</h3>
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
                          <span>{t(item.labelKey)}</span>
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
    <>
      <div className="flex h-screen bg-background text-foreground">
        {!isMobile && (
          <aside className="w-80 border-r flex-shrink-0">
            {calendar}
          </aside>
        )}

        <div className="flex flex-col flex-1">
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
                <span className="text-lg">{isMounted && selectedDate ? format(selectedDate, 'PPP', { locale: dateLocale }) : t('loadingDate')}</span>
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
              <Link href="/stats" passHref>
                <Button variant="outline" size="icon" aria-label="Statistics">
                  <BarChart className="h-4 w-4" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('settings.title')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>{t('settings.import')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>{t('settings.export')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <SunMoon className="mr-2 h-4 w-4" />
                      <span>{t('settings.theme')}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme('light')}>{t('settings.light')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>{t('settings.dark')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('system')}>{t('settings.system')}</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Palette className="mr-2 h-4 w-4" />
                      <span>{t('settings.colorTheme')}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {colorThemes.map(theme => (
                          <DropdownMenuItem key={theme.name} onClick={() => setColorTheme(theme.name)}>
                            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: `hsl(var(--${theme.name}-preview))` }} />
                            {t(theme.labelKey)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Languages className="mr-2 h-4 w-4" />
                      <span>{t('settings.language')}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setLanguage('en')}>🇬🇧 English</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage('it')}>🇮🇹 Italiano</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      <span>{t('settings.dateFormat')}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>dd-MM-yyyy</DropdownMenuItem>
                        <DropdownMenuItem>MM-dd-yyyy</DropdownMenuItem>
                        <DropdownMenuItem>yyyy-MM-dd</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                   <DropdownMenuSeparator />
                   <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>{t('settings.massDelete')}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem className="text-destructive" onClick={() => {
                          setPendingDeletion({ type: 'range', range: { start: subDays(new Date(), 7), end: new Date() }, label: t('settings.last7days') });
                          setIsDeleteDialogOpen(true);
                        }}>
                          <span>{t('settings.last7days')}</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive" onClick={() => {
                          setPendingDeletion({ type: 'range', range: { start: subDays(new Date(), 30), end: new Date() }, label: t('settings.last30days') });
                          setIsDeleteDialogOpen(true);
                        }}>
                          <span>{t('settings.last30days')}</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive" onClick={() => {
                          setPendingDeletion({ type: 'range', range: { start: subYears(new Date(), 1), end: new Date() }, label: t('settings.lastYear') });
                          setIsDeleteDialogOpen(true);
                        }}>
                          <span>{t('settings.lastYear')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => {
                          setPendingDeletion({ type: 'all', label: 'tutte' });
                          setIsDeleteDialogOpen(true);
                        }}>
                          <span>{t('settings.allNotes')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('settings.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            <div className={cn('h-full grid grid-rows-[auto_1fr]', viewMode === 'preview' ? 'hidden' : 'grid', viewMode === 'editor' ? 'md:col-span-2' : '')}>
              <MarkdownToolbar 
                textareaRef={textareaRef}
                content={entry.content}
                onContentChange={handleContentChange}
              />
              <div className="relative overflow-hidden">
                <Textarea
                  ref={textareaRef}
                  value={entry.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('editorPlaceholder')}
                  className="absolute inset-0 h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-8 text-base font-code bg-transparent"
                />
              </div>
            </div>
            <div className={cn('h-full overflow-y-auto border-l', viewMode === 'editor' ? 'hidden' : 'block', viewMode === 'preview' ? 'md:col-span-2' : '')}>
              <MarkdownPreview content={entry.content} />
            </div>
          </main>
        </div>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { label: pendingDeletion?.type === 'all' ? t('deleteDialog.description_all') : pendingDeletion?.label ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeletion(null)}>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
