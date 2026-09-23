import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import clsx from "clsx";
import type { ItemSize, PackageCategory } from "@colismonde/shared";
import { ITEM_SIZES } from "@colismonde/shared";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useTrip } from "@/hooks/useTrips";
import { useCreateRequest } from "@/hooks/useRequests";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuthStore } from "@/store/auth";
import { CATEGORY_LABELS, ITEM_SIZE_LABELS, TRANSPORT_MODE_ICONS, formatDate, formatPrice } from "@/lib/format";
import { ApiClientError } from "@/lib/apiClient";
import { shadows } from "@/theme/shadows";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useTrip(id);
  const user = useAuthStore((s) => s.user);
  const [showBookingForm, setShowBookingForm] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <TopAppBar title="Détails du trajet" showBack />
        <View className="p-container-padding-mobile">
          <View className="h-64 rounded-xl bg-surface-container" />
        </View>
      </View>
    );
  }

  const trip = data?.trip;
  if (!trip) {
    return (
      <View className="flex-1 bg-surface">
        <TopAppBar title="Détails du trajet" showBack />
        <Text className="p-container-padding-mobile font-body-md text-body-md text-on-surface-variant">Trajet introuvable.</Text>
      </View>
    );
  }

  const isOwnTrip = user?.id === trip.traveler.id;

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="Détails du trajet" showBack actions={<Icon name="share" className="text-primary" />} />

      <ScrollView contentContainerClassName="px-container-padding-mobile pb-40 pt-stack-md">
        <View className="mb-gutter rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6" style={shadows.softGlow}>
          <View className="mb-8 flex-row items-center justify-between">
            <View className="items-center">
              <Text className="mb-1 font-headline-md text-headline-md text-primary">{trip.departureCity.name}</Text>
              <Text className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                {trip.departureCity.countryCode}
              </Text>
            </View>
            <View className="relative h-10 flex-1 flex-row items-center justify-center px-4">
              <View className="h-0 w-full border-t border-dashed border-primary-container/50" />
              <View className="absolute bg-surface-container-lowest px-1">
                <Icon name={TRANSPORT_MODE_ICONS[trip.transportMode]} className="text-primary" />
              </View>
            </View>
            <View className="items-center">
              <Text className="mb-1 font-headline-md text-headline-md text-primary">{trip.arrivalCity.name}</Text>
              <Text className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                {trip.arrivalCity.countryCode}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between border-t border-outline-variant/30 pt-6">
            <InfoStat icon="calendar_today" label="Date" value={formatDate(trip.departureDate)} />
            <InfoStat icon="weight" label="Poids" value={`${trip.availableWeightKg}kg disp.`} />
            <InfoStat icon="payments" label="Récompense" value={`${trip.pricePerKg}€/kg`} highlight />
          </View>
        </View>

        <View className="mb-gutter">
          <Text className="mb-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Voyageur</Text>
          <View className="flex-row items-center justify-between rounded-xl bg-surface-container-lowest p-4" style={shadows.softGlow}>
            <View className="flex-row items-center gap-4">
              <View className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary-container/20 bg-surface-container">
                {trip.traveler.avatarUrl ? (
                  <Image source={{ uri: trip.traveler.avatarUrl }} style={{ width: 64, height: 64 }} contentFit="cover" />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Text className="font-headline-md text-headline-md text-on-surface-variant">{trip.traveler.firstName[0]}</Text>
                  </View>
                )}
                {trip.traveler.isVerified && (
                  <View className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-primary p-0.5">
                    <Icon name="verified" filled className="text-white" size={14} />
                  </View>
                )}
              </View>
              <View>
                <Text className="font-headline-md text-headline-md leading-tight text-primary">
                  {trip.traveler.firstName} {trip.traveler.lastName}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Icon name="star" filled className="text-secondary" size={18} />
                  <Text className="font-label-md text-label-md text-on-background">
                    {trip.traveler.ratingAvg.toFixed(1)}{" "}
                    <Text className="font-normal text-on-surface-variant">({trip.traveler.ratingCount} avis)</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-gutter">
          <Text className="mb-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Détails de l&apos;envoi</Text>
          <View className="gap-stack-md">
            <DetailItem icon="straighten" label="Taille maximale" value={ITEM_SIZE_LABELS[trip.maxItemSize]} />
            <DetailItem icon="category" label="Catégories acceptées" value={trip.acceptedCategories.map((c) => CATEGORY_LABELS[c]).join(", ")} />
            {trip.notes && <DetailItem icon="inventory_2" label="Notes du voyageur" value={trip.notes} />}
          </View>
        </View>

        <View className="flex-row items-start gap-3 rounded-xl border border-secondary-container/20 bg-secondary-container/10 p-4">
          <Icon name="info" className="text-secondary" />
          <Text className="flex-1 font-body-md text-body-md text-on-surface-variant">
            Ce voyageur s&apos;est engagé à respecter les délais de livraison. Pensez à bien emballer vos objets fragiles.
          </Text>
        </View>

        {showBookingForm && !isOwnTrip && (
          <BookingForm
            trip={trip}
            onClose={() => setShowBookingForm(false)}
            onSuccess={(bookingId) => router.push({ pathname: "/envois/[id]", params: { id: bookingId } })}
          />
        )}
      </ScrollView>

      {!isOwnTrip && !showBookingForm && (
        <View className="absolute bottom-0 w-full border-t border-outline-variant/10 bg-surface p-container-padding-mobile" style={shadows.elevated}>
          <View className="flex-row items-center justify-between gap-4">
            <View>
              <Text className="font-label-sm text-label-sm text-on-surface-variant">À partir de</Text>
              <Text className="font-headline-md text-headline-md font-bold text-secondary">{formatPrice(trip.pricePerKg)}/kg</Text>
            </View>
            <View className="flex-1">
              <Button size="lg" fullWidth onPress={() => setShowBookingForm(true)}>
                <Icon name="calendar_add_on" className="text-on-primary" />
                <Text className="font-label-md text-label-md font-semibold text-on-primary">Réserver ce trajet</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function InfoStat({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <View className="items-center">
      <Icon name={icon} className="mb-1 text-secondary" />
      <Text className="font-label-sm text-label-sm text-on-surface-variant">{label}</Text>
      <Text className={clsx("font-label-md text-label-md font-bold text-on-background", highlight && "text-secondary")}>{value}</Text>
    </View>
  );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-4 rounded-xl border-l-4 border-primary bg-surface-container-lowest p-4" style={shadows.softGlow}>
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10">
        <Icon name={icon} className="text-primary" />
      </View>
      <View className="flex-1">
        <Text className="font-label-sm text-label-sm text-on-surface-variant">{label}</Text>
        <Text className="font-label-md text-label-md font-semibold text-on-background">{value}</Text>
      </View>
    </View>
  );
}

function BookingForm({
  trip,
  onClose,
  onSuccess,
}: {
  trip: NonNullable<ReturnType<typeof useTrip>["data"]>["trip"];
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}) {
  const createRequest = useCreateRequest();
  const createBooking = useCreateBooking();
  const [weightKg, setWeightKg] = useState("1");
  const [category, setCategory] = useState<PackageCategory>(trip.acceptedCategories[0] ?? "OTHER");
  const [sizeEstimate, setSizeEstimate] = useState<ItemSize>(trip.maxItemSize);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const estimatedPrice = Math.round(Number(weightKg || 0) * trip.pricePerKg * 100) / 100;

  const submit = async () => {
    setError(null);
    if (!description) return setError("Décrivez brièvement le contenu du colis");
    if (Number(weightKg) > trip.availableWeightKg) return setError(`Le poids ne peut pas dépasser ${trip.availableWeightKg}kg`);

    try {
      const { request } = await createRequest.mutateAsync({
        departureCityId: trip.departureCity.id,
        arrivalCityId: trip.arrivalCity.id,
        desiredDate: trip.departureDate,
        weightKg: Number(weightKg),
        category,
        description,
        sizeEstimate,
        isUrgent: false,
        offeredPrice: estimatedPrice,
      });
      const { booking } = await createBooking.mutateAsync({ tripId: trip.id, requestId: request.id });
      onSuccess(booking.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="mt-gutter gap-4 rounded-xl border border-primary-container/20 bg-surface-container-lowest p-5" style={shadows.softGlow}>
        <View className="flex-row items-center justify-between">
          <Text className="font-headline-md text-headline-md text-on-background">Décrivez votre colis</Text>
          <Pressable onPress={onClose} accessibilityLabel="Fermer">
            <Icon name="close" className="text-on-surface-variant" />
          </Pressable>
        </View>

        <TextField
          label={`Poids (kg, max ${trip.availableWeightKg})`}
          keyboardType="decimal-pad"
          value={weightKg}
          onChangeText={setWeightKg}
        />

        <View className="gap-1.5">
          <Text className="font-label-md text-label-md text-on-surface-variant">Catégorie</Text>
          <View className="flex-row flex-wrap gap-2">
            {trip.acceptedCategories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={clsx(
                  "rounded-full px-4 py-2",
                  category === c ? "bg-primary-container" : "border border-outline-variant/40",
                )}
              >
                <Text className={clsx("text-label-sm font-label-sm", category === c ? "text-on-primary" : "text-on-surface-variant")}>
                  {CATEGORY_LABELS[c]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="font-label-md text-label-md text-on-surface-variant">Taille</Text>
          <View className="flex-row gap-2">
            {ITEM_SIZES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSizeEstimate(s)}
                className={clsx(
                  "flex-1 items-center rounded-xl py-2",
                  sizeEstimate === s ? "bg-primary-container" : "border border-outline-variant/40",
                )}
              >
                <Text className={clsx("text-label-sm font-label-sm", sizeEstimate === s ? "text-on-primary" : "text-on-surface-variant")}>
                  {ITEM_SIZE_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="font-label-md text-label-md text-on-surface-variant">Description</Text>
          <TextInput
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            className="rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md text-on-surface"
            style={{ textAlignVertical: "top", minHeight: 80 }}
          />
        </View>

        <View className="flex-row items-center justify-between rounded-xl bg-primary-container/10 p-4">
          <Text className="font-label-md text-label-md text-on-surface-variant">Prix estimé</Text>
          <Text className="font-headline-md text-headline-md text-primary">{formatPrice(estimatedPrice)}</Text>
        </View>

        {error && (
          <View className="rounded-xl bg-error-container px-4 py-3">
            <Text className="font-label-md text-label-md text-on-error-container">{error}</Text>
          </View>
        )}

        <Button fullWidth size="lg" loading={createRequest.isPending || createBooking.isPending} onPress={submit}>
          Envoyer la demande de réservation
        </Button>
        <Text className="text-center font-label-sm text-label-sm text-on-surface-variant">
          Le voyageur doit accepter votre demande avant le paiement.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
