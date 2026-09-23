import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ReviewForm } from "@/components/domain/ReviewForm";
import {
  useAcceptBooking,
  useBooking,
  useCancelBooking,
  useDeliverBooking,
  useInTransitBooking,
  usePickupBooking,
  useRejectBooking,
} from "@/hooks/useBookings";
import { useBookingPayment } from "@/hooks/usePayments";
import { useBookingConversation } from "@/hooks/useMessages";
import { useBookingReviews } from "@/hooks/useReviews";
import { useBlockUser } from "@/hooks/useUsers";
import { useAuthStore } from "@/store/auth";
import { CATEGORY_LABELS, ITEM_SIZE_LABELS, BOOKING_STATUS_LABELS, formatPrice } from "@/lib/format";
import { haversineDistanceKm } from "@/lib/geo";
import { ApiClientError } from "@/lib/apiClient";
import { shadows } from "@/theme/shadows";

type BookingResult = NonNullable<ReturnType<typeof useBooking>["data"]>["booking"];

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useBooking(id);
  const { data: paymentData } = useBookingPayment(id);
  const { data: conversationData } = useBookingConversation(id);
  const { data: reviewsData } = useBookingReviews(id);

  const acceptBooking = useAcceptBooking();
  const rejectBooking = useRejectBooking();
  const cancelBooking = useCancelBooking();
  const pickupBooking = usePickupBooking();
  const inTransitBooking = useInTransitBooking();
  const deliverBooking = useDeliverBooking();
  const blockUser = useBlockUser();

  const [confirmationCode, setConfirmationCode] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <TopAppBar title="Détails de l'envoi" showBack />
        <View className="p-container-padding-mobile">
          <View className="h-64 rounded-xl bg-surface-container" />
        </View>
      </View>
    );
  }

  const booking = data?.booking;
  if (!booking || !user) {
    return (
      <View className="flex-1 bg-surface">
        <TopAppBar title="Détails de l'envoi" showBack />
        <Text className="p-container-padding-mobile font-body-md text-body-md text-on-surface-variant">Réservation introuvable.</Text>
      </View>
    );
  }

  const isSender = booking.sender.id === user.id;
  const isTraveler = booking.traveler.id === user.id;
  const counterpart = isSender ? booking.traveler : booking.sender;
  const distanceKm = haversineDistanceKm(booking.trip.departureCity, booking.trip.arrivalCity);
  const alreadyReviewed = reviewsData?.reviews.some((r) => r.author.id === user.id);

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  const loading =
    acceptBooking.isPending ||
    rejectBooking.isPending ||
    cancelBooking.isPending ||
    pickupBooking.isPending ||
    inTransitBooking.isPending ||
    deliverBooking.isPending;

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="Détails de l'envoi" showBack actions={<Icon name="notifications" className="text-primary" />} />

      <ScrollView contentContainerClassName="gap-6 px-container-padding-mobile pt-6 pb-12">
        <View className="rounded-xl bg-surface-container-lowest p-6" style={shadows.softGlow}>
          <View className="mb-6 flex-row items-start justify-between">
            <View className="gap-1">
              <View className="self-start rounded-full bg-secondary-container px-3 py-1">
                <Text className="font-label-sm text-label-sm text-on-secondary-container">{BOOKING_STATUS_LABELS[booking.status]}</Text>
              </View>
              <Text className="pt-2 font-label-sm text-label-sm text-outline">Réf : {booking.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View className="items-end">
              <Text className="font-headline-md text-headline-md font-bold text-primary">{formatPrice(booking.totalPrice)}</Text>
              <Text className="font-label-sm text-label-sm text-outline">Total réservation</Text>
            </View>
          </View>

          <View className="relative flex-row items-center justify-between px-2 py-8">
            <View className="absolute left-0 right-0 h-0 border-t border-dashed border-primary-container/50" />
            <PinIcon icon="location_on" />
            <View className="absolute left-1/2 -translate-x-1/2">
              <Icon name="flight" size={28} className="text-secondary" />
            </View>
            <PinIcon icon="push_pin" />
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-1 items-center">
              <Text className="font-label-md text-label-md text-on-surface">{booking.trip.departureCity.name}</Text>
              <Text className="font-label-sm text-label-sm text-outline">{booking.trip.departureCity.countryCode}</Text>
            </View>
            <View className="flex-1 items-center">
              <View className="rounded bg-primary-fixed/30 px-2 py-1">
                <Text className="font-label-sm text-label-sm text-primary">{distanceKm} km</Text>
              </View>
            </View>
            <View className="flex-1 items-center">
              <Text className="font-label-md text-label-md text-on-surface">{booking.trip.arrivalCity.name}</Text>
              <Text className="font-label-sm text-label-sm text-outline">{booking.trip.arrivalCity.countryCode}</Text>
            </View>
          </View>
        </View>

        <View className="rounded-xl bg-surface-container-lowest p-5" style={shadows.softGlow}>
          <Text className="mb-4 font-label-md text-label-md text-outline">{isSender ? "Voyageur certifié" : "Expéditeur"}</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-4">
              <View className="h-14 w-14 overflow-hidden rounded-full border-2 border-primary-container/20 bg-surface-container">
                {counterpart.avatarUrl ? (
                  <Image source={{ uri: counterpart.avatarUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Text className="font-label-md text-label-md text-on-surface-variant">{counterpart.firstName[0]}</Text>
                  </View>
                )}
              </View>
              <View>
                <Text className="font-label-md text-label-md text-on-surface">
                  {counterpart.firstName} {counterpart.lastName}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Icon name="star" filled className="text-secondary-container" size={16} />
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">
                    {counterpart.ratingAvg.toFixed(1)} ({counterpart.ratingCount} envois)
                  </Text>
                </View>
              </View>
            </View>
            <Button
              variant="secondary"
              size="md"
              disabled={!conversationData?.conversationId}
              onPress={() =>
                conversationData &&
                router.push({ pathname: "/messages/[id]", params: { id: conversationData.conversationId } })
              }
            >
              <Icon name="chat" size={18} className="text-on-secondary" />
              <Text className="font-label-md text-label-md font-semibold text-on-secondary">Contacter</Text>
            </Button>
          </View>

          {booking.counterpartContact && (
            <View className="mt-4 gap-1 border-t border-outline-variant/10 pt-4">
              <View className="flex-row items-center gap-2">
                <Icon name="mail" size={16} className="text-on-surface-variant" />
                <Text className="font-label-sm text-label-sm text-on-surface-variant">{booking.counterpartContact.email}</Text>
              </View>
              {booking.counterpartContact.phone && (
                <View className="flex-row items-center gap-2">
                  <Icon name="call" size={16} className="text-on-surface-variant" />
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">{booking.counterpartContact.phone}</Text>
                </View>
              )}
            </View>
          )}

          {!blockConfirmOpen ? (
            <Button variant="ghost" className="mt-4 self-start border-t border-outline-variant/10 pt-4" onPress={() => setBlockConfirmOpen(true)}>
              <Icon name="block" size={16} className="text-outline" />
              <Text className="font-label-sm text-label-sm text-outline">Bloquer cet utilisateur</Text>
            </Button>
          ) : (
            <View className="mt-4 gap-3 border-t border-outline-variant/10 pt-4">
              <Text className="font-label-sm text-label-sm text-on-surface-variant">
                {counterpart.firstName} ne pourra plus vous contacter ni voir vos annonces.
              </Text>
              <View className="flex-row justify-end gap-2">
                <Button variant="ghost" size="md" onPress={() => setBlockConfirmOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  loading={blockUser.isPending}
                  onPress={() => blockUser.mutate(counterpart.id, { onSuccess: () => setBlockConfirmOpen(false) })}
                >
                  Confirmer
                </Button>
              </View>
            </View>
          )}
        </View>

        <View className="gap-4">
          <Text className="font-headline-md text-headline-md text-on-surface">Détails du colis</Text>
          <View className="flex-row flex-wrap gap-4">
            <DetailBox icon="weight" label="Poids" value={`${booking.request.weightKg} kg`} />
            <DetailBox icon="straighten" label="Taille" value={ITEM_SIZE_LABELS[booking.request.sizeEstimate]} />
            <DetailBox icon="verified_user" label="Assurance" value={booking.insuranceTier === "PREMIUM" ? "Premium (500€)" : "Basique"} />
            <DetailBox icon="inventory_2" label="Contenu" value={CATEGORY_LABELS[booking.request.category]} />
          </View>
        </View>

        {booking.status === "ACCEPTED" && booking.confirmationCode && isSender && (
          <View className="rounded-xl bg-primary-container p-4">
            <Text className="font-label-md text-label-md text-on-primary">Code de confirmation à donner au voyageur :</Text>
            <Text className="font-headline-lg text-headline-lg text-on-primary">{booking.confirmationCode}</Text>
          </View>
        )}

        {actionError && (
          <View className="rounded-xl bg-error-container px-4 py-3">
            <Text className="font-label-md text-label-md text-on-error-container">{actionError}</Text>
          </View>
        )}

        <ActionArea
          booking={booking}
          isSender={isSender}
          isTraveler={isTraveler}
          paid={paymentData?.payment.status === "PAID"}
          confirmationCode={confirmationCode}
          setConfirmationCode={setConfirmationCode}
          onAccept={() => runAction(() => acceptBooking.mutateAsync({ id: booking.id }))}
          onReject={() => runAction(() => rejectBooking.mutateAsync({ id: booking.id }))}
          onCancel={() => runAction(() => cancelBooking.mutateAsync({ id: booking.id }))}
          onPay={() => router.push({ pathname: "/paiement/[bookingId]", params: { bookingId: booking.id } })}
          onPickup={() => runAction(() => pickupBooking.mutateAsync({ id: booking.id }))}
          onInTransit={() => runAction(() => inTransitBooking.mutateAsync({ id: booking.id }))}
          onDeliver={() => runAction(() => deliverBooking.mutateAsync({ id: booking.id, body: { confirmationCode } }))}
          onTrack={() => router.push({ pathname: "/suivi/[id]", params: { id: booking.id } })}
          loading={loading}
        />

        {booking.status === "DELIVERED" && !alreadyReviewed && (
          <ReviewForm bookingId={booking.id} targetName={`${counterpart.firstName} ${counterpart.lastName}`} />
        )}
      </ScrollView>
    </View>
  );
}

function PinIcon({ icon }: { icon: string }) {
  return (
    <View className="z-10 rounded-full bg-surface-container-lowest p-1">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-container/10">
        <Icon name={icon} filled className="text-primary" />
      </View>
    </View>
  );
}

function DetailBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
      <Icon name={icon} className="text-primary-container" />
      <Text className="font-label-sm text-label-sm text-outline">{label}</Text>
      <Text className="font-label-md text-label-md text-on-surface">{value}</Text>
    </View>
  );
}

