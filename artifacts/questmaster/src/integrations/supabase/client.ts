// Real Supabase client (used for Realtime broadcasts; data still flows through REST API).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  "https://snawpxrejmcxfbiiowxr.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYXdweHJlam1jeGZiaWlvd3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDgwNTEsImV4cCI6MjA4MjA4NDA1MX0.1knQmnMMqbD4XetxEFJ7YO8IZSN959KpNF1ZXyWTwz0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 20 } },
});
