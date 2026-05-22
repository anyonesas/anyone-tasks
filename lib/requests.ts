import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskRequest, RequestStatus } from "@/lib/types";

const scoreField = z.number().int().min(1).max(5).nullable().optional();

export const createRequestSchema = z.object({
  submitted_by_email: z.string().email(),
  submitted_by_name: z.string().min(1).max(120).nullable().optional(),
  project: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  request: z.string().min(1).max(10_000),
  context: z.string().max(20_000).nullable().optional(),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(300),
        url: z.string().url().nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
        content: z.string().max(50_000).nullable().optional(),
      }),
    )
    .max(20)
    .optional()
    .default([]),
  type: z.enum(["feature", "bug", "question", "info"]).default("feature"),
  complexity_score: scoreField,
  criticality_score: scoreField,
  urgency_score: scoreField,
  complexity_reason: z.string().max(2000).nullable().optional(),
  criticality_reason: z.string().max(2000).nullable().optional(),
  urgency_reason: z.string().max(2000).nullable().optional(),
  safety_notes: z.string().max(4000).nullable().optional(),
  digest: z.string().max(20_000).nullable().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const updateRequestSchema = z.object({
  status: z
    .enum(["pending", "in_progress", "completed", "rejected", "info_provided"])
    .optional(),
  response: z.string().max(20_000).nullable().optional(),
  responded_by_email: z.string().email().nullable().optional(),
  project: z.string().min(1).max(120).optional(),
  title: z.string().min(1).max(200).optional(),
});

export const respondSchema = z.object({
  response: z.string().min(1).max(20_000),
  status: z
    .enum(["pending", "in_progress", "completed", "rejected", "info_provided"])
    .default("completed"),
  responded_by_email: z.string().email(),
});

export const listFilterSchema = z.object({
  status: z
    .enum(["pending", "in_progress", "completed", "rejected", "info_provided", "open"])
    .optional(),
  project: z.string().optional(),
  type: z.enum(["feature", "bug", "question", "info"]).optional(),
  urgency_min: z.coerce.number().int().min(1).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100).optional(),
});

export type ListFilters = z.infer<typeof listFilterSchema>;

export async function listRequests(
  client: SupabaseClient,
  filters: ListFilters = {},
): Promise<TaskRequest[]> {
  let query = client
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status === "open") {
    query = query.in("status", ["pending", "in_progress"]);
  } else if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.project) query = query.eq("project", filters.project);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.urgency_min)
    query = query.gte("urgency_score", filters.urgency_min);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TaskRequest[];
}

export async function getRequest(
  client: SupabaseClient,
  id: string,
): Promise<TaskRequest | null> {
  const { data, error } = await client
    .from("requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as TaskRequest) ?? null;
}

export async function createRequest(
  client: SupabaseClient,
  input: CreateRequestInput,
): Promise<TaskRequest> {
  const { data, error } = await client
    .from("requests")
    .insert({
      submitted_by_email: input.submitted_by_email,
      submitted_by_name: input.submitted_by_name ?? null,
      project: input.project,
      title: input.title,
      request: input.request,
      context: input.context ?? null,
      files: input.files ?? [],
      type: input.type,
      complexity_score: input.complexity_score ?? null,
      criticality_score: input.criticality_score ?? null,
      urgency_score: input.urgency_score ?? null,
      complexity_reason: input.complexity_reason ?? null,
      criticality_reason: input.criticality_reason ?? null,
      urgency_reason: input.urgency_reason ?? null,
      safety_notes: input.safety_notes ?? null,
      digest: input.digest ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as TaskRequest;
}

export async function respondToRequest(
  client: SupabaseClient,
  id: string,
  input: {
    response: string;
    status: RequestStatus;
    responded_by_email: string;
  },
): Promise<TaskRequest> {
  const { data, error } = await client
    .from("requests")
    .update({
      response: input.response,
      status: input.status,
      responded_by_email: input.responded_by_email,
      response_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as TaskRequest;
}

export async function updateRequest(
  client: SupabaseClient,
  id: string,
  patch: Partial<{
    status: RequestStatus;
    response: string | null;
    responded_by_email: string | null;
    project: string;
    title: string;
  }>,
): Promise<TaskRequest> {
  const { data, error } = await client
    .from("requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as TaskRequest;
}