interface ActionAreaProps {
  booking: BookingResult;
  isSender: boolean;
  isTraveler: boolean;
  paid: boolean;
  confirmationCode: string;
  setConfirmationCode: (v: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onPay: () => void;
  onPickup: () => void;
  onInTransit: () => void;
  onDeliver: () => void;
  onTrack: () => void;
  loading: boolean;
}

function ActionArea(props: ActionAreaProps) {
  const { booking, isSender, isTraveler, paid, loading } = props;
  const currentUserId = isSender ? booking.sender.id : booking.traveler.id;
  const isInitiator = booking.initiatorId === currentUserId;

  if (booking.status === "PENDING") {
    if (isInitiator) {
      return (
        <View className="gap-3">
          <Text className="text-center font-body-md text-body-md text-on-surface-variant">
            En attente de réponse de {isSender ? "le voyageur" : "l'expéditeur"}.
          </Text>
          <Button variant="outline" fullWidth disabled={loading} onPress={props.onCancel}>
            Annuler la demande
          </Button>
        </View>
      );
    }
    return (
      <View className="gap-3">
        <Text className="text-center font-body-md text-body-md text-on-surface-variant">
          {isSender ? "Le voyageur" : "L'expéditeur"} vous propose cette réservation.
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="outline" fullWidth disabled={loading} onPress={props.onReject}>
              Refuser
            </Button>
          </View>
          <View className="flex-1">
            <Button fullWidth disabled={loading} onPress={props.onAccept}>
              Accepter
            </Button>
          </View>
        </View>
      </View>
    );
  }

  if (booking.status === "ACCEPTED" && isSender && !paid) {
    return (
      <Button fullWidth size="lg" onPress={props.onPay}>
        <Icon name="lock" className="text-on-primary" />
        <Text className="font-label-md text-label-md font-semibold text-on-primary">Procéder au paiement</Text>
      </Button>
    );
  }

  if (booking.status === "ACCEPTED" && isTraveler && paid) {
    return (
      <Button fullWidth size="lg" disabled={loading} onPress={props.onPickup}>
        <Icon name="package_2" className="text-on-primary" />
        <Text className="font-label-md text-label-md font-semibold text-on-primary">Confirmer la remise du colis</Text>
      </Button>
    );
  }

  if (booking.status === "PICKED_UP" && isTraveler) {
    return (
      <View className="gap-3">
        <Button fullWidth size="lg" disabled={loading} onPress={props.onInTransit}>
          <Icon name="flight_takeoff" className="text-on-primary" />
          <Text className="font-label-md text-label-md font-semibold text-on-primary">Marquer comme en transit</Text>
        </Button>
        <DeliverForm {...props} />
      </View>
    );
  }

  if (booking.status === "IN_TRANSIT" && isTraveler) {
    return <DeliverForm {...props} />;
  }

  if (["ACCEPTED", "PICKED_UP", "IN_TRANSIT"].includes(booking.status)) {
    return (
      <Button fullWidth variant="outline" size="lg" onPress={props.onTrack}>
        <Icon name="local_shipping" className="text-primary-container" />
        <Text className="font-label-md text-label-md font-semibold text-primary-container">Suivre mon colis</Text>
      </Button>
    );
  }

  return null;
}

function DeliverForm(props: ActionAreaProps) {
  return (
    <View className="gap-3 rounded-xl border border-outline-variant/30 p-4">
      <TextField
        label="Code de confirmation du destinataire"
        placeholder="6 chiffres"
        keyboardType="number-pad"
        maxLength={6}
        value={props.confirmationCode}
        onChangeText={(text) => props.setConfirmationCode(text.replace(/\D/g, ""))}
      />
      <Button fullWidth disabled={props.loading || props.confirmationCode.length !== 6} onPress={props.onDeliver}>
        Confirmer la livraison
      </Button>
    </View>
  );
}
