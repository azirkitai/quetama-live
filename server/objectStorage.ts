import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

export const objectStorageClient = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

export const bucket = objectStorageClient.bucket(process.env.BUCKET_NAME || "quetama-storage");

export class ObjectStorageService {
  async getUploadUrl(fileName: string, contentType: string) {
    const file = bucket.file(`${process.env.PRIVATE_OBJECT_DIR || "uploads"}/${fileName}`);
    const options = {
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 min
      contentType,
    };
    const [url] = await file.getSignedUrl(options);
    return url;
  }

  async downloadObject(file: File, res: Response) {
    const [metadata] = await file.getMetadata();
    res.set({
      "Content-Type": metadata.contentType || "application/octet-stream",
      "Content-Length": metadata.size,
      "Cache-Control": "public, max-age=3600",
    });
    file.createReadStream().pipe(res);
  }
}
