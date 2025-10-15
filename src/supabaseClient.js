// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace these with your own credentials
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
// ✅ This is the missing line:
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
