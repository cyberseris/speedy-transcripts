import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/integrations/supabase/types";

// Browser-side Supabase client.
//
// This uses @supabase/ssr's createBrowserClient (NOT plain createClient) so the
// auth session is stored in cookies rather than localStorage. That is what lets
// Server Components, Route Handlers and middleware.ts read the same session --
// without it, `/upload` and `/api/jobs` would never see a signed-in user.
function makeClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const publishableKey = process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !publishableKey) {
    const missing = [
      ...(!url ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!publishableKey ? ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(", ")}. ` +
        `Set them in .env.local and in the Vercel project's Environment Variables.`,
    );
  }

  return createBrowserClient<Database>(url, publishableKey);
}

let _client: ReturnType<typeof makeClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!_client) _client = makeClient();
  return _client;
}

// Lazy proxy so a missing env var throws at first real use (in the browser)
// rather than at module-evaluation time during the Vercel build.
export const supabase = new Proxy({} as ReturnType<typeof makeClient>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseBrowserClient(), prop, receiver);
  },
});
