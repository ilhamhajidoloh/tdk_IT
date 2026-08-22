import { NextRequest, NextResponse } from "next/server";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { google } from "googleapis";
import { Readable } from "stream";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (Vercel limit)

function getDriveClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, or GOOGLE_DRIVE_REFRESH_TOKEN"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 100);
}

async function uploadLogoToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_SCHOOL_LOGOS_FOLDER_ID;

  if (!folderId) {
    throw new Error("Missing GOOGLE_DRIVE_SCHOOL_LOGOS_FOLDER_ID");
  }

  const timestamp = Date.now();
  const sanitized = sanitizeFileName(fileName);
  const uniqueFileName = `school_logo_${timestamp}_${sanitized}`;

  const response = await drive.files.create({
    requestBody: {
      name: uniqueFileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: "id, name, mimeType, size",
    supportsAllDrives: true,
  });

  if (!response.data.id) {
    throw new Error("Failed to get file ID from Google Drive");
  }

  return response.data.id;
}

export async function POST(req: NextRequest) {
  const context = await getSchoolContext(req);
  if (!context || !context.isSuperAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin only" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 4MB` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WebP, and SVG are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = await uploadLogoToDrive(buffer, file.name, file.type);

    const logoUrl = `/api/public/schools/logo/${fileId}`;
    return NextResponse.json({
      success: true,
      fileId,
      url: logoUrl,
      logo_url: logoUrl,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error uploading school logo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload logo" },
      { status: 500 }
    );
  }
}
