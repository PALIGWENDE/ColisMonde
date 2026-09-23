import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { PackageRequestDTO } from "@colismonde/shared";
import { CATEGORY_LABELS, formatPrice } from "@/lib/format";
import { shadows } from "@/theme/shadows";

export function RequestCard({ request }: { request: PackageRequestDTO }) {
  return (
    <Link
      href={{ pathname: "/recherche", params: { arrivalCityId: request.arrivalCity.id, departureCityId: request.departureCity.id } }}
      asChild
    >
      <Pressable
        className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4 active:scale-[0.98]"
        style={shadows.softGlow}
      >
        <View className="flex-row gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-xl bg-primary-container/10">
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{request.weightKg}kg</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-headline-md text-base text-on-surface">{CATEGORY_LABELS[request.category]}</Text>
              <Text className="text-lg font-bold text-primary">{formatPrice(request.offeredPrice)}</Text>
            </View>
            <Text numberOfLines={2} className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              {request.description}
            </Text>
            <Text className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
              {request.departureCity.name} → {request.arrivalCity.name}
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row gap-2">
          {request.isUrgent && (
            <View className="rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-[10px] font-bold uppercase tracking-wide text-primary">Urgent</Text>
            </View>
          )}
          <View className="rounded-full bg-surface-container px-3 py-1">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{CATEGORY_LABELS[request.category]}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
