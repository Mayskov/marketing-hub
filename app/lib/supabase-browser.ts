"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client — uses cookies so session is shared with server components
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
