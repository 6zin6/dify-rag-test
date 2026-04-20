/**
 * Chat API streaming test
 * Usage: npx tsx scripts/test-api-chat.ts
 * (requires: npm run dev in another terminal)
 */

async function main() {
  const url = "http://localhost:3000/api/chat";
  const body = { message: "有給休暇はいつから取れますか？" };

  console.log(`POST ${url}`);
  console.log(`Body: ${JSON.stringify(body)}\n`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Connection failed. Is `npm run dev` running?");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  if (!res.body) {
    console.error("Empty response body");
    process.exit(1);
  }

  // -------------------------------------------------------------------
  // SSE stream parsing
  // Each chunk from Dify looks like:  data: {"event":"message","answer":"こ",...}\n\n
  // -------------------------------------------------------------------
  const decoder = new TextDecoder();
  let buffer = "";
  let conversationId: string | null = null;
  let answer = "";

  console.log("--- streaming response ---");

  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });

    // SSE messages are separated by "\n\n"
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue;

        const json = line.slice("data: ".length).trim();
        if (json === "[DONE]") continue;

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(json) as Record<string, unknown>;
        } catch {
          continue;
        }

        if (event.event === "message" && typeof event.answer === "string") {
          process.stdout.write(event.answer);
          answer += event.answer;

          if (typeof event.conversation_id === "string") {
            conversationId = event.conversation_id;
          }
        }

        if (event.event === "message_end") {
          if (typeof event.conversation_id === "string") {
            conversationId = event.conversation_id;
          }
        }

        if (event.event === "error") {
          console.error(`\nDify error: ${event.message ?? JSON.stringify(event)}`);
        }
      }
    }
  }

  console.log("\n--- end of stream ---\n");
  console.log(`conversation_id : ${conversationId ?? "(not received)"}`);
  console.log(`answer length   : ${answer.length} chars`);
}

main().catch((err) => {
  console.error("Unexpected error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
