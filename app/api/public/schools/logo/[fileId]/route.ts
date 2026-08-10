import { NextRequest, NextResponse } from "next/server";
import { downloadFileFromDrive } from "@/app/lib/googleDrive";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId) {
    return NextResponse.json(
      { error: "File ID is required" },
      { status: 400 }
    );
  }

  try {
    const { stream, fileName, mimeType } = await downloadFileFromDrive(fileId);

    // Create response with streaming
    const response = new NextResponse(stream as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "public, max-age=604800", // Cache for 7 days
      },
    });

    return response;
  } catch (error: any) {
    console.error("Error downloading school logo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download logo" },
      { status: 500 }
    );
  }
}
