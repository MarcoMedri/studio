//src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Assicurati che queste variabili d'ambiente siano definite
// nel tuo file .env.local (in locale) e nelle impostazioni di Vercel
// (in produzione)
