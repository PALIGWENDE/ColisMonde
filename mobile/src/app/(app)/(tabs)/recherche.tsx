import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CityDTO, PackageCategory } from "@colismonde/shared";
import { PACKAGE_CATEGORIES } from "@colismonde/shared";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
import { TextField } from "@/components/ui/TextField";
import { DateField } from "@/components/ui/DateField";
import { Button } from "@/components/ui/Button";
import { TripCard } from "@/components/domain/TripCard";
import { useSearchTrips, type TripSort } from "@/hooks/useTrips";
import { CATEGORY_LABELS } from "@/lib/format";
import { shadows } from "@/theme/shadows";

const SORT_OPTIONS: { value: TripSort; label: string; icon: string }[] = [
  { value: "date", label: "Date", icon: "calendar_month" },
  { value: "price_asc", label: "Prix croissant", icon: "arrow_forward" },
  { value: "price_desc", label: "Prix décroissant", icon: "arrow_forward" },
  { value: "rating", label: "Mieux notés", icon: "star" },
];

export default function RechercheScreen() {
  const params = useLocalSearchParams<{ departureCityId?: string; arrivalCityId?: string }>();
  const [departureCity, setDepartureCity] = useState<CityDTO | null>(null);
  const [arrivalCity, setArrivalCity] = useState<CityDTO | null>(null);
  const [category, setCategory] = useState<PackageCategory | undefined>(undefined);
  const [sort, setSort] = useState<TripSort>("date");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minWeightKg, setMinWeightKg] = useState("");
  const [maxPricePerKg, setMaxPricePerKg] = useState("");

  const activeFilterCount = [dateFrom, dateTo, minWeightKg, maxPricePerKg].filter(Boolean).length;

  const filters = useMemo(
    () => ({
      departureCityId: departureCity?.id ?? params.departureCityId,
      arrivalCityId: arrivalCity?.id ?? params.arrivalCityId,
      category,
      sort,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      minWeightKg: minWeightKg ? Number(minWeightKg) : undefined,
      maxPricePerKg: maxPricePerKg ? Number(maxPricePerKg) : undefined,
    }),
    [departureCity, arrivalCity, params.departureCityId, params.arrivalCityId, category, sort, dateFrom, dateTo, minWeightKg, maxPricePerKg],
  );

  const { data, isLoading, isError } = useSearchTrips(filters);
  const trips = data?.trips ?? [];

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setMinWeightKg("");
    setMaxPricePerKg("");
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-row items-center gap-2 px-container-padding-mobile py-4" style={shadows.softGlow}>
        <Icon name="language" className="text-primary" />
        <Text className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</Text>
      </SafeAreaView>

      <ScrollView contentContainerClassName="px-container-padding-mobile pb-10">
        <View className="mb-8 mt-6">
          <Text className="mb-6 font-headline-lg-mobile text-headline-lg-mobile text-on-background">Trouvez un voyageur</Text>
          <View className="gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6" style={shadows.softGlow}>
            <CityAutocomplete label="Départ" value={departureCity} onChange={setDepartureCity} />
            <CityAutocomplete label="Arrivée" icon="flight_land" value={arrivalCity} onChange={setArrivalCity} />
            <Button fullWidth onPress={() => {}}>
              <Icon name="search" className="text-on-primary" />
              <Text className="font-label-md text-label-md font-semibold text-on-primary">Rechercher des trajets</Text>
            </Button>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="mb-4 gap-2 pb-2">
          <Pressable
            onPress={() => setCategory(undefined)}
            className={clsx(
              "rounded-full border px-4 py-2",
              !category ? "border-primary-container/20 bg-primary-container/10" : "border-outline-variant/30 bg-surface-container-low",
            )}
          >
            <Text className={clsx("font-label-sm text-label-sm", !category ? "text-primary-container" : "text-on-surface-variant")}>
              Tout afficher
            </Text>
          </Pressable>
          {PACKAGE_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={clsx(
                "rounded-full border px-4 py-2",
                category === c ? "border-primary-container/20 bg-primary-container/10" : "border-outline-variant/30 bg-surface-container-low",
              )}
            >
              <Text className={clsx("font-label-sm text-label-sm", category === c ? "text-primary-container" : "text-on-surface-variant")}>
                {CATEGORY_LABELS[c]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="mb-4 flex-row items-center justify-between">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2" className="flex-1">
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setSort(opt.value)}
                className={clsx(
                  "flex-row items-center gap-1 rounded-full border px-3 py-1.5",
                  sort === opt.value ? "border-primary bg-primary" : "border-outline-variant/30 bg-surface-container-low",
                )}
              >
                <Icon name={opt.icon} size={14} className={sort === opt.value ? "text-on-primary" : "text-on-surface-variant"} />
                <Text className={clsx("font-label-sm text-label-sm", sort === opt.value ? "text-on-primary" : "text-on-surface-variant")}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={() => setFiltersOpen((v) => !v)} className="ml-2 flex-row items-center gap-1 rounded-full border border-outline-variant/30 bg-surface-container-low px-3 py-1.5">
            <Icon name="bolt" size={14} className="text-on-surface-variant" />
            <Text className="font-label-sm text-label-sm text-on-surface-variant">Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</Text>
          </Pressable>
        </View>

        {filtersOpen && (
          <View className="mb-6 gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5" style={shadows.softGlow}>
            <View className="flex-row items-center justify-between">
              <Text className="font-label-md text-label-md text-on-background">Filtres avancés</Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={resetFilters}>
                  <Text className="font-label-sm text-label-sm text-primary">Réinitialiser</Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DateField label="Départ après le" value={dateFrom} onChange={setDateFrom} minimumDate={new Date()} />
              </View>
              <View className="flex-1">
                <DateField label="Jusqu'au" value={dateTo} onChange={setDateTo} minimumDate={new Date()} />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField label="Poids min. (kg)" icon="weight" keyboardType="decimal-pad" value={minWeightKg} onChangeText={setMinWeightKg} />
              </View>
              <View className="flex-1">
                <TextField label="Prix max. (€/kg)" icon="payments" keyboardType="decimal-pad" value={maxPricePerKg} onChangeText={setMaxPricePerKg} />
              </View>
            </View>
          </View>
        )}

        <View className="mb-6 flex-row items-center justify-between">
          <Text className="font-headline-md text-headline-md text-on-background">
            {isLoading ? "Recherche..." : `${trips.length} trajet${trips.length > 1 ? "s" : ""} trouvé${trips.length > 1 ? "s" : ""}`}
          </Text>
        </View>

        <View className="gap-gutter">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </View>

        {isError && (
          <View className="flex-row items-center gap-3 rounded-2xl border border-error/30 bg-error-container/40 p-6">
            <Icon name="info" className="text-error" />
            <Text className="flex-1 font-body-md text-body-md text-on-error-container">
              La recherche a échoué — vérifiez votre connexion et réessayez.
            </Text>
          </View>
        )}

        {!isLoading && !isError && trips.length === 0 && (
          <View className="rounded-2xl border border-dashed border-outline-variant/40 p-8">
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">
              Aucun trajet ne correspond à votre recherche pour le moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
