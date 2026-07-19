"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const STEPS = [
  {
    icon: "public",
    iconBg: "bg-primary-container",
    title: "Envoyez ou transportez, partout dans le monde",
    description:
      "Indiquez où vous allez ou ce que vous voulez envoyer. ColisMonde met en relation expéditeurs et voyageurs selon leurs trajets.",
  },
  {
    icon: "verified_user",
    iconBg: "bg-secondary",
    title: "Un profil vérifié pour voyager en confiance",
    description:
      "Ajoutez une pièce d'identité pour obtenir le badge « Vérifié » : cela rassure vos futurs partenaires d'échange et débloque tous les trajets.",
  },
  {
    icon: "notifications_active",
    iconBg: "bg-tertiary",
    title: "Restez informé à chaque étape",
    description:
      "Recevez une notification dès qu'une demande correspond à votre trajet, qu'un message arrive ou que votre colis change de statut.",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <main className="flex min-h-screen flex-col bg-surface px-container-padding-mobile py-10">
      <div className="flex justify-end">
        <button
          onClick={() => router.push("/accueil")}
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
        >
          Passer
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className={clsx("flex h-24 w-24 items-center justify-center rounded-full text-white shadow-elevated", current.iconBg)}>
          <Icon name={current.icon} size={48} />
        </div>
        <div className="space-y-3">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">{current.title}</h1>
          <p className="mx-auto max-w-sm font-body-md text-body-md text-on-surface-variant">{current.description}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={clsx(
                "h-2 rounded-full transition-all",
                i === step ? "w-8 bg-primary-container" : "w-2 bg-outline-variant",
              )}
            />
          ))}
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => (isLast ? router.push("/accueil") : setStep((s) => s + 1))}
        >
          {isLast ? "Commencer" : "Suivant"}
        </Button>
      </div>
    </main>
  );
}
