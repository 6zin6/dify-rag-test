import { listDocuments, uploadDocument } from "@/lib/dify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  if (!Number.isInteger(page) || page < 1) {
    return Response.json({ error: "page must be a positive integer" }, { status: 400 });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return Response.json({ error: "limit must be between 1 and 100" }, { status: 400 });
  }

  try {
    const result = await listDocuments(page, limit);
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "Failed to retrieve documents" },
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

  try {
    const result = await uploadDocument(file, file.name);
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
