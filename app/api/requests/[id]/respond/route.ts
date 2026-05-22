import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { respondToRequest, respondSchema } from "@/lib/requests";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = respondSchema.safeParse({
    ...body,
    responded_by_email: body?.responded_by_email ?? user.email,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await respondToRequest(supabase, id, parsed.data);
  return NextResponse.json({ request: updated });
}
