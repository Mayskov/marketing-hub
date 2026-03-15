"use client";

import { createClient } from "@supabase/supabase-js";

// Browser Supabase client with anon key — used for auth and realtime in client components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
