import crypto from "node:crypto";
import multer from "multer";
import sharp from "sharp";
import type { NextFunction, Request, Response } from "express";
import { env } from "@/config/env";
import { ApiError } from "@/utils/apiError";
import { deleteFile, keyFromUrl, publicUrl, writeFile } from "@/lib/storage";

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOCUMENT_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/**
 * Stockage en mémoire : on ne touche jamais le disque/S3 avec le fichier tel qu'envoyé par le
 * client. Les images sont ré-encodées via sharp (utils below) avant écriture, ce qui neutralise
 * les fichiers "polyglots" (ex: JS/HTML caché dans un JPEG) et supprime les métadonnées EXIF.
 */
const memoryStorage = multer.memoryStorage();

function fileFilterFor(allowlist: Set<string>) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!allowlist.has(file.mimetype)) {
      cb(new ApiError(400, "INVALID_FILE_TYPE", `Type de fichier non autorisé : ${file.mimetype}`));
      return;
    }
    cb(null, true);
  };
}

const limits = { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 1 };

export const uploadAvatar = multer({ storage: memoryStorage, fileFilter: fileFilterFor(ALLOWED_IMAGE_MIME), limits }).single(
  "avatar",
);

export const uploadDocument = multer({
  storage: memoryStorage,
  fileFilter: fileFilterFor(ALLOWED_DOCUMENT_MIME),
  limits,
}).single("document");

export const uploadProof = multer({ storage: memoryStorage, fileFilter: fileFilterFor(ALLOWED_IMAGE_MIME), limits }).single(
  "photo",
);

/**
 * Persiste le buffer en mémoire (disque local ou S3-compatible selon la config, cf. lib/storage.ts) :
 * - nom de fichier entièrement aléatoire (aucune donnée utilisateur dans le chemin)
 * - images ré-encodées via sharp (strip EXIF, format normalisé, dimensions plafonnées)
 * - PDF simplement vérifiés par en-tête magique avant écriture telle quelle
 *
 * Retourne une URL directement utilisable pour "avatars"/"proofs" (fichiers publics), ou la clé de
 * stockage brute pour "documents" (privés — jamais exposés via une URL directe, cf. la route
 * GET /me/documents/:docId/file qui les relit et les streame de façon authentifiée).
 */
export async function persistUploadedFile(
  file: Express.Multer.File,
  subdir: "avatars" | "documents" | "proofs",
): Promise<string> {
  const randomName = crypto.randomBytes(24).toString("hex");
  const isPrivate = subdir === "documents";

  if (file.mimetype === "application/pdf") {
    if (!file.buffer.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
      throw ApiError.badRequest("Fichier PDF invalide");
    }
    const key = `${subdir}/${randomName}.pdf`;
    await writeFile(key, file.buffer, "application/pdf");
    return isPrivate ? key : publicUrl(key);
  }

  const key = `${subdir}/${randomName}.webp`;
  let processed: Buffer;
  let info: sharp.OutputInfo;
  try {
    const result = await sharp(file.buffer)
      .rotate() // applique l'orientation EXIF puis la supprime
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    processed = result.data;
    info = result.info;
  } catch {
    // Le mimetype déclaré par le client ne garantit rien sur le contenu réel du fichier :
    // un buffer qui n'est pas une image valide (mime usurpé) fait échouer le décodage sharp.
    throw ApiError.badRequest("Fichier image invalide ou corrompu");
  }

  if (info.width === 0 || info.height === 0) {
    throw ApiError.badRequest("Image invalide ou corrompue");
  }

  await writeFile(key, processed, "image/webp");
  return isPrivate ? key : publicUrl(key);
}

/** Supprime un fichier précédemment persisté par `persistUploadedFile` (ex: purge RGPD). Accepte une URL publique ou une clé brute. */
export function deleteUploadedFile(fileUrlOrKey: string): void {
  void deleteFile(keyFromUrl(fileUrlOrKey));
}

export function handleUploadErrors(err: unknown, _req: Request, _res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(ApiError.badRequest(`Fichier trop volumineux (max ${env.MAX_UPLOAD_SIZE_MB}MB)`));
    }
    return next(ApiError.badRequest(err.message));
  }
  next(err);
}
