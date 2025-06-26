import { format, parse, isValid, startOfDay } from 'date-fns';

const DATE_FORMAT = 'yyyy-MM-dd';
const STORAGE_KEY = 'mark-journal-notes-v2'; // Key updated for new data structure

export interface JournalEntry {
  content: string;
  mood?: string;
  checklist?: string[];
}

type Notes = Record<string, JournalEntry>;

function getNotesFromStorage(): Notes {
  if (typeof window === 'undefined') return {};
  try {
    const notesJSON = localStorage.getItem(STORAGE_KEY);
    const data = notesJSON ? JSON.parse(notesJSON) : {};
    
    // Basic migration for users from the old string-only format
    const oldKey = 'mark-journal-notes';
    const oldNotesJSON = localStorage.getItem(oldKey);
    if (oldNotesJSON) {
        const oldData = JSON.parse(oldNotesJSON);
        if (Object.values(oldData).some(v => typeof v === 'string')) {
            for (const key in oldData) {
                if (!data[key] && typeof oldData[key] === 'string') {
                    data[key] = { content: oldData[key] };
                }
            }
            localStorage.removeItem(oldKey);
            saveNotesToStorage(data);
        }
    }

    return data;
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

export function getNote(date: Date): JournalEntry {
  const notes = getNotesFromStorage();
  const dateKey = format(date, DATE_FORMAT);
  return notes[dateKey] || { content: '', checklist: [] };
}

export function saveNote(date: Date, entry: Partial<JournalEntry>) {
  const notes = getNotesFromStorage();
  const dateKey = format(date, DATE_FORMAT);
  
  const existingEntry = notes[dateKey] || { content: '', checklist: [] };
  const updatedEntry = { ...existingEntry, ...entry };

  if (
    !updatedEntry.content?.trim() &&
    !updatedEntry.mood &&
    (!updatedEntry.checklist || updatedEntry.checklist.length === 0)
  ) {
    if (notes[dateKey]) {
      delete notes[dateKey];
      saveNotesToStorage(notes);
    }
  } else {
    notes[dateKey] = updatedEntry;
    saveNotesToStorage(notes);
  }
}

export function deleteNote(date: Date) {
  const notes = getNotesFromStorage();
  const dateKey = format(date, DATE_FORMAT);
  if (notes[dateKey]) {
    delete notes[dateKey];
    saveNotesToStorage(notes);
  }
}

export function deleteNotesByDateRange(startDate: Date, endDate: Date) {
  const notes = getNotesFromStorage();
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  const keysToDelete = Object.keys(notes).filter(dateKey => {
    const noteDate = parse(dateKey, DATE_FORMAT, new Date());
    return isValid(noteDate) && noteDate >= start && noteDate <= end;
  });

  keysToDelete.forEach(key => {
    delete notes[key];
  });
  
  saveNotesToStorage(notes);
}

export function deleteAllNotes() {
    saveNotesToStorage({});
}

export function getDatesWithNotes(): Date[] {
  const notes = getNotesFromStorage();
  return Object.keys(notes)
    .filter(dateKey => {
        const entry = notes[dateKey];
        return !!entry.content?.trim() || !!entry.mood || (!!entry.checklist && entry.checklist.length > 0);
    })
    .map(dateKey => parse(dateKey, DATE_FORMAT, new Date()))
    .filter(date => isValid(date));
}

export function getAllNotes(): Notes {
  return getNotesFromStorage();
}

export function importNote(fileName: string, content: string, dateFormat: string = 'dd-MM-yyyy'): Date | null {
    try {
        const dateString = fileName.toLowerCase().replace(/\.md$/, '').replace(/\.markdown$/, '');
        const date = parse(dateString, dateFormat, new Date());
        
        if (isValid(date)) {
            saveNote(date, { content });
            return date;
        }
        return null;
    } catch (e) {
        console.error("Error parsing date from filename", e);
        return null;
    }
}
