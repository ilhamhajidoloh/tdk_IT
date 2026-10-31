import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

let s3ClientInstance: S3Client | null = null;

export function getOracleStorageConfig() {
  const region = process.env.OCI_STORAGE_REGION || process.env.OCI_REGION || "ap-singapore-1";
  const namespace = process.env.OCI_STORAGE_NAMESPACE || process.env.OCI_NAMESPACE || "";
  const endpoint =
    process.env.OCI_STORAGE_ENDPOINT ||
    (namespace ? `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com` : undefined);
  const accessKeyId = process.env.OCI_STORAGE_ACCESS_KEY || process.env.OCI_ACCESS_KEY;
  const secretAccessKey = process.env.OCI_STORAGE_SECRET_KEY || process.env.OCI_SECRET_KEY;
  const bucketName =
    process.env.OCI_STORAGE_BUCKET_NAME || process.env.OCI_BUCKET_NAME || "mylife-storage";

  return {
    endpoint,
    region,
    namespace,
    accessKeyId,
    secretAccessKey,
    bucketName,
    isConfigured: Boolean(endpoint && accessKeyId && secretAccessKey && bucketName),
  };
}

export function getOracleS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const { endpoint, region, accessKeyId, secretAccessKey, isConfigured } = getOracleStorageConfig();

  if (!isConfigured) {
    throw new Error(
      "Oracle Object Storage is not configured. Please set OCI_STORAGE_ENDPOINT, OCI_STORAGE_ACCESS_KEY, OCI_STORAGE_SECRET_KEY, and OCI_STORAGE_BUCKET_NAME in .env.local"
    );
  }

  s3ClientInstance = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    forcePathStyle: true,
  });

  return s3ClientInstance;
}

export async function uploadSignatureToOracle(
  buffer: Buffer,
  key: string,
  contentType: string = "image/png"
): Promise<{ key: string; bucket: string }> {
  const { bucketName } = getOracleStorageConfig();
  const s3 = getOracleS3Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=86400",
  });

  await s3.send(command);
  return { key, bucket: bucketName };
}

export async function getSignatureFromOracle(key: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  const { bucketName } = getOracleStorageConfig();
  const s3 = getOracleS3Client();

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3.send(command);
    if (!response.Body) return null;

    const stream = response.Body as unknown as AsyncIterable<Uint8Array>;
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const contentType = response.ContentType || "image/png";

    return { buffer, contentType };
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function deleteSignatureFromOracle(key: string): Promise<void> {
  const { bucketName } = getOracleStorageConfig();
  const s3 = getOracleS3Client();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3.send(command);
}

