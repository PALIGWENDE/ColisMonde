import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { useDeleteAccount } from "@/hooks/useUsers";
import { ApiClientError } from "@/lib/apiClient";

/**
 * Écran public, accessible sans être connecté (exigence explicite de la politique de suppression de
 * compte de Google Play : un chemin doit être disponible même sans installer/ouvrir l'app — ici on
 * le garde du moins accessible sans passer par la garde d'authentification racine). Si une session
 * valide est détectée, propose directement la suppression ; sinon, explique la marche à suivre.
 */
export default function SuppressionCompteScreen() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const deleteAccount = useDeleteAccount();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.replace("/connexion"), 2500);
    return () => clearTimeout(t);
  }, [done, router]);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="Suppression de compte" showBack />
      <ScrollView contentContainerClassName="gap-6 px-container-padding-mobile py-8">
        <Text className="font-body-md text-body-md text-on-surface-variant">
          Vous pouvez demander la suppression définitive de votre compte ColisMonde et de vos données personnelles à tout moment, directement
          depuis cet écran ou depuis l&apos;application (Profil → Confidentialité et compte).
        </Text>

        <View className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
          <Text className="mb-2 font-headline-md text-headline-md text-on-background">Ce qui est supprimé</Text>
          <View className="gap-1">
            <Text className="font-body-md text-body-md text-on-surface-variant">• Votre nom, e-mail, téléphone, photo de profil et biographie</Text>
            <Text className="font-body-md text-body-md text-on-surface-variant">• Vos documents d&apos;identité (pièces de vérification)</Text>
            <Text className="font-body-md text-body-md text-on-surface-variant">• Votre accès au compte (déconnexion immédiate et définitive)</Text>
          </View>
          <Text className="mb-2 mt-4 font-headline-md text-headline-md text-on-background">Ce qui est conservé</Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Par exigence légale et pour la traçabilité vis-à-vis des autres utilisateurs, l&apos;historique de vos transactions passées (montants,
            dates, statuts) est conservé sous une identité anonymisée (« Utilisateur supprimé »), sans aucune donnée personnelle identifiable.
          </Text>
        </View>

        {done && (
          <View className="rounded-xl bg-primary-container/10 p-4">
            <Text className="text-center font-body-md text-body-md text-primary">Votre compte a été supprimé. Redirection...</Text>
          </View>
        )}

        {!done && status === "authenticated" && user && (
          <View className="rounded-xl border border-error/20 bg-error-container/30 p-5">
            <Text className="mb-4 font-body-md text-body-md text-on-surface-variant">
              Connecté en tant que <Text className="font-bold">{user.email}</Text>.
            </Text>
            {!confirmOpen ? (
              <Button variant="danger" fullWidth onPress={() => setConfirmOpen(true)}>
                Supprimer définitivement mon compte
              </Button>
            ) : (
              <View className="gap-3">
                <Text className="font-label-md text-label-md text-on-surface">Tapez SUPPRIMER pour confirmer</Text>
                <TextInput
                  value={confirmText}
                  onChangeText={setConfirmText}
                  autoCapitalize="characters"
                  placeholder="SUPPRIMER"
                  placeholderTextColor="#6f797a"
                  className="rounded-xl border border-error/40 bg-white p-3 font-body-md text-body-md text-on-surface"
                />
                {error && (
                  <View className="rounded-xl bg-error-container px-4 py-3">
                    <Text className="font-label-md text-label-md text-on-error-container">{error}</Text>
                  </View>
                )}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button variant="outline" fullWidth onPress={() => setConfirmOpen(false)}>
                      Annuler
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button variant="danger" fullWidth disabled={confirmText !== "SUPPRIMER"} loading={deleteAccount.isPending} onPress={handleDelete}>
                      Confirmer
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {!done && status !== "authenticated" && (
          <View className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Vous n&apos;êtes pas connecté.{" "}
              <Link href="/connexion" className="text-primary">
                Connectez-vous
              </Link>{" "}
              pour supprimer votre compte directement depuis cet écran, ou écrivez-nous à privacy@colismonde.app depuis l&apos;adresse e-mail
              associée à votre compte pour en demander la suppression.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
