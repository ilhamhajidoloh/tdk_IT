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

/**
 * Uploads a file to the configured Google Drive folder.
 * Returns the Google Drive File ID.
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
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
}

/**
 * Deletes a file from Google Drive by its file ID.
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  try {
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
}
