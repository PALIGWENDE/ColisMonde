"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { useDeleteAccount } from "@/hooks/useUsers";
import { ApiClientError } from "@/lib/apiClient";

/**
 * Page publique, accessible sans être connecté (exigence explicite de la politique de suppression
 * de compte de Google Play : un chemin doit être disponible même sans installer/ouvrir l'app).
 * Si une session valide est détectée, propose directement la suppression ; sinon, explique la
 * marche à suivre.
 */
export default function SuppressionComptePage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const deleteAccount = useDeleteAccount();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface px-container-padding-mobile py-4 shadow-soft-glow">
        <Link href="/" className="text-primary" aria-label="Retour à l'accueil">
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Suppression de compte</h1>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-container-padding-mobile py-8">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Vous pouvez demander la suppression définitive de votre compte ColisMonde et de vos données personnelles à
          tout moment, directement depuis cette page ou depuis l&apos;application (Profil → Confidentialité et
          compte).
        </p>

        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
          <h2 className="mb-2 font-headline-md text-headline-md text-on-background">Ce qui est supprimé</h2>
          <ul className="list-disc space-y-1 pl-5 font-body-md text-body-md text-on-surface-variant">
            <li>Votre nom, e-mail, téléphone, photo de profil et biographie</li>
            <li>Vos documents d&apos;identité (pièces de vérification)</li>
            <li>Votre accès au compte (déconnexion immédiate et définitive)</li>
          </ul>
          <h2 className="mb-2 mt-4 font-headline-md text-headline-md text-on-background">Ce qui est conservé</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Par exigence légale et pour la traçabilité vis-à-vis des autres utilisateurs, l&apos;historique de vos
            transactions passées (montants, dates, statuts) est conservé sous une identité anonymisée
            (« Utilisateur supprimé »), sans aucune donnée personnelle identifiable.
          </p>
        </div>

        {done && (
          <div className="rounded-xl bg-primary-container/10 p-4 text-center font-body-md text-body-md text-primary">
            Votre compte a été supprimé. Redirection...
          </div>
        )}

        {!done && status === "authenticated" && user && (
          <div className="rounded-xl border border-error/20 bg-error-container/30 p-5">
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
              Connecté en tant que <strong>{user.email}</strong>.
            </p>
            {!confirmOpen ? (
              <Button variant="danger" fullWidth onClick={() => setConfirmOpen(true)}>
                Supprimer définitivement mon compte
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
                {error && (
                  <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">
                    {error}
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
        )}

        {!done && status !== "authenticated" && (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Vous n&apos;êtes pas connecté.{" "}
              <Link href="/connexion" className="text-primary hover:underline">
                Connectez-vous
              </Link>{" "}
              pour supprimer votre compte directement depuis cette page, ou écrivez-nous à{" "}
              <a href="mailto:privacy@colismonde.app" className="text-primary hover:underline">
                privacy@colismonde.app
              </a>{" "}
              depuis l&apos;adresse e-mail associée à votre compte pour en demander la suppression.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
