// Backwards-compatible re-export.
//
// M0 generated a standalone browser client here (localStorage-backed, with a
// Lovable preview storage broker). M1 moved the real implementation to
// `@/lib/supabase/client`, which uses @supabase/ssr's createBrowserClient so the
// session lives in cookies and the server can read it.
//
// Existing imports (`import { supabase } from "@/integrations/supabase/client"`)
// keep working unchanged.
export { supabase, getSupabaseBrowserClient } from "@/lib/supabase/client";
