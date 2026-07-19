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
import { useLogin } from "@/hooks/useAuthActions";
import { ApiClientError } from "@/lib/apiClient";

const schema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
type FormValues = z.infer<typeof schema>;

export default function ConnexionPage() {
  const router = useRouter();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login.mutateAsync(values);
      router.push("/accueil");
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-container-padding-mobile py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-on-primary">
            <Icon name="public" size={32} />
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Bon retour !</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Connectez-vous pour retrouver vos envois et trajets.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && (
            <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">
              {serverError}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" loading={login.isPending}>
            Se connecter
          </Button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
