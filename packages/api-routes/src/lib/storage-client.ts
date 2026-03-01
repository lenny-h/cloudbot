import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 Storage client.
 *
 * - Direct operations (download, upload, delete) use the R2 bucket binding.
 * - Signed URL generation uses the S3-compatible API with credentials,
 *   since R2 bindings do not support presigning.
 */
export class StorageClient {
  // ── Signed URL operations (S3-compatible API) ──────────────────────

  private static s3Client: S3Client | null = null;

  private static getS3Client(): S3Client {
    if (!StorageClient.s3Client) {
      const endpoint = process.env.R2_ENDPOINT;
      const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
      const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;

      if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error(
          "R2_ENDPOINT, CLOUDFLARE_ACCESS_KEY_ID, and CLOUDFLARE_SECRET_ACCESS_KEY environment variables are required for signed URLs",
        );
      }

      StorageClient.s3Client = new S3Client({
        region: "auto",
        endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey },
      });
    }

    return StorageClient.s3Client;
  }

  static async getSignedUrlForUpload({
    bucket,
    key,
    contentType,
    contentLength,
  }: {
    bucket: string;
    key: string;
    contentType: string;
    contentLength: number;
  }): Promise<{ url: string }> {
    const s3Client = StorageClient.getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 65 });
    return { url: signedUrl };
  }

  static async getSignedUrlForDownload({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<string> {
    const s3Client = StorageClient.getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(s3Client, command, {
      expiresIn: 180 * 60, // 3 hours
    });
  }
}
