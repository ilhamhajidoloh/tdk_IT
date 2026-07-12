import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { downloadFileFromDrive } from "@/app/lib/googleDrive";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. Fetch attachment metadata from DB
    const res = await pool.query(
      "SELECT drive_file_id, file_name, mime_type FROM book_attachments WHERE id = $1",
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const { drive_file_id, file_name, mime_type } = res.rows[0];

    // 2. Fetch the stream from Google Drive
    const { stream } = await downloadFileFromDrive(drive_file_id);

    // 3. Convert Node.js stream to Web ReadableStream for Next.js response
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        stream.on("end", () => {
          controller.close();
        });
        stream.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    const headers = new Headers();
    // Encode filename for UTF-8 support in Content-Disposition header
    const encodedFileName = encodeURIComponent(file_name);
    headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodedFileName}`);
    headers.set("Content-Type", mime_type);

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    console.error(`Error downloading file attachment ${id}:`, error);
    return NextResponse.json({ error: error?.message || "Failed to download file" }, { status: 500 });
  }
}
