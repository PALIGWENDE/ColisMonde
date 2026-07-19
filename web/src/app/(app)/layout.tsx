"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

/**
 * Garde d'authentification commune à tout l'espace connecté. L'affichage de la barre de
 * navigation basse est délégué aux sous-groupes (with-nav)/(no-nav) : certains écrans
 * (détail trajet, paiement, messagerie) ont leur propre barre d'action fixe en bas et ne
 * doivent pas la cumuler avec la navigation globale (cf. maquettes Stitch correspondantes).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") router.replace("/connexion");
  }, [status, router]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary-container border-t-transparent" />
      </div>
    );
  }

  if (status === "guest") return null;

  return <div className="min-h-screen bg-surface">{children}</div>;
}
