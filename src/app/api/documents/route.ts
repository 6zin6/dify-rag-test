import { listDocuments, uploadDocument } from "@/lib/dify";
import { DEFAULT_DEPARTMENT_ID, isDepartmentId } from "@/lib/departments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const department = searchParams.get("department") ?? DEFAULT_DEPARTMENT_ID;

  if (!Number.isInteger(page) || page < 1) {
    return Response.json({ error: "page must be a positive integer" }, { status: 400 });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return Response.json({ error: "limit must be between 1 and 100" }, { status: 400 });
  }
  if (!isDepartmentId(department)) {
    return Response.json({ error: "Invalid department" }, { status: 400 });
  }

  try {
    const result = await listDocuments(page, limit, department);
    return Response.json(result);
  } catch (err) {
    console.error("[/api/documents GET] failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to retrieve documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file field is required" }, { status: 400 });
  }

  const department =
    (formData.get("department") as string | null) ?? DEFAULT_DEPARTMENT_ID;
  if (!isDepartmentId(department)) {
    return Response.json({ error: "Invalid department" }, { status: 400 });
  }

  try {
    const result = await uploadDocument(file, file.name, department);
    return Response.json(result);
  } catch (err) {
    console.error("[/api/documents POST] failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to upload document" },
      { status: 500 }
    );
  }
}
