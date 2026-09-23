import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import type { TripDTO } from "@colismonde/shared";
import { Icon } from "@/components/ui/Icon";
import { formatDate, TRANSPORT_MODE_ICONS } from "@/lib/format";
import { shadows } from "@/theme/shadows";

export function TripCard({ trip }: { trip: TripDTO }) {
  return (
    <Link href={{ pathname: "/trajets/[id]", params: { id: trip.id } }} asChild>
      <Pressable
        className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4 active:scale-[0.98]"
        style={shadows.softGlow}
      >
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary-container/20 bg-surface-container">
              {trip.traveler.avatarUrl ? (
                <Image source={{ uri: trip.traveler.avatarUrl }} style={{ width: 48, height: 48 }} contentFit="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="font-label-md text-label-md text-on-surface-variant">{trip.traveler.firstName[0]}</Text>
                </View>
              )}
            </View>
            <View>
              <Text className="font-headline-md text-base leading-tight text-on-background">
                {trip.traveler.firstName} {trip.traveler.lastName[0]}.
              </Text>
              <View className="flex-row items-center gap-1">
                <Icon name="star" filled size={16} className="text-secondary" />
                <Text className="font-label-sm text-label-sm text-secondary">{trip.traveler.ratingAvg.toFixed(1)}</Text>
              </View>
            </View>
          </View>
          <View className="rounded-full bg-secondary-container/20 px-3 py-1">
            <Text className="font-label-sm text-label-sm text-secondary">{trip.pricePerKg}€/kg</Text>
          </View>
        </View>

        <View className="mb-4 flex-row items-center justify-between gap-4">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-outline">{trip.departureCity.name}</Text>
            <Text className="font-headline-md text-sm text-on-background">{trip.departureCity.countryCode}</Text>
          </View>
          <View className="relative flex-1 flex-row items-center justify-center px-2">
            <View className="h-0 w-full border-t border-dashed border-primary-container/50" />
            <View className="absolute bg-surface-container-lowest px-1">
              <Icon name={TRANSPORT_MODE_ICONS[trip.transportMode]} className="text-primary" size={20} />
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-outline">{trip.arrivalCity.name}</Text>
            <Text className="font-headline-md text-sm text-on-background">{trip.arrivalCity.countryCode}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-outline-variant/10 pt-3">
          <View className="flex-row items-center gap-2">
            <Icon name="calendar_month" size={20} className="text-on-surface-variant" />
            <Text className="font-label-sm text-label-sm text-on-surface-variant">{formatDate(trip.departureDate)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Icon name="work" size={20} className="text-primary" />
            <Text className="font-label-md text-label-md text-primary">{trip.availableWeightKg}kg dispos</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
