import { createClient } from '@supabase/supabase-js';

function stripBOM(s: string | undefined, fallback: string): string {
  return (s ?? fallback).replace(/^﻿/, '').trim();
}

const supabaseUrl    = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL,    'https://placeholder.supabase.co');
const supabaseAnonKey = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getAdminClient() {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = stripBOM(raw, supabaseAnonKey);
  const useAnon = !raw || key === 'placeholder' || key === '待填写';
  return createClient(supabaseUrl, useAnon ? supabaseAnonKey : key);
}
