'use client';

import { useState, useEffect } from 'react';
import * as store from '@/lib/journal-store';
import { format, subDays, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smile, ListChecks } from 'lucide-react';

const moodMap: { [key: string]: number } = { '😢': 1, '😕': 2, '😐': 3, '😊': 4, '😄': 5 };
const moodEmojiMap: { [key: number]: string } = { 1: '😢', 2: '😕', 3: '😐', 4: '😊', 5: '😄' };
const checklistItemLabels: { [key: string]: string } = {
    'alimentazione': 'Alimentazione',
    'sonno': 'Sonno',
    'esercizio': 'Esercizio fisico',
    'studio': 'Studio',
    'lettura': 'Lettura',
};

const timeRangeOptions = [
    { value: '7', label: 'Ultimi 7 giorni' },
    { value: '30', label: 'Ultimi 30 giorni' },
    { value: '90', label: 'Ultimo trimestre' },
    { value: '365', label: 'Ultimo anno' },
];

export function Statistics() {
    const [timeRange, setTimeRange] = useState('30');
    const [trendData, setTrendData] = useState<any[]>([]);
    const [frequencyData, setFrequencyData] = useState<any[]>([]);
    const [averageMood, setAverageMood] = useState<number | null>(null);
    const [averageChecklist, setAverageChecklist] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const allNotes = store.getAllNotes();
        const notesArray = Object.entries(allNotes)
            .map(([date, entry]) => ({ date: new Date(date), ...entry }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const now = new Date();
        const days = parseInt(timeRange);
        const startDate = startOfDay(subDays(now, days));

        const filteredNotes = notesArray.filter(note => note.date >= startDate);

        const processedTrendData = filteredNotes.map(note => ({
            date: format(note.date, 'dd/MM'),
            Umore: note.mood ? moodMap[note.mood] : null,
            Checklist: note.checklist?.length || 0,
        }));
        setTrendData(processedTrendData);

        const frequencyMap: { [key: string]: number } = {};
        for (const key in checklistItemLabels) {
            frequencyMap[key] = 0;
        }
        filteredNotes.forEach(note => {
            note.checklist?.forEach(item => {
                if (frequencyMap.hasOwnProperty(item)) {
                    frequencyMap[item]++;
                }
            });
        });
        const processedFrequencyData = Object.entries(frequencyMap).map(([key, value]) => ({
            name: checklistItemLabels[key],
            conteggio: value,
        }));
        setFrequencyData(processedFrequencyData);

        const notesWithMood = filteredNotes.filter(note => note.mood);
        if (notesWithMood.length > 0) {
            const totalMood = notesWithMood.reduce((sum, note) => sum + moodMap[note.mood!], 0);
            setAverageMood(totalMood / notesWithMood.length);
        } else {
            setAverageMood(null);
        }
        
        if (filteredNotes.length > 0) {
            const totalChecklist = filteredNotes.reduce((sum, note) => sum + (note.checklist?.length || 0), 0);
            setAverageChecklist(totalChecklist / filteredNotes.length);
        } else {
            setAverageChecklist(null);
        }

    }, [isMounted, timeRange]);

    const roundedAvgMood = averageMood ? Math.round(averageMood) : null;
    const avgMoodEmoji = roundedAvgMood ? moodEmojiMap[roundedAvgMood] : '—';
    const avgMoodValue = averageMood ? averageMood.toFixed(1) : 'N/D';
    const avgChecklistValue = averageChecklist ? averageChecklist.toFixed(1) : 'N/D';

    if (!isMounted) {
        return (
             <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
                        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
                        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
                    </Card>
                </div>
            </div>
        );
    }
    
    const noData = trendData.length === 0 && frequencyData.every(item => item.conteggio === 0);

    const filterCard = (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filtro Temporale</CardTitle>
            </CardHeader>
            <CardContent>
                 <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona intervallo" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeRangeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );

    if (noData) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Nessun dato disponibile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Inizia a scrivere nel tuo diario per vedere qui le tue statistiche. Seleziona un intervallo di tempo diverso se pensi ci siano dati.
                        </p>
                         <div className="mt-4">
                            {filterCard}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {filterCard}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Umore Medio</CardTitle>
                        <Smile className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgMoodEmoji} ({avgMoodValue})</div>
                        <p className="text-xs text-muted-foreground">
                            Media dell'umore nel periodo selezionato.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Checklist Media</CardTitle>
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgChecklistValue}</div>
                        <p className="text-xs text-muted-foreground">
                           Media di attività completate al giorno.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Andamento Umore e Checklist</CardTitle>
                        <CardDescription>Visualizzazione nel periodo selezionato.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" domain={[1, 5]} ticks={[1,2,3,4,5]} tickFormatter={(val) => moodEmojiMap[val] || ''} />
                                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                    formatter={(value, name) => {
                                        if(name === 'Umore' && typeof value === 'number') {
                                            return [moodEmojiMap[value], name];
                                        }
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="Umore" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} connectNulls />
                                <Line yAxisId="right" type="monotone" dataKey="Checklist" stroke="hsl(var(--chart-2))" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Frequenza Checklist</CardTitle>
                        <CardDescription>Conteggio totale per attività nel periodo selezionato.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={frequencyData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--foreground))" />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                    }}
                                />
                                <Bar dataKey="conteggio" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
