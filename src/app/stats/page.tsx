'use client';

import { Statistics } from '@/components/statistics';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { useTranslation } from '@/lib/i18n';

// export const metadata: Metadata = {
//   title: 'Journal Statistics',
//   description: 'Analizza l\'andamento del tuo umore e delle tue abitudini nel tempo.',
// };


export default function StatsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex items-center justify-between p-2 border-b h-16 flex-shrink-0">
            <div className="flex items-center gap-4">
                 <Link href="/" passHref>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold font-headline text-primary">{t('statsTitle')}</h1>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Statistics />
        </main>
    </div>
  );
}
