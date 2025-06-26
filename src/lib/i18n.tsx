'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { enUS, it } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const translations = {
  it: {
    today: 'Oggi',
    loadingDate: 'Caricamento data...',
    settings: {
      title: 'Impostazioni',
      import: 'Importa Nota',
      export: 'Esporta Nota',
      theme: 'Tema',
      light: 'Chiaro',
      dark: 'Scuro',
      system: 'Sistema',
      colorTheme: 'Colore Tema',
      language: 'Lingua',
      dateFormat: 'Formato Data',
      massDelete: 'Cancellazione Massiva',
      last7days: 'Ultimi 7 giorni',
      last30days: 'Ultimi 30 giorni',
      lastYear: 'Ultimo anno',
      allNotes: 'Tutte le note',
    },
    deleteDialog: {
        title: 'Sei sicuro?',
        description: 'Questa azione è irreversibile. Eliminerà definitivamente {label} le note.',
        description_all: 'tutte',
        description_range: 'delle ultime {range}',
        cancel: 'Annulla',
        confirm: 'Conferma',
    },
    toasts: {
        noteExported: 'Nota Esportata',
        noteExportedDesc: 'Voce per {date} salvata.',
        importSuccess: 'Importazione Riuscita',
        importSuccessDesc: 'Importata nota per {date}.',
        importFailed: 'Importazione Fallita',
        importFailedDesc: 'Si prega di usare il formato dd-mm-yyyy.md.',
        noteDeleted: 'Nota cancellata',
        notesDeleted: 'Note eliminate',
        notesDeletedDesc: 'Le note selezionate sono state eliminate.',
    },
    checklist: {
        title: 'Checklist Giornaliera',
        food: 'Alimentazione',
        sleep: 'Sonno',
        exercise: 'Esercizio fisico',
        study: 'Studio',
        reading: 'Lettura',
    },
    mood: 'Umore della giornata',
    editorPlaceholder: 'Inizia a scrivere la tua nota qui...',
    analyze: 'Analizza Tono',
    analysis: {
        title: 'Analisi del Tono',
        description: 'Insight basati su IA sulla tua scrittura.',
        error: 'Analisi fallita. Riprova.',
        errorTitle: 'Analisi Fallita',
        errorDesc: 'Si è verificato un errore durante l\'analisi.',
        cannotAnalyze: 'Impossibile Analizzare',
        cannotAnalyzeDesc: 'Per favore scrivi qualcosa prima di analizzare.',
        sentiment: 'Sentiment Generale',
        signals: 'Segnali Emotivi Chiave',
    },
    statsTitle: 'Statistiche',
    stats: {
        timeFilter: 'Filtro Temporale',
        selectRange: 'Seleziona intervallo',
        last7: 'Ultimi 7 giorni',
        last30: 'Ultimi 30 giorni',
        last90: 'Ultimo trimestre',
        last365: 'Ultimo anno',
        avgMood: 'Umore Medio',
        avgMoodDesc: 'Media dell\'umore nel periodo selezionato.',
        avgChecklist: 'Checklist Media',
        avgChecklistDesc: 'Media di attività completate al giorno.',
        trendTitle: 'Andamento Umore e Checklist',
        trendDesc: 'Visualizzazione nel periodo selezionato.',
        freqTitle: 'Frequenza Checklist',
        freqDesc: 'Conteggio totale per attività nel periodo selezionato.',
        noDataTitle: 'Nessun dato disponibile',
        noDataDesc: 'Inizia a scrivere nel tuo diario per vedere qui le tue statistiche. Seleziona un intervallo di tempo diverso se pensi ci siano dati.',
        mood: 'Umore',
        checklist: 'Checklist',
        count: 'conteggio',
    },
    blue: 'Blu',
    green: 'Verde',
    orange: 'Arancione',
    rose: 'Rosa',
    violet: 'Viola',
    yellow: 'Giallo',
    cyan: 'Ciano',
    slate: 'Grigio',
    previewPlaceholder: 'L\'anteprima apparirà qui.',
  },
  en: {
    today: 'Today',
    loadingDate: 'Loading date...',
    settings: {
      title: 'Settings',
      import: 'Import Note',
      export: 'Export Note',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      colorTheme: 'Color Theme',
      language: 'Language',
      dateFormat: 'Date Format',
      massDelete: 'Mass Deletion',
      last7days: 'Last 7 days',
      last30days: 'Last 30 days',
      lastYear: 'Last year',
      allNotes: 'All notes',
    },
    deleteDialog: {
        title: 'Are you sure?',
        description: 'This action is irreversible. It will permanently delete {label} notes.',
        description_all: 'all',
        description_range: 'the last {range}',
        cancel: 'Cancel',
        confirm: 'Confirm',
    },
    toasts: {
        noteExported: 'Note Exported',
        noteExportedDesc: 'Entry for {date} saved.',
        importSuccess: 'Import Successful',
        importSuccessDesc: 'Imported note for {date}.',
        importFailed: 'Import Failed',
        importFailedDesc: 'Please use dd-mm-yyyy.md format.',
        noteDeleted: 'Note deleted',
        notesDeleted: 'Notes deleted',
        notesDeletedDesc: 'The selected notes have been deleted.',
    },
    checklist: {
        title: 'Daily Checklist',
        food: 'Nutrition',
        sleep: 'Sleep',
        exercise: 'Exercise',
        study: 'Study',
        reading: 'Reading',
    },
    mood: 'Mood of the day',
    editorPlaceholder: 'Start writing your journal entry here...',
    analyze: 'Analyze Tone',
    analysis: {
        title: 'Tone Analysis',
        description: 'AI-powered insights into your writing.',
        error: 'Failed to analyze entry. Please try again.',
        errorTitle: 'Analysis Failed',
        errorDesc: 'An error occurred while analyzing the entry.',
        cannotAnalyze: 'Cannot Analyze',
        cannotAnalyzeDesc: 'Please write something before analyzing the tone.',
        sentiment: 'Overall Sentiment',
        signals: 'Key Emotional Signals',
    },
    statsTitle: 'Statistics',
    stats: {
        timeFilter: 'Time Filter',
        selectRange: 'Select range',
        last7: 'Last 7 days',
        last30: 'Last 30 days',
        last90: 'Last quarter',
        last365: 'Last year',
        avgMood: 'Average Mood',
        avgMoodDesc: 'Average mood over the selected period.',
        avgChecklist: 'Average Checklist',
        avgChecklistDesc: 'Average completed tasks per day.',
        trendTitle: 'Mood and Checklist Trend',
        trendDesc: 'Visualization over the selected period.',
        freqTitle: 'Checklist Frequency',
        freqDesc: 'Total count per activity in the selected period.',
        noDataTitle: 'No data available',
        noDataDesc: 'Start writing in your journal to see your stats here. Select a different time range if you think there is data.',
        mood: 'Mood',
        checklist: 'Checklist',
        count: 'count',
    },
    blue: 'Blue',
    green: 'Green',
    orange: 'Orange',
    rose: 'Rose',
    violet: 'Violet',
    yellow: 'Yellow',
    cyan: 'Cyan',
    slate: 'Slate',
    previewPlaceholder: 'Preview will appear here.',
  },
};

type Language = 'it' | 'en';
type Translations = typeof translations.it;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  dateLocale: Locale;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('it');
   
  useEffect(() => {
    const savedLang = localStorage.getItem('journal-lang') as Language;
    if (savedLang && (savedLang === 'it' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('journal-lang', lang);
  };

  const t = (key: string, replacements?: Record<string, string>): string => {
    const keys = key.split('.');
    let text = keys.reduce((obj: any, k: string) => obj && obj[k], translations[language] as any) as string | undefined;

    if (text === undefined) {
      // Fallback to English
      text = keys.reduce((obj: any, k: string) => obj && obj[k], translations.en as any) as string | undefined;
      if (text === undefined) {
        console.warn(`Translation key "${key}" not found.`);
        return key;
      }
    }
    
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            text = text!.replace(`{${rKey}}`, replacements[rKey]);
        });
    }

    return text;
  };

  const dateLocale = useMemo(() => (language === 'it' ? it : enUS), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dateLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
