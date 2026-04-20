import { deleteDocument } from "@/lib/dify";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/documents/[documentId]">
) {
  const { documentId } = await ctx.params;

  try {
    await deleteDocument(documentId);
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
