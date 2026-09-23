import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { env } from "@/config/env";

export const isS3Configured = Boolean(
  env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY && env.S3_PUBLIC_URL,
);

const s3 = isS3Configured
  ? new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
    })
  : null;

export const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!isS3Configured) {
  for (const sub of ["avatars", "documents", "proofs"]) {
    fs.mkdirSync(path.join(uploadRoot, sub), { recursive: true });
  }
}

/**
 * Écrit un fichier sous `subdir/filename`, sur S3 (Cloudflare R2 etc.) si configuré, sinon sur le
 * disque local. `key` est le chemin relatif stable (ex: "avatars/abc123.webp"), utilisé aussi bien
 * pour construire l'URL publique que pour la suppression/relecture ultérieure.
 */
export async function writeFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (s3) {
    await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
    return;
  }
  fs.writeFileSync(path.join(uploadRoot, key), buffer);
}

/** URL directement accessible publiquement — uniquement pour les fichiers publics (avatars, preuves de livraison). */
export function publicUrl(key: string): string {
  if (isS3Configured) return `${env.S3_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  return `/uploads/${key}`;
}

/** Relit un fichier privé (documents KYC) pour le streamer depuis une route authentifiée — jamais exposé via une URL publique. */
export async function readFile(key: string): Promise<{ stream: NodeJS.ReadableStream } | { filePath: string }> {
  if (s3) {
    const res: GetObjectCommandOutput = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    return { stream: res.Body as NodeJS.ReadableStream };
  }
  return { filePath: path.join(uploadRoot, key) };
}

export async function deleteFile(key: string): Promise<void> {
  if (s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key })).catch(() => {
      // best-effort : un fichier déjà absent ne doit pas faire échouer la suppression de compte
    });
    return;
  }
  fs.rm(path.join(uploadRoot, key), { force: true }, () => {});
}

/** Extrait la clé de stockage relative à partir d'une URL persistée (locale `/uploads/...` ou publique S3). */
export function keyFromUrl(fileUrl: string): string {
  if (isS3Configured && env.S3_PUBLIC_URL && fileUrl.startsWith(env.S3_PUBLIC_URL)) {
    return fileUrl.slice(env.S3_PUBLIC_URL.replace(/\/$/, "").length + 1);
  }
  return fileUrl.replace(/^\/uploads\//, "");
}
