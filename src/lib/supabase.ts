import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdicrjachpvdlcvpvtyz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9G0x2guUQzd0pdiX7Ad0Xg_7GDKa0JV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);