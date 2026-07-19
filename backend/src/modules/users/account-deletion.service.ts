import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/password";
import { deleteUploadedFile } from "@/modules/uploads/upload.middleware";

const ACTIVE_TRIP_STATUSES = ["ACTIVE"] as const;
const ACTIVE_REQUEST_STATUSES = ["OPEN", "MATCHED"] as const;
const ACTIVE_BOOKING_STATUSES = ["PENDING", "ACCEPTED", "PICKED_UP", "IN_TRANSIT"] as const;

/**
 * Suppression de compte = anonymisation, pas de hard delete : Booking/Review/Message/Report
 * référencent User sans onDelete: Cascade (l'historique des contreparties doit rester cohérent,
 * comme chez tout marketplace type Uber/Airbnb). Exigé par les politiques Apple (5.1.1v) et
 * Google Play (suppression de compte 2023).
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const documents = await prisma.verificationDocument.findMany({ where: { userId } });

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Mot de passe remplacé par un hash aléatoire inutilisable : aucune connexion possible même
    // en cas de fuite, sans dépendre uniquement du flag deletedAt.
    const unusablePasswordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));

    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@colismonde.invalid`,
        passwordHash: unusablePasswordHash,
        phone: null,
        firstName: "Utilisateur",
        lastName: "Supprimé",
        avatarUrl: null,
        bio: null,
        country: null,
        city: null,
        isVerified: false,
        deletedAt: new Date(),
      },
    });

    await tx.verificationDocument.deleteMany({ where: { userId } });

    await tx.trip.updateMany({
      where: { travelerId: userId, status: { in: [...ACTIVE_TRIP_STATUSES] } },
      data: { status: "CANCELLED" },
    });
    await tx.packageRequest.updateMany({
      where: { senderId: userId, status: { in: [...ACTIVE_REQUEST_STATUSES] } },
      data: { status: "CANCELLED" },
    });
    await tx.booking.updateMany({
      where: {
        OR: [{ senderId: userId }, { travelerId: userId }],
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
      },
      data: { status: "CANCELLED" },
    });
  });

  // Suppression des fichiers d'identité sur disque (hors transaction — I/O fichier, best-effort).
  for (const doc of documents) {
    deleteUploadedFile(doc.fileUrl);
  }
}
