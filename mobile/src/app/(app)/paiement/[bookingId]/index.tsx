import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import clsx from "clsx";
import type { InsuranceTier } from "@colismonde/shared";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBooking, useUpdateInsurance } from "@/hooks/useBookings";
import { useConfirmPayment, useCreatePaymentIntent } from "@/hooks/usePayments";
import { CATEGORY_LABELS, formatPrice } from "@/lib/format";
import { ApiClientError } from "@/lib/apiClient";
import { shadows } from "@/theme/shadows";

export default function PaymentSummaryScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { data, isLoading } = useBooking(bookingId);
  const updateInsurance = useUpdateInsurance();
  const createIntent = useCreatePaymentIntent();
  const confirmPayment = useConfirmPayment();
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const booking = data?.booking;

  const selectInsurance = async (tier: InsuranceTier) => {
    if (!booking || booking.insuranceTier === tier) return;
    try {
      await updateInsurance.mutateAsync({ id: booking.id, body: { insuranceTier: tier } });
    } catch {
      // best-effort ; le total affiché sera resynchronisé au prochain fetch
    }
  };

  const pay = async () => {
    if (!booking) return;
    setError(null);
    setPaying(true);
    try {
      const { payment } = await createIntent.mutateAsync(booking.id);
      await confirmPayment.mutateAsync(payment.id);
      router.replace({ pathname: "/paiement/[bookingId]/succes", params: { bookingId: booking.id } });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Le paiement a échoué");
    } finally {
      setPaying(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <View className="flex-1 bg-surface">
        <TopAppBar title="ColisMonde" showBack />
        <View className="p-container-padding-mobile">
          <View className="h-64 rounded-xl bg-surface-container" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="ColisMonde" showBack actions={<Icon name="notifications" className="text-primary" />} />

      <ScrollView contentContainerClassName="gap-stack-md px-container-padding-mobile pt-6 pb-40">
        <View className="rounded-2xl bg-white p-4" style={shadows.softGlow}>
          <View className="mb-4 flex-row items-center justify-between">
            <View className="items-center">
              <Text className="font-label-sm text-on-surface-variant">DÉPART</Text>
              <Text className="font-headline-md text-primary">{booking.trip.departureCity.countryCode}</Text>
              <Text className="font-label-md text-on-surface">{booking.trip.departureCity.name}</Text>
            </View>
            <View className="flex-1 items-center px-4">
              <Icon name="flight_takeoff" className="mb-1 text-secondary" />
              <View className="h-0 w-full border-t border-dashed border-primary-container/50" />
            </View>
            <View className="items-center">
              <Text className="font-label-sm text-on-surface-variant">ARRIVÉE</Text>
              <Text className="font-headline-md text-primary">{booking.trip.arrivalCity.countryCode}</Text>
              <Text className="font-label-md text-on-surface">{booking.trip.arrivalCity.name}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2 border-t border-surface-container pt-3">
            <Icon name="package_2" size={18} className="text-on-surface-variant" />
            <Text className="font-label-md text-on-surface-variant">
              Colis ({CATEGORY_LABELS[booking.request.category]}) • {booking.request.weightKg}kg
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-label-md uppercase tracking-wider text-on-surface-variant">Résumé des coûts</Text>
          <View className="gap-4 rounded-2xl bg-white p-5" style={shadows.softGlow}>
            <Row label="Frais d'expédition" value={formatPrice(booking.agreedPrice)} />
            <Row label="Frais de service" value={formatPrice(booking.serviceFee)} />
            <Row label="Assurance" value={formatPrice(booking.insuranceFee)} />
            <View className="flex-row items-center justify-between border-t border-dashed border-outline-variant pt-4">
              <Text className="font-headline-md text-on-surface">Total</Text>
              <Text className="font-headline-md text-primary">{formatPrice(booking.totalPrice)}</Text>
            </View>
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-label-md uppercase tracking-wider text-on-surface-variant">Assurance voyage</Text>
          <View className="gap-3">
            <InsuranceOption
              label="Basique"
              description="Gratuit"
              selected={booking.insuranceTier === "BASIC"}
              onPress={() => selectInsurance("BASIC")}
            />
            <InsuranceOption
              label="Premium"
              description="15€ — Couvre jusqu'à 500€"
              recommended
              selected={booking.insuranceTier === "PREMIUM"}
              onPress={() => selectInsurance("PREMIUM")}
            />
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-label-md uppercase tracking-wider text-on-surface-variant">Mode de paiement</Text>
          <View className="flex-row items-center justify-between rounded-2xl bg-white p-4" style={shadows.softGlow}>
            <View className="flex-row items-center gap-4">
              <View className="h-8 w-12 items-center justify-center rounded bg-surface-container">
                <Icon name="credit_card" className="text-on-surface-variant" />
              </View>
              <View>
                <Text className="font-label-md text-on-surface">Carte de paiement (démo)</Text>
                <Text className="font-label-sm text-on-surface-variant">Paiement simulé — aucune carte réelle requise</Text>
              </View>
            </View>
            <Icon name="check_circle" className="text-primary" />
          </View>
        </View>

        {error && (
          <View className="rounded-xl bg-error-container px-4 py-3">
            <Text className="font-label-md text-on-error-container">{error}</Text>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 w-full bg-white p-container-padding-mobile" style={shadows.elevated}>
        <Button fullWidth size="lg" loading={paying} onPress={pay}>
          <Icon name="lock" filled className="text-on-primary" />
          <Text className="font-label-md text-label-md font-semibold text-on-primary">Payer {formatPrice(booking.totalPrice)}</Text>
        </Button>
        <Text className="mt-3 px-4 text-center font-label-sm text-on-surface-variant">
          Paiement sécurisé. En payant, vous acceptez nos conditions générales de transport.
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-on-surface-variant">{label}</Text>
      <Text className="font-label-md text-on-surface">{value}</Text>
    </View>
  );
}

function InsuranceOption({
  label,
  description,
  recommended,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  recommended?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("flex-row items-center rounded-2xl bg-white p-4", selected ? "border-2 border-primary" : "border-2 border-transparent")}
      style={shadows.softGlow}
    >
      <View className={clsx("h-5 w-5 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-outline-variant")}>
        {selected && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </View>
      <View className="ml-4 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-label-md text-on-surface">{label}</Text>
          {recommended && (
            <View className="rounded-full bg-secondary-container px-2 py-0.5">
              <Text className="text-[10px] font-bold text-on-secondary-container">RECOMMANDÉ</Text>
            </View>
          )}
        </View>
        <Text className="font-label-sm text-on-surface-variant">{description}</Text>
      </View>
      {selected && <Icon name="verified_user" className="text-primary" />}
    </Pressable>
  );
}
