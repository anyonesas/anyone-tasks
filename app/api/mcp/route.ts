import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyToken } from "@/lib/tokens";
import {
  createRequest,
  listRequests,
  getRequest,
  respondToRequest,
  updateRequest,
} from "@/lib/requests";
import { env } from "@/lib/env";
import { STATUS_LABELS } from "@/lib/types";

// Stateless Streamable-HTTP MCP server.
// Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROTOCOL_VERSION = "2025-03-26";

// JSON-RPC error codes
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
const UNAUTHORIZED = -32001;

interface AuthContext {
  email: string;
  name: string | null;
}

interface ToolDef {
  name: string;
  description: string;
  // JSON Schema for the tool input (what the client sees in tools/list).
  inputSchema: Record<string, unknown>;
  // Zod schema for runtime validation.
  zod: z.ZodTypeAny;
  handler: (input: unknown, auth: AuthContext) => Promise<string>;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const fileSchema = z.object({
  name: z.string(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
});

const filesJsonSchema = {
  type: "array",
  description:
    "Files / references attached to the request. Each item has a name and optionally a URL, a short description, or pasted content.",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      url: { type: "string" },
      description: { type: "string" },
      content: { type: "string" },
    },
    required: ["name"],
  },
};

const scoreField = (label: string) => ({
  type: "integer",
  minimum: 1,
  maximum: 5,
  description: `${label} (1 = low, 5 = high).`,
});

function siteUrl(): string {
  return env.siteUrl().replace(/\/$/, "");
}

