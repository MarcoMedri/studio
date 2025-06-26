'use client';

import { useState, useEffect } from 'react';
import * as store from '@/lib/journal-store';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from './ui/skeleton';

const moodMap: { [key: string]: number } = { '😢': 1, '😕': 2, '😐': 3, '😊': 4, '😄': 5 };
const checklistItemLabels: { [key: string]: string } = {
    'alimentazione': 'Alimentazione',
    'sonno': 'Sonno',
    'esercizio': 'Esercizio fisico',
    'studio': 'Studio',
    'lettura': 'Lettura',
};


export function Statistics() {
    const [trendData, setTrendData] = useState<any[]>([]);
    const [frequencyData, setFrequencyData] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const allNotes = store.getAllNotes();
        const notesArray = Object.entries(allNotes)
            .map(([date, entry]) => ({ date: new Date(date), ...entry }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        // Process trend data
        const processedTrendData = notesArray.map(note => ({
            date: format(note.date, 'dd/MM'),
            Umore: note.mood ? moodMap[note.mood] : null,
            Checklist: note.checklist?.length || 0,
        })).slice(-30); // Show last 30 entries
        setTrendData(processedTrendData);

        // Process frequency data
        const frequencyMap: { [key: string]: number } = {};
        for (const key in checklistItemLabels) {
            frequencyMap[key] = 0;
        }

        notesArray.forEach(note => {
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

    }, []);

    if (!isMounted) {
        return (
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const noData = trendData.length === 0 && frequencyData.every(item => item.conteggio === 0);

    if (noData) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Nessun dato disponibile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Inizia a scrivere nel tuo diario, registrare il tuo umore e completare la checklist per vedere qui le tue statistiche.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Andamento Umore e Checklist</CardTitle>
                    <CardDescription>Visualizzazione dell'umore e del numero di attività completate negli ultimi 30 giorni con dati.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" domain={[1, 5]} ticks={[1,2,3,4,5]} tickFormatter={(val) => Object.keys(moodMap).find(key => moodMap[key] === val) || ''} />
                            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                }}
                                formatter={(value, name) => {
                                    if(name === 'Umore' && typeof value === 'number') {
                                        return [Object.keys(moodMap).find(key => moodMap[key] === value), name];
                                    }
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="Umore" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="Checklist" stroke="hsl(var(--chart-2))" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Frequenza Checklist</CardTitle>
                    <CardDescription>Conteggio totale per ogni attività della checklist.</CardDescription>
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
    )
}
