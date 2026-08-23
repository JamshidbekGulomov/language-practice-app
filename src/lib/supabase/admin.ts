import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bypasses RLS with the service_role key. Server-only — never import
 * this from a Client Component or expose it to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
