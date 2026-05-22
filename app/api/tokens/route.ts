import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/env";
import { createTokenRow, listTokens, revokeToken } from "@/lib/tokens";

const createSchema = z.object({
  user_email: z.string().email(),
  user_name: z.string().min(1).max(120).optional(),
  label: z.string().min(1).max(120).optional(),
});

const revokeSchema = z.object({ id: z.string().uuid() });

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const tokens = await listTokens(createServiceClient());
  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { token, row } = await createTokenRow(createServiceClient(), parsed.data);
  // Plaintext token is only returned here, never stored.
  return NextResponse.json({ token, row }, { status: 201 });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await revokeToken(createServiceClient(), parsed.data.id);
  return NextResponse.json({ ok: true });
}
