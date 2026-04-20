// ============================================================
// Types
// ============================================================

export interface ChatRequest {
  query: string;
  user: string;
  conversationId?: string;
}

/** SSE event emitted by Dify during streaming */
export interface ChatMessageEvent {
  event: "message" | "message_end" | "error" | "ping";
  task_id?: string;
  id?: string;
  message_id?: string;
  conversation_id?: string;
  /** Incremental answer text (event: "message") */
  answer?: string;
  /** Error message (event: "error") */
  message?: string;
  code?: string;
  status?: number;
  created_at?: number;
}

export interface Document {
  id: string;
  position: number;
  data_source_type: string;
  name: string;
  indexing_status: string;
  tokens: number;
  word_count: number;
  doc_form: "text_model" | "hierarchical_model" | "qa_model";
  enabled: boolean;
  archived: boolean;
  created_at: number;
  error?: string;
  display_status?: string;
  hit_count?: number;
}

export interface DocumentListResponse {
  data: Document[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

// ============================================================
// Internal helpers
// ============================================================

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable "${name}" is not set. ` +
        "Please add it to your .env.local file."
    );
  }
  return value;
}

async function handleErrorResponse(res: Response): Promise<never> {
  let body = "";
  try {
    body = await res.text();
  } catch {
    // ignore body read error
  }
  throw new Error(
    `Dify API error: ${res.status} ${res.statusText}` +
      (body ? `\n${body}` : "")
  );
}

// ============================================================
// 1. Chat (streaming)
// ============================================================

/**
 * Sends a chat message to Dify and returns a ReadableStream of the raw SSE bytes.
 * Intended to be piped directly through a Next.js API Route.
 */
export async function sendChatMessageStream(
  request: ChatRequest
): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = getEnv("DIFY_API_BASE_URL");
  const apiKey = getEnv("DIFY_APP_API_KEY");

  const body: Record<string, unknown> = {
    query: request.query,
    user: request.user,
    response_mode: "streaming",
    inputs: {},
  };

  if (request.conversationId) {
    body.conversation_id = request.conversationId;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  if (!res.body) {
    throw new Error("Dify API returned an empty response body.");
  }

  return res.body;
}

// ============================================================
// 2. Document upload
// ============================================================

/**
 * Uploads a document file to the Dify knowledge base.
 */
export async function uploadDocument(
  file: File | Blob,
  fileName: string
): Promise<{ document: Document; batch: string }> {
  const baseUrl = getEnv("DIFY_API_BASE_URL");
  const apiKey = getEnv("DIFY_KNOWLEDGE_API_KEY");
  const datasetId = getEnv("DIFY_DATASET_ID");

  const form = new FormData();
  form.append("file", file, fileName);
  // Minimum required config; indexing_technique defaults to "economy" on Dify cloud
  form.append(
    "data",
    JSON.stringify({
      indexing_technique: "high_quality",
      process_rule: { mode: "automatic" },
    })
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(
      `${baseUrl}/datasets/${datasetId}/document/create-by-file`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  return res.json() as Promise<{ document: Document; batch: string }>;
}

// ============================================================
// 3. Document list
// ============================================================

/**
 * Retrieves the list of documents in the knowledge base.
 */
export async function listDocuments(
  page = 1,
  limit = 20
): Promise<DocumentListResponse> {
  const baseUrl = getEnv("DIFY_API_BASE_URL");
  const apiKey = getEnv("DIFY_KNOWLEDGE_API_KEY");
  const datasetId = getEnv("DIFY_DATASET_ID");

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(
      `${baseUrl}/datasets/${datasetId}/documents?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  return res.json() as Promise<DocumentListResponse>;
}

// ============================================================
// 4. Document delete
// ============================================================

/**
 * Deletes a document from the knowledge base by its ID.
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const baseUrl = getEnv("DIFY_API_BASE_URL");
  const apiKey = getEnv("DIFY_KNOWLEDGE_API_KEY");
  const datasetId = getEnv("DIFY_DATASET_ID");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(
      `${baseUrl}/datasets/${datasetId}/documents/${documentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // 204 No Content is the success response; no body to parse
  if (!res.ok) {
    await handleErrorResponse(res);
  }
}
