// @ts-expect-error heic-convert does not ship with TypeScript declarations
import convertHeic from "heic-convert";

export const ALLOWED_IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

export function isHeicFile(buffer: Buffer, fileName?: string, mimeType?: string): boolean {
  if (mimeType && (mimeType.includes("heic") || mimeType.includes("heif"))) {
    return true;
  }
  if (fileName) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".heic") || lower.endsWith(".heif")) {
      return true;
    }
  }
  // Check ISO base media file format brand
  if (buffer.length >= 12) {
    const brand = buffer.toString("ascii", 4, 12);
    if (
      brand.includes("ftyp") &&
      (brand.includes("hei") || brand.includes("mif1") || brand.includes("msf1"))
    ) {
      return true;
    }
  }
  return false;
}

export async function processSignatureImage(
  buffer: Buffer,
  fileName?: string,
  mimeType?: string
): Promise<{ buffer: Buffer; contentType: string }> {
  if (isHeicFile(buffer, fileName, mimeType)) {
    try {
      const converted = await convertHeic({
        buffer,
        format: "PNG",
      });
      return {
        buffer: Buffer.from(converted),
        contentType: "image/png",
      };
    } catch (err) {
      console.error("Error converting HEIC file from iOS/iPad:", err);
      throw new Error(
        "ไม่สามารถแปลงไฟล์ HEIC จาก iPhone/iPad ได้ กรุณาบันทึกเป็น PNG หรือ JPEG แล้วลองอีกครั้ง"
      );
    }
  }

  const cleanMime =
    mimeType && ALLOWED_IMAGE_MIMES.includes(mimeType) ? mimeType : "image/png";

  return {
    buffer,
    contentType: cleanMime,
  };
}

