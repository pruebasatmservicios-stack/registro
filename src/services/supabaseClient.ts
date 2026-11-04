import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://daruxccisltdtooeuqcr.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_qdNr4uw2Q45R5dX15MrGiA_WR394B6v';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
