import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { token: string; hash: string } {
  // 32 random bytes → 64-char hex token, prefixed for easy recognition.
  const raw = randomBytes(32).toString("hex");
  const token = `att_${raw}`;
  return { token, hash: hashToken(token) };
}

export interface ApiToken {
  id: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  user_email: string;
  user_name: string | null;
  label: string | null;
}

export async function verifyToken(
  service: SupabaseClient,
  token: string | null | undefined,
): Promise<ApiToken | null> {
  if (!token) return null;
  const hash = hashToken(token);
  const { data, error } = await service
    .from("api_tokens")
    .select("id, created_at, last_used_at, revoked_at, user_email, user_name, label")
    .eq("token_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();
  if (error || !data) return null;
  // Fire-and-forget update of last_used_at.
  void service
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);
  return data as ApiToken;
}

export async function listTokens(service: SupabaseClient): Promise<ApiToken[]> {
  const { data, error } = await service
    .from("api_tokens")
    .select("id, created_at, last_used_at, revoked_at, user_email, user_name, label")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiToken[];
}

export async function createTokenRow(
  service: SupabaseClient,
  params: { user_email: string; user_name?: string | null; label?: string | null },
): Promise<{ token: string; row: ApiToken }> {
  const { token, hash } = generateToken();
  const { data, error } = await service
    .from("api_tokens")
    .insert({
      token_hash: hash,
      user_email: params.user_email,
      user_name: params.user_name ?? null,
      label: params.label ?? null,
    })
    .select("id, created_at, last_used_at, revoked_at, user_email, user_name, label")
    .single();
  if (error) throw error;
  return { token, row: data as ApiToken };
}

export async function revokeToken(
  service: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await service
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
