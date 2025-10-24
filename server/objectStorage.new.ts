import { Storage } from "@google-cloud/storage";

// Google Cloud Storage client configuration
export const objectStorageClient = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

// Optional: if your app uses a bucket variable
export const bucket = objectStorageClient.bucket(process.env.BUCKET_NAME || "quetama-storage");

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}
