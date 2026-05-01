import { deleteDocument } from "@/lib/dify";
import { DEFAULT_DEPARTMENT_ID, isDepartmentId } from "@/lib/departments";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/documents/[documentId]">
) {
  const { documentId } = await ctx.params;

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department") ?? DEFAULT_DEPARTMENT_ID;
  if (!isDepartmentId(department)) {
    return Response.json({ error: "Invalid department" }, { status: 400 });
  }

  try {
    await deleteDocument(documentId, department);
    return Response.json({ success: true });
  } catch (err) {
    console.error("[/api/documents/:id DELETE] failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to delete document" },
      { status: 500 }
    );
  }
}
