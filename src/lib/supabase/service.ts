import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

// Service-role Supabase client -- bypasses RLS entirely.
//
// Import this ONLY from server-side route handlers. Never from a Client
// Component, never behind a NEXT_PUBLIC_ prefix.
//
// The Stripe webhook is why this exists: Stripe is the caller, so there is no
// auth cookie and no auth.uid(). The cookie-bound client from ./server.ts would
// fail RLS on the profiles update.
export function createServiceClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const secretKey = process.env["SUPABASE_SECRET_KEY"];

  if (!url || !secretKey) {
    throw new Error(
      "createServiceClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY",
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
