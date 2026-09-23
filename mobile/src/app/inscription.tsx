import { useState } from "react";
import { Text, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
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

export default function InscriptionScreen() {
  const router = useRouter();
  const registerUser = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerUser.mutateAsync(values);
      router.replace("/onboarding");
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
              <Icon name="travel_explore" size={32} className="text-on-primary" />
            </View>
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Rejoignez ColisMonde</Text>
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">
              Créez votre compte pour envoyer ou transporter des colis dans le monde entier.
            </Text>
          </View>

          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <TextField label="Prénom" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <TextField label="Nom" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
                  )}
                />
              </View>
            </View>
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
                  autoComplete="new-password"
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

            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              En créant un compte, vous acceptez nos conditions générales et notre politique de confidentialité.
            </Text>

            <Button size="lg" fullWidth loading={registerUser.isPending} onPress={onSubmit}>
              Créer mon compte
            </Button>
          </View>

          <Text className="text-center font-body-md text-body-md text-on-surface-variant">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="font-semibold text-primary">
              Se connecter
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