const tools: ToolDef[] = [
  {
    name: "create_request",
    description:
      "Submit a structured request to the lead developer. Use after you have a project name, a short title, an exact request, and have scored complexity/criticality/urgency. Include a `digest` ready to paste into the dev's Claude session.",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "Project the request concerns (e.g. 'anyone-site', 'castingpass').",
        },
        title: {
          type: "string",
          description: "Short title (max ~10 words).",
        },
        request: {
          type: "string",
          description: "Exact request — what you want done, in your own words.",
        },
        context: {
          type: "string",
          description:
            "Background the dev needs: what's the goal, where in the codebase, prior history, related decisions.",
        },
        type: {
          type: "string",
          enum: ["feature", "bug", "question", "info"],
          description: "feature = new/changed behavior; bug = something broken; question = need answer from dev; info = just FYI.",
        },
        files: filesJsonSchema,
        complexity_score: scoreField("How hard the dev work is"),
        criticality_score: scoreField(
          "How risky / how much it touches sensitive areas (auth, payments, prod data)",
        ),
        urgency_score: scoreField("How urgent"),
        complexity_reason: { type: "string" },
        criticality_reason: { type: "string" },
        urgency_reason: { type: "string" },
        safety_notes: {
          type: "string",
          description:
            "Guardrails / things NOT to touch / boundaries the dev's Claude must respect.",
        },
        digest: {
          type: "string",
          description:
            "Markdown-formatted digest the dev can copy-paste into their Claude session. Should be self-contained.",
        },
      },
      required: ["project", "title", "request"],
    },
    zod: z.object({
      project: z.string().min(1),
      title: z.string().min(1),
      request: z.string().min(1),
      context: z.string().optional(),
      type: z.enum(["feature", "bug", "question", "info"]).optional().default("feature"),
      files: z.array(fileSchema).optional(),
      complexity_score: z.number().int().min(1).max(5).optional(),
      criticality_score: z.number().int().min(1).max(5).optional(),
      urgency_score: z.number().int().min(1).max(5).optional(),
      complexity_reason: z.string().optional(),
      criticality_reason: z.string().optional(),
      urgency_reason: z.string().optional(),
      safety_notes: z.string().optional(),
      digest: z.string().optional(),
    }),
    handler: async (input, auth) => {
      const args = input as z.infer<(typeof tools)[0]["zod"]>;
      const service = createServiceClient();
      const created = await createRequest(service, {
        submitted_by_email: auth.email,
        submitted_by_name: auth.name,
        project: args.project,
        title: args.title,
        request: args.request,
        context: args.context ?? null,
        files: args.files ?? [],
        type: args.type ?? "feature",
        complexity_score: args.complexity_score ?? null,
        criticality_score: args.criticality_score ?? null,
        urgency_score: args.urgency_score ?? null,
        complexity_reason: args.complexity_reason ?? null,
        criticality_reason: args.criticality_reason ?? null,
        urgency_reason: args.urgency_reason ?? null,
        safety_notes: args.safety_notes ?? null,
        digest: args.digest ?? null,
      });
      return JSON.stringify(
        {
          id: created.id,
          url: `${siteUrl()}/requests/${created.id}`,
          project: created.project,
          title: created.title,
          type: created.type,
          status: created.status,
          urgency_score: created.urgency_score,
          complexity_score: created.complexity_score,
          criticality_score: created.criticality_score,
          message: `Demande créée et envoyée au dev. Lien: ${siteUrl()}/requests/${created.id}`,
        },
        null,
        2,
      );
    },
  },
  {
    name: "list_requests",
    description:
      "List requests, optionally filtered. Useful to see what's still pending or check status of a previous request.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "rejected", "info_provided", "open"],
          description: "Filter by status. 'open' = pending OR in_progress.",
        },
        project: { type: "string" },
        type: { type: "string", enum: ["feature", "bug", "question", "info"] },
        urgency_min: { type: "integer", minimum: 1, maximum: 5 },
        limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      },
    },
    zod: z.object({
      status: z
        .enum(["pending", "in_progress", "completed", "rejected", "info_provided", "open"])
        .optional(),
      project: z.string().optional(),
      type: z.enum(["feature", "bug", "question", "info"]).optional(),
      urgency_min: z.number().int().min(1).max(5).optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
    handler: async (input) => {
      const args = input as z.infer<(typeof tools)[1]["zod"]>;
      const service = createServiceClient();
      const items = await listRequests(service, { ...args, limit: args.limit ?? 50 });
      const summary = items.map((r) => ({
        id: r.id,
        url: `${siteUrl()}/requests/${r.id}`,
        project: r.project,
        title: r.title,
        type: r.type,
        status: r.status,
        status_label: STATUS_LABELS[r.status],
        urgency: r.urgency_score,
        complexity: r.complexity_score,
        criticality: r.criticality_score,
        submitted_by: r.submitted_by_email,
        created_at: r.created_at,
      }));
      return JSON.stringify({ count: summary.length, items: summary }, null, 2);
    },
  },
  {
    name: "get_request",
    description: "Get full details of a request, including response if any.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Request UUID." } },
      required: ["id"],
    },
    zod: z.object({ id: z.string().uuid() }),
    handler: async (input) => {
      const args = input as z.infer<(typeof tools)[2]["zod"]>;
      const service = createServiceClient();
      const item = await getRequest(service, args.id);
      if (!item) throw withCode(METHOD_NOT_FOUND, `Request not found: ${args.id}`);
      return JSON.stringify(item, null, 2);
    },
  },
  {
    name: "respond_to_request",
    description:
      "Respond to a request — typically used by the dev to reply to a 'question' or 'info' request, or to mark a feature/bug as done with a summary. Also updates status (default: 'completed').",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        response: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "rejected", "info_provided"],
          default: "completed",
        },
      },
      required: ["id", "response"],
    },
    zod: z.object({
      id: z.string().uuid(),
      response: z.string().min(1),
      status: z
        .enum(["pending", "in_progress", "completed", "rejected", "info_provided"])
        .optional()
        .default("completed"),
    }),
    handler: async (input, auth) => {
      const args = input as z.infer<(typeof tools)[3]["zod"]>;
      const service = createServiceClient();
      const updated = await respondToRequest(service, args.id, {
        response: args.response,
        status: args.status,
        responded_by_email: auth.email,
      });
      return JSON.stringify(
        {
          id: updated.id,
          url: `${siteUrl()}/requests/${updated.id}`,
          status: updated.status,
          response_at: updated.response_at,
        },
        null,
        2,
      );
    },
  },
  {
    name: "update_request_status",
    description: "Change just the status of a request (e.g. mark as in_progress, rejected).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "rejected", "info_provided"],
        },
      },
      required: ["id", "status"],
    },
    zod: z.object({
      id: z.string().uuid(),
      status: z.enum([
        "pending",
        "in_progress",
        "completed",
        "rejected",
        "info_provided",
      ]),
    }),
    handler: async (input) => {
      const args = input as z.infer<(typeof tools)[4]["zod"]>;
      const service = createServiceClient();
      const updated = await updateRequest(service, args.id, { status: args.status });
      return JSON.stringify(
        { id: updated.id, status: updated.status, url: `${siteUrl()}/requests/${updated.id}` },
        null,
        2,
      );
    },
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC handler
// ---------------------------------------------------------------------------

