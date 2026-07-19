import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import sharp from "sharp";
import type { NextFunction, Request, Response } from "express";
import { env } from "@/config/env";
import { ApiError } from "@/utils/apiError";

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOCUMENT_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
for (const sub of ["avatars", "documents", "proofs"]) {
  fs.mkdirSync(path.join(uploadRoot, sub), { recursive: true });
}

/**
 * Stockage en mémoire : on ne touche jamais le disque avec le fichier tel qu'envoyé par le client.
 * Les images sont ré-encodées via sharp (utils below) avant écriture, ce qui neutralise les
 * fichiers "polyglots" (ex: JS/HTML caché dans un JPEG) et supprime les métadonnées EXIF.
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
 * Persiste le buffer en mémoire sur disque de façon sécurisée :
 * - nom de fichier entièrement aléatoire (aucune donnée utilisateur dans le chemin)
 * - images ré-encodées via sharp (strip EXIF, format normalisé, dimensions plafonnées)
 * - PDF simplement vérifiés par en-tête magique avant écriture telle quelle
 */
export async function persistUploadedFile(
  file: Express.Multer.File,
  subdir: "avatars" | "documents" | "proofs",
): Promise<string> {
  const randomName = crypto.randomBytes(24).toString("hex");
  const destDir = path.join(uploadRoot, subdir);

  if (file.mimetype === "application/pdf") {
    if (!file.buffer.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
      throw ApiError.badRequest("Fichier PDF invalide");
    }
    const filename = `${randomName}.pdf`;
    fs.writeFileSync(path.join(destDir, filename), file.buffer);
    return `/uploads/${subdir}/${filename}`;
  }

  const filename = `${randomName}.webp`;
  let processed: sharp.OutputInfo;
  try {
    processed = await sharp(file.buffer)
      .rotate() // applique l'orientation EXIF puis la supprime
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(destDir, filename));
  } catch {
    // Le mimetype déclaré par le client ne garantit rien sur le contenu réel du fichier :
    // un buffer qui n'est pas une image valide (mime usurpé) fait échouer le décodage sharp.
    throw ApiError.badRequest("Fichier image invalide ou corrompu");
  }

  if (processed.width === 0 || processed.height === 0) {
    throw ApiError.badRequest("Image invalide ou corrompue");
  }

  return `/uploads/${subdir}/${filename}`;
}

/** Supprime un fichier précédemment persisté par `persistUploadedFile` (ex: purge RGPD). */
export function deleteUploadedFile(fileUrl: string): void {
  const filePath = path.join(uploadRoot, fileUrl.replace(/^\/uploads\//, ""));
  if (!filePath.startsWith(uploadRoot)) return;
  fs.rm(filePath, { force: true }, () => {
    // best-effort : un fichier déjà absent ne doit pas faire échouer la suppression de compte
  });
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
