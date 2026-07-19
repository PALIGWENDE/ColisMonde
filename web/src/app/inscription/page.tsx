"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { useRegister } from "@/hooks/useAuthActions";
import { ApiClientError } from "@/lib/apiClient";

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Za-z]/, "Au moins une lettre")
    .regex(/[0-9]/, "Au moins un chiffre"),
});
type FormValues = z.infer<typeof schema>;

export default function InscriptionPage() {
  const router = useRouter();
  const registerUser = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerUser.mutateAsync(values);
      router.push("/onboarding");
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-container-padding-mobile py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-on-primary">
            <Icon name="travel_explore" size={32} />
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Rejoignez ColisMonde</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Créez votre compte pour envoyer ou transporter des colis dans le monde entier.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Prénom" error={errors.firstName?.message} {...register("firstName")} />
            <TextField label="Nom" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <TextField
            label="E-mail"
            icon="mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label="Mot de passe"
            icon="lock"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && (
            <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">
              {serverError}
            </p>
          )}

          <p className="font-label-sm text-label-sm text-on-surface-variant">
            En créant un compte, vous acceptez nos conditions générales et notre politique de confidentialité.
          </p>

          <Button type="submit" fullWidth size="lg" loading={registerUser.isPending}>
            Créer mon compte
          </Button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
