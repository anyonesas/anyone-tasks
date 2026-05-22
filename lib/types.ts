export type RequestStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "rejected"
  | "info_provided";

export type RequestType = "feature" | "bug" | "question" | "info";

export interface RequestAttachment {
  name: string;
  url?: string;
  description?: string;
  content?: string;
}

export interface TaskRequest {
  id: string;
  created_at: string;
  updated_at: string;
  submitted_by_email: string;
  submitted_by_name: string | null;
  project: string;
  title: string;
  request: string;
  context: string | null;
  files: RequestAttachment[];
  type: RequestType;
  complexity_score: number | null;
  criticality_score: number | null;
  urgency_score: number | null;
  complexity_reason: string | null;
  criticality_reason: string | null;
  urgency_reason: string | null;
  safety_notes: string | null;
  digest: string | null;
  status: RequestStatus;
  response: string | null;
  response_at: string | null;
  responded_by_email: string | null;
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "À traiter",
  in_progress: "En cours",
  completed: "Traitée",
  rejected: "Refusée",
  info_provided: "Info fournie",
};

export const TYPE_LABELS: Record<RequestType, string> = {
  feature: "Évolution",
  bug: "Bug",
  question: "Question",
  info: "Info",
};
