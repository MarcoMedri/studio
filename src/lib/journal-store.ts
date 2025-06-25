import { format, parse, isValid } from 'date-fns';

const DATE_FORMAT = 'yyyy-MM-dd';
const STORAGE_KEY = 'mark-journal-notes';

type Notes = Record<string, string>;

function getNotesFromStorage(): Notes {
  if (typeof window === 'undefined') return {};
  try {
    const notesJSON = localStorage.getItem(STORAGE_KEY);
    return notesJSON ? JSON.parse(notesJSON) : {};
  } catch (error) {
    console.error("Failed to parse notes from localStorage", error);
    return {};
  }
}

function saveNotesToStorage(notes: Notes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Failed to save notes to localStorage", error);
  }
}

export function getNote(date: Date): string {
  const notes = getNotesFromStorage();
  const dateKey = format(date, DATE_FORMAT);
  return notes[dateKey] || '';
}

export function saveNote(date: Date, content: string) {
  const notes = getNotesFromStorage();
  const dateKey = format(date, DATE_FORMAT);
  if (content.trim() === '') {
    // If content is empty, remove the entry
    if(notes[dateKey]) {
      delete notes[dateKey];
      saveNotesToStorage(notes);
    }
  } else {
    notes[dateKey] = content;
    saveNotesToStorage(notes);
  }
}

export function getDatesWithNotes(): Date[] {
  const notes = getNotesFromStorage();
  return Object.keys(notes)
    .map(dateKey => parse(dateKey, DATE_FORMAT, new Date()))
    .filter(date => isValid(date));
}

export function getAllNotes(): Notes {
  return getNotesFromStorage();
}

export function importNote(fileName: string, content: string, dateFormat: string = 'dd-MM-yyyy'): Date | null {
    try {
        const dateString = fileName.toLowerCase().replace('.md', '').replace('.markdown', '');
        const date = parse(dateString, dateFormat, new Date());
        
        if (isValid(date)) {
            saveNote(date, content);
            return date;
        }
        return null;
    } catch (e) {
        console.error("Error parsing date from filename", e);
        return null;
    }
}
