import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { HttpError } from "./auth";
function client() {
  if (
    !process.env.S3_BUCKET ||
    !process.env.MEDIA_PUBLIC_URL ||
    !process.env.S3_ACCESS_KEY_ID ||
    !process.env.S3_SECRET_ACCESS_KEY
  )
    throw new HttpError(
      503,
      "Configure durable S3-compatible media storage before uploading. You can still register an HTTPS image URL.",
    );
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
}
export async function putObject(key: string, body: Buffer, mime: string) {
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: mime,
      CacheControl: "public,max-age=31536000,immutable",
    }),
  );
  const base = process.env.MEDIA_PUBLIC_URL!;
  if (!base.startsWith("https://"))
    throw new HttpError(500, "Media public URL must use HTTPS.");
  return base.replace(/\/$/, "") + "/" + key;
}
export async function removeObject(key: string) {
  await client().send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
}
