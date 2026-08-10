import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

function getDriveClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
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
): Promise<string | null> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_SCHOOL_LOGOS_FOLDER_ID;

  if (!drive || !folderId) {
    return null;
  }

  const timestamp = Date.now();
  const sanitized = sanitizeFileName(fileName);
  const uniqueFileName = `request_logo_${timestamp}_${sanitized}`;

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

  return response.data.id || null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพ" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "ประเภทไฟล์ไม่รองรับ (เฉพาะ JPG, PNG, WebP, SVG)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let fileId: string | null = null;

    try {
      fileId = await uploadLogoToDrive(buffer, file.name, file.type);
    } catch (err) {
      console.warn("Google Drive upload failed, fallback to Data URL:", err);
    }

    let logoUrl: string;
    if (fileId) {
      logoUrl = `/api/public/schools/logo/${fileId}`;
    } else {
      // Fallback to Data URL for environments without Drive config
      const base64 = buffer.toString("base64");
      logoUrl = `data:${file.type};base64,${base64}`;
    }

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
    console.error("Error uploading logo request:", error);
    return NextResponse.json(
      { error: error.message || "ไม่สามารถอัปโหลดโลโก้ได้" },
      { status: 500 }
    );
  }
}
