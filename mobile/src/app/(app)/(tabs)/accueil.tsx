import { ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { TripCard } from "@/components/domain/TripCard";
import { RequestCard } from "@/components/domain/RequestCard";
import { useSearchTrips } from "@/hooks/useTrips";
import { useSearchRequests } from "@/hooks/useRequests";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth";
import { shadows } from "@/theme/shadows";

export default function AccueilScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: tripsData, isLoading: tripsLoading } = useSearchTrips({});
  const { data: requestsData, isLoading: requestsLoading } = useSearchRequests({});
  const { data: notificationsData } = useNotifications();
  const unreadCount = notificationsData?.notifications.filter((n) => !n.isRead).length ?? 0;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-row items-center justify-between px-container-padding-mobile py-4" style={shadows.softGlow}>
        <View className="flex-row items-center gap-2">
          <Icon name="language" className="text-primary" />
          <Text className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</Text>
        </View>
        <Link href="/profil" asChild>
          <View className="relative">
            <Icon name="notifications" className="text-on-surface-variant" />
            {unreadCount > 0 && <View className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-secondary" />}
          </View>
        </Link>
      </SafeAreaView>

      <ScrollView contentContainerClassName="pb-8">
        <View className="mt-6 px-container-padding-mobile">
          {user && (
            <Text className="mb-4 font-body-md text-body-md text-on-surface-variant">
              Bonjour {user.firstName}, où envoyez-vous un colis aujourd&apos;hui ?
            </Text>
          )}
          <Link href="/recherche" asChild>
            <View className="flex-row items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4" style={shadows.softGlow}>
              <Icon name="search" className="text-primary" />
              <Text className="font-body-md text-body-md text-outline">Rechercher un trajet ou une ville...</Text>
            </View>
          </Link>
        </View>

        <View className="mt-8 gap-4 px-container-padding-mobile">
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-headline-md text-lg text-on-surface">Voyageurs disponibles</Text>
            <Link href="/recherche" className="font-label-md text-label-md text-primary">
              Voir tout
            </Link>
          </View>
          {tripsLoading && <SkeletonList />}
          {!tripsLoading && tripsData?.trips.length === 0 && <EmptyState label="Aucun trajet disponible pour le moment." />}
          {tripsData?.trips.slice(0, 5).map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </View>

        <View className="mt-8 gap-4 px-container-padding-mobile">
          <Text className="px-1 pt-4 font-headline-md text-lg text-on-surface">Demandes d&apos;envoi</Text>
          {requestsLoading && <SkeletonList />}
          {!requestsLoading && requestsData?.requests.length === 0 && <EmptyState label="Aucune demande d'envoi ouverte." />}
          {requestsData?.requests.slice(0, 5).map((request) => <RequestCard key={request.id} request={request} />)}
        </View>
      </ScrollView>
    </View>
  );
}

function SkeletonList() {
  return (
    <View className="gap-4">
      {[0, 1].map((i) => (
        <View key={i} className="h-40 rounded-2xl bg-surface-container" />
      ))}
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View className="rounded-2xl border border-dashed border-outline-variant/40 p-6">
      <Text className="text-center font-body-md text-body-md text-on-surface-variant">{label}</Text>
    </View>
  );
}
