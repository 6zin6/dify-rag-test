import { sendChatMessageStream } from "@/lib/dify";

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

  const { message, conversationId, user } = body as {
    message: string;
    conversationId?: string;
    user?: string;
  };

  try {
    const stream = await sendChatMessageStream({
      query: message,
      user: user ?? "anonymous",
      conversationId,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to communicate with the AI service" },
      { status: 500 }
    );
  }
}
