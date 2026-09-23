"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBlockedUsers, useDeleteAccount, useUnblockUser } from "@/hooks/useUsers";
import { ApiClientError } from "@/lib/apiClient";

export default function ParametresPage() {
  const router = useRouter();
  const { data: blockedData, isLoading: blockedLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const deleteAccount = useDeleteAccount();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const blockedUsers = blockedData?.blockedUsers ?? [];

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteAccount.mutateAsync();
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <div>
      <TopAppBar title="Confidentialité et compte" showBack />

      <main className="mx-auto max-w-md space-y-8 px-container-padding-mobile pt-6 pb-12">
        <section className="space-y-4">
          <h2 className="px-1 font-label-md text-label-sm uppercase tracking-widest text-outline">
            Utilisateurs bloqués
          </h2>
          {blockedLoading && (
            <p aria-live="polite" className="font-body-md text-body-md text-on-surface-variant">
              Chargement…
            </p>
          )}
          {!blockedLoading && blockedUsers.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Vous n&apos;avez bloqué personne. Un utilisateur bloqué ne peut plus vous contacter ni voir vos
              trajets/demandes, et vous ne verrez plus les siens.
            </p>
          )}
          <div className="space-y-3">
            {blockedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-soft-glow">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface-container">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={user.firstName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
                        {user.firstName[0]}
                      </div>
                    )}
                  </div>
                  <span className="font-label-md text-label-md">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <Button variant="outline" size="md" onClick={() => unblockUser.mutate(user.id)} loading={unblockUser.isPending}>
                  Débloquer
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="px-1 font-label-md text-label-sm uppercase tracking-widest text-outline">
            Confidentialité
          </h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-soft-glow">
            <Link href="/confidentialite" className="flex items-center justify-between p-4 hover:bg-surface-container-low">
              <span className="font-body-md text-body-md">Politique de confidentialité</span>
              <Icon name="chevron_right" className="text-outline-variant" />
            </Link>
            <div className="mx-4 h-[1px] bg-outline-variant/30" />
            <Link href="/conditions" className="flex items-center justify-between p-4 hover:bg-surface-container-low">
              <span className="font-body-md text-body-md">Conditions générales</span>
              <Icon name="chevron_right" className="text-outline-variant" />
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="px-1 font-label-md text-label-sm uppercase tracking-widest text-error">Zone dangereuse</h2>
          <div className="rounded-xl border border-error/20 bg-error-container/30 p-5">
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
              La suppression de votre compte est définitive : votre profil, votre photo et vos documents d&apos;identité
              seront effacés. Vos réservations en cours seront annulées. Par exigence légale, l&apos;historique de vos
              transactions passées reste visible pour vos anciennes contreparties, sous une identité anonymisée.
            </p>

            {!confirmOpen ? (
              <Button variant="danger" fullWidth onClick={() => setConfirmOpen(true)}>
                Supprimer mon compte
              </Button>
            ) : (
              <div className="space-y-3">
                <label className="block font-label-md text-label-md text-on-surface">
                  Tapez SUPPRIMER pour confirmer
                </label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full rounded-xl border border-error/40 bg-white p-3 font-body-md text-body-md focus:border-error focus:outline-none"
                  placeholder="SUPPRIMER"
                />
                {deleteError && (
                  <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">
                    {deleteError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" fullWidth onClick={() => setConfirmOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    disabled={confirmText !== "SUPPRIMER"}
                    loading={deleteAccount.isPending}
                    onClick={handleDelete}
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
