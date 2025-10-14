// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace these with your own credentials
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://afwetlctquuvyuefmjme.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmd2V0bGN0cXV1dnl1ZWZtam1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDA4ODksImV4cCI6MjA3NTQxNjg4OX0.jWST8Xs0njjBlS4k9vBQWnRkGfQ0IUe5s4FTsj_ESGY';

// ✅ This is the missing line:
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
