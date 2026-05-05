import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const isDatabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = isDatabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (!isDatabaseConfigured) {
  console.warn('[Supabase] Missing credentials. DB disabled.');
}