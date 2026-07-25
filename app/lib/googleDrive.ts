import { google } from "googleapis";
import { Readable } from "stream";

function getDriveClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, or GOOGLE_DRIVE_REFRESH_TOKEN in environment variables."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

function handleDriveError(error: any): never {
  const errStr = typeof error === "object" ? JSON.stringify(error) : String(error);
  if (errStr.includes("invalid_grant") || error?.message?.includes("invalid_grant")) {
    throw new Error(
      "Google Drive Token Expired (invalid_grant): Refresh Token หมดอายุหรือถูกยกเลิกสิทธิ์ กรุณาออก GOOGLE_DRIVE_REFRESH_TOKEN ใหม่"
    );
  }
  throw error;
}

/**
 * Uploads a file to the configured Google Drive folder.
 * Returns the Google Drive File ID.
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const requestBody: any = {
      name: fileName,
    };

    if (folderId) {
      requestBody.parents = [folderId];
    }

    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: "id",
      supportsAllDrives: true,
    });

    if (!response.data.id) {
      throw new Error("Failed to get file ID from Google Drive upload response");
    }

    return response.data.id;
  } catch (error: any) {
    handleDriveError(error);
  }
}

/**
 * Deletes a file from Google Drive by its file ID.
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ 
      fileId,
      supportsAllDrives: true
    });
  } catch (error: any) {
    console.error(`Error deleting file ${fileId} from Google Drive:`, error?.message || error);
    // Don't crash if file was already deleted or doesn't exist
  }
}

/**
 * Downloads a file from Google Drive as a Readable stream.
 */
export async function downloadFileFromDrive(fileId: string) {
  try {
    const drive = getDriveClient();

    // Get file metadata to check mimeType and name
    const metadata = await drive.files.get({
      fileId,
      fields: "name, mimeType",
      supportsAllDrives: true,
    });

    const response = await drive.files.get(
      { 
        fileId, 
        alt: "media",
        supportsAllDrives: true
      },
      { responseType: "stream" }
    );

    return {
      stream: response.data as Readable,
      fileName: metadata.data.name || "file",
      mimeType: metadata.data.mimeType || "application/octet-stream",
    };
  } catch (error: any) {
    handleDriveError(error);
  }
}

