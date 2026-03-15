import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client with service role key (bypasses RLS)
// Used in API routes only — never expose to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
