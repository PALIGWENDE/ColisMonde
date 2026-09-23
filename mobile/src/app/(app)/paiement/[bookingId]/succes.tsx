import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBooking } from "@/hooks/useBookings";
import { useBookingPayment } from "@/hooks/usePayments";
import { formatDateTime, formatPrice } from "@/lib/format";
import { shadows } from "@/theme/shadows";

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { data: bookingData } = useBooking(bookingId);
  const { data: paymentData } = useBookingPayment(bookingId);
  const [copied, setCopied] = useState(false);

  const booking = bookingData?.booking;
  const payment = paymentData?.payment;

  const copyId = async () => {
    if (!booking) return;
    await Clipboard.setStringAsync(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView className="flex-1 items-center bg-background">
      <ScrollView contentContainerClassName="w-full max-w-md gap-8 px-container-padding-mobile py-stack-lg" className="w-full">
        <View className="mt-stack-lg items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-container/10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Icon name="check" size={36} className="text-white" />
            </View>
          </View>
        </View>

        <View className="items-center gap-2 px-4">
          <Text className="text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Paiement réussi !</Text>
          <Text className="text-center font-body-md text-body-md text-on-surface-variant">
            Votre colis est désormais assuré et prêt à être expédié.
          </Text>
        </View>

        <View className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6" style={shadows.softGlow}>
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-tertiary-fixed">
              <Icon name="verified_user" filled className="text-tertiary" />
            </View>
            <View className="flex-1">
              <Text className="font-label-md text-label-md text-on-surface">Transaction sécurisée</Text>
              <Text className="font-label-sm text-label-sm text-on-surface-variant">Protection ColisMonde active</Text>
            </View>
          </View>
        </View>

        <View className="rounded-2xl border border-outline-variant/10 bg-white" style={shadows.softGlow}>
          <View className="p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Récapitulatif</Text>
              <View className="rounded-full bg-secondary-container/10 px-2 py-1">
                <Text className="font-label-sm text-label-sm font-bold text-secondary">Payé</Text>
              </View>
            </View>
            <View className="gap-4">
              <View className="flex-row items-end justify-between border-b border-surface-variant pb-4">
                <View>
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">ID Transaction</Text>
                  <Text className="font-label-md text-label-md text-on-surface">#{booking?.id.slice(0, 12).toUpperCase()}</Text>
                </View>
                <Pressable onPress={copyId} accessibilityLabel="Copier">
                  <Icon name={copied ? "check" : "content_copy"} className={copied ? "text-primary" : "text-outline-variant"} />
                </Pressable>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">Montant Total</Text>
                  <Text className="font-headline-md text-headline-md text-primary">{booking ? formatPrice(booking.totalPrice) : "—"}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">Date</Text>
                  <Text className="font-label-md text-label-md text-on-surface">{payment?.paidAt ? formatDateTime(payment.paidAt) : "—"}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Icon name="shield" size={16} className="text-on-surface-variant" />
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Assurance multirisque incluse</Text>
        </View>

        <View className="gap-4">
          <Button
            fullWidth
            size="lg"
            onPress={() => booking && router.replace({ pathname: "/suivi/[id]", params: { id: booking.id } })}
          >
            <Icon name="package_2" className="text-on-primary" />
            <Text className="font-label-md text-label-md font-semibold text-on-primary">Suivre mon colis</Text>
          </Button>
          <Button fullWidth size="lg" variant="outline" onPress={() => router.replace("/accueil")}>
            Retour à l&apos;accueil
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