function withCode(code: number, message: string) {
  const e = new Error(message) as Error & { code: number };
  e.code = code;
  return e;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

async function handleMethod(
  body: JsonRpcRequest,
  auth: AuthContext,
): Promise<unknown> {
  switch (body.method) {
    case "initialize":
      return {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "anyone-tasks", version: "1.0.0" },
        instructions:
          "Outils pour soumettre, lister, lire et répondre à des demandes de dev. Utilise create_request après avoir collecté project/title/request/context et calculé les scores.",
      };
    case "tools/list":
      return {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      };
    case "tools/call": {
      const params = (body.params ?? {}) as { name?: string; arguments?: unknown };
      const tool = tools.find((t) => t.name === params.name);
      if (!tool) throw withCode(METHOD_NOT_FOUND, `Tool not found: ${params.name}`);
      const parsed = tool.zod.safeParse(params.arguments ?? {});
      if (!parsed.success)
        throw withCode(INVALID_PARAMS, JSON.stringify(parsed.error.flatten()));
      const text = await tool.handler(parsed.data, auth);
      return { content: [{ type: "text", text }], isError: false };
    }
    case "ping":
      return {};
    case "notifications/initialized":
    case "notifications/cancelled":
      // Notifications: no result expected.
      return undefined;
    default:
      throw withCode(METHOD_NOT_FOUND, `Method not found: ${body.method}`);
  }
}

async function processOne(
  body: JsonRpcRequest,
  auth: AuthContext,
): Promise<JsonRpcResponse | null> {
  const isNotification = body.id === undefined || body.id === null;
  try {
    const result = await handleMethod(body, auth);
    if (isNotification) return null;
    return { jsonrpc: "2.0", id: body.id!, result };
  } catch (err) {
    if (isNotification) return null;
    const e = err as Error & { code?: number };
    return {
      jsonrpc: "2.0",
      id: body.id ?? null,
      error: {
        code: typeof e.code === "number" ? e.code : INTERNAL_ERROR,
        message: e.message || "Internal error",
      },
    };
  }
}

async function authenticate(req: NextRequest): Promise<AuthContext | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  const service = createServiceClient();
  const row = await verifyToken(service, token);
  if (!row) return null;
  return { email: row.user_email, name: row.user_name };
}

function unauthorized(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: UNAUTHORIZED, message: "Unauthorized — missing or invalid Bearer token." },
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": 'Bearer realm="anyone-tasks"',
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: PARSE_ERROR, message: "Parse error" } },
      { status: 400 },
    );
  }

  // Batched requests
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((b) => processOne(b as JsonRpcRequest, auth)),
    );
    const filtered = responses.filter(Boolean);
    if (filtered.length === 0) return new NextResponse(null, { status: 204 });
    return NextResponse.json(filtered);
  }

  const response = await processOne(body as JsonRpcRequest, auth);
  if (!response) return new NextResponse(null, { status: 204 });
  return NextResponse.json(response);
}

export async function GET(req: NextRequest) {
  // Health / discovery: ack auth but don't open SSE.
  const auth = await authenticate(req);
  if (!auth) return unauthorized();
  return NextResponse.json({
    server: "anyone-tasks",
    protocolVersion: PROTOCOL_VERSION,
    tools: tools.map((t) => t.name),
    authenticated_as: auth.email,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "authorization, content-type, mcp-session-id",
    },
  });
}
