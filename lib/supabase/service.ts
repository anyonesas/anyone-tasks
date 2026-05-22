import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Server-only Supabase client using the service-role key.
// Bypasses RLS — use carefully (MCP routes, admin actions).
export function createServiceClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
