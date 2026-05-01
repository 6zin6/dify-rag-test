import { sendChatMessageStream } from "@/lib/dify";
import { DEFAULT_DEPARTMENT_ID, isDepartmentId } from "@/lib/departments";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).message !== "string" ||
    !(body as Record<string, unknown>).message
  ) {
    return Response.json(
      { error: "message field is required" },
      { status: 400 }
    );
  }

  const { message, conversationId, user, department } = body as {
    message: string;
    conversationId?: string;
    user?: string;
    department?: string;
  };

  const departmentId = department ?? DEFAULT_DEPARTMENT_ID;
  if (!isDepartmentId(departmentId)) {
    return Response.json(
      { error: "Invalid department" },
      { status: 400 }
    );
  }

  try {
    const stream = await sendChatMessageStream(
      {
        query: message,
        user: user ?? "anonymous",
        conversationId,
      },
      departmentId
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[/api/chat POST] failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to communicate with the AI service" },
      { status: 500 }
    );
  }
}
