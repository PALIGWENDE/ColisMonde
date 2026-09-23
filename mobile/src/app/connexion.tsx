import { useState } from "react";
import { Text, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
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

export default function ConnexionScreen() {
  const router = useRouter();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login.mutateAsync(values);
      router.replace("/accueil");
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-container-padding-mobile py-12">
        <View className="w-full max-w-sm gap-8">
          <View className="items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-container">
              <Icon name="public" size={32} className="text-on-primary" />
            </View>
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Bon retour !</Text>
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">
              Connectez-vous pour retrouver vos envois et trajets.
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  label="E-mail"
                  icon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <TextField
                  label="Mot de passe"
                  icon="lock"
                  secureTextEntry
                  autoComplete="current-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            {serverError && (
              <View className="rounded-xl bg-error-container px-4 py-3">
                <Text className="font-label-md text-label-md text-on-error-container">{serverError}</Text>
              </View>
            )}

            <Button size="lg" fullWidth loading={login.isPending} onPress={onSubmit}>
              Se connecter
            </Button>
          </View>

          <Text className="text-center font-body-md text-body-md text-on-surface-variant">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-primary">
              Créer un compte
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
