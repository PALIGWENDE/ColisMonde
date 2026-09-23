import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Image } from "expo-image";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBlockedUsers, useDeleteAccount, useUnblockUser } from "@/hooks/useUsers";
import { ApiClientError } from "@/lib/apiClient";
import { shadows } from "@/theme/shadows";

export default function ParametresScreen() {
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
      router.replace("/connexion");
    } catch (err) {
      setDeleteError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="Confidentialité et compte" showBack />
      <ScrollView contentContainerClassName="gap-8 px-container-padding-mobile pt-6 pb-12">
        <View className="gap-4">
          <Text className="px-1 font-label-md text-label-sm uppercase tracking-widest text-outline">Utilisateurs bloqués</Text>
          {blockedLoading && <Text className="font-body-md text-body-md text-on-surface-variant">Chargement...</Text>}
          {!blockedLoading && blockedUsers.length === 0 && (
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Vous n&apos;avez bloqué personne. Un utilisateur bloqué ne peut plus vous contacter ni voir vos trajets/demandes, et vous ne verrez plus
              les siens.
            </Text>
          )}
          <View className="gap-3">
            {blockedUsers.map((user) => (
              <View key={user.id} className="flex-row items-center justify-between rounded-xl bg-white p-4" style={shadows.softGlow}>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 overflow-hidden rounded-full bg-surface-container">
                    {user.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={{ width: 40, height: 40 }} contentFit="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Text className="font-label-sm text-label-sm text-on-surface-variant">{user.firstName[0]}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-label-md text-label-md text-on-background">
                    {user.firstName} {user.lastName}
                  </Text>
                </View>
                <Button variant="outline" size="md" loading={unblockUser.isPending} onPress={() => unblockUser.mutate(user.id)}>
                  Débloquer
                </Button>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Text className="px-1 font-label-md text-label-sm uppercase tracking-widest text-outline">Confidentialité</Text>
          <View className="overflow-hidden rounded-xl bg-white" style={shadows.softGlow}>
            <Link href="/confidentialite" className="flex-row items-center justify-between p-4">
              <Text className="font-body-md text-body-md text-on-background">Politique de confidentialité</Text>
              <Icon name="chevron_right" className="text-outline-variant" />
            </Link>
            <View className="mx-4 h-px bg-outline-variant/30" />
            <Link href="/conditions" className="flex-row items-center justify-between p-4">
              <Text className="font-body-md text-body-md text-on-background">Conditions générales</Text>
              <Icon name="chevron_right" className="text-outline-variant" />
            </Link>
          </View>
        </View>

        <View className="gap-4">
          <Text className="px-1 font-label-md text-label-sm uppercase tracking-widest text-error">Zone dangereuse</Text>
          <View className="rounded-xl border border-error/20 bg-error-container/30 p-5">
            <Text className="mb-4 font-body-md text-body-md text-on-surface-variant">
              La suppression de votre compte est définitive : votre profil, votre photo et vos documents d&apos;identité seront effacés. Vos
              réservations en cours seront annulées. Par exigence légale, l&apos;historique de vos transactions passées reste visible pour vos
              anciennes contreparties, sous une identité anonymisée.
            </Text>

            {!confirmOpen ? (
              <Button variant="danger" fullWidth onPress={() => setConfirmOpen(true)}>
                Supprimer mon compte
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
                {deleteError && (
                  <View className="rounded-xl bg-error-container px-4 py-3">
                    <Text className="font-label-md text-label-md text-on-error-container">{deleteError}</Text>
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
        </View>
      </ScrollView>
    </View>
  );
}
