import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createRequest,
  createRequestSchema,
  listRequests,
  listFilterSchema,
} from "@/lib/requests";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const parsed = listFilterSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const items = await listRequests(supabase, parsed.data);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  const parsed = createRequestSchema.safeParse({
    ...body,
    submitted_by_email: body.submitted_by_email ?? user.email,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await createRequest(supabase, parsed.data);
  return NextResponse.json({ request: created }, { status: 201 });
}
