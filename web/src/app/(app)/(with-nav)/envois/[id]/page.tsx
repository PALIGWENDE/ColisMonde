"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
import { CATEGORY_LABELS, ITEM_SIZE_LABELS, BOOKING_STATUS_LABELS, formatDate, formatPrice } from "@/lib/format";
import { haversineDistanceKm } from "@/lib/geo";
import { ApiClientError } from "@/lib/apiClient";

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useBooking(params.id);
  const { data: paymentData } = useBookingPayment(params.id);
  const { data: conversationData } = useBookingConversation(params.id);
  const { data: reviewsData } = useBookingReviews(params.id);

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
      <div>
        <TopAppBar title="Détails de l'envoi" showBack />
        <div className="p-container-padding-mobile">
          <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
        </div>
      </div>
    );
  }

  const booking = data?.booking;
  if (!booking || !user) {
    return (
      <div>
        <TopAppBar title="Détails de l'envoi" showBack />
        <p className="p-container-padding-mobile font-body-md text-body-md text-on-surface-variant">Réservation introuvable.</p>
      </div>
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

  return (
    <div>
      <TopAppBar title="Détails de l'envoi" showBack actions={<Icon name="notifications" className="text-primary" />} />

      <main className="space-y-6 px-container-padding-mobile pt-6 pb-12">
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-soft-glow">
          <div className="mb-6 flex items-start justify-between">
            <div className="space-y-1">
              <span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm text-on-secondary-container">
                {BOOKING_STATUS_LABELS[booking.status]}
              </span>
              <p className="pt-2 font-label-sm text-label-sm text-outline">Réf : {booking.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="font-headline-md text-headline-md font-bold text-primary">{formatPrice(booking.totalPrice)}</p>
              <p className="font-label-sm text-label-sm text-outline">Total réservation</p>
            </div>
          </div>

          <div className="relative flex items-center justify-between px-2 py-8">
            <div className="flight-path" />
            <PinIcon icon="location_on" />
            <div className="absolute left-1/2 z-10 -translate-x-1/2">
              <Icon name="flight" className="plane-float text-3xl text-secondary" />
            </div>
            <PinIcon icon="push_pin" />
          </div>
          <div className="mt-2 flex items-center justify-between text-center">
            <div className="w-1/3">
              <p className="font-label-md text-label-md text-on-surface">{booking.trip.departureCity.name}</p>
              <p className="font-label-sm text-label-sm text-outline">{booking.trip.departureCity.countryCode}</p>
            </div>
            <div className="w-1/3">
              <span className="rounded bg-primary-fixed/30 px-2 py-1 font-label-sm text-label-sm text-primary">{distanceKm} km</span>
            </div>
            <div className="w-1/3">
              <p className="font-label-md text-label-md text-on-surface">{booking.trip.arrivalCity.name}</p>
              <p className="font-label-sm text-label-sm text-outline">{booking.trip.arrivalCity.countryCode}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-soft-glow">
          <h3 className="mb-4 font-label-md text-label-md text-outline">{isSender ? "Voyageur certifié" : "Expéditeur"}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-primary-container/20 bg-surface-container">
                {counterpart.avatarUrl ? (
                  <Image src={counterpart.avatarUrl} alt={counterpart.firstName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-label-md text-label-md text-on-surface-variant">
                    {counterpart.firstName[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface">
                  {counterpart.firstName} {counterpart.lastName}
                </p>
                <div className="flex items-center gap-1">
                  <Icon name="star" filled className="text-secondary-container" size={16} />
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {counterpart.ratingAvg.toFixed(1)} ({counterpart.ratingCount} envois)
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="md"
              disabled={!conversationData?.conversationId}
              onClick={() => conversationData && router.push(`/messages/${conversationData.conversationId}`)}
              className="flex items-center gap-2"
            >
              <Icon name="chat" size={18} />
              Contacter
            </Button>
          </div>
          {booking.counterpartContact && (
            <div className="mt-4 flex flex-col gap-1 border-t border-outline-variant/10 pt-4 font-label-sm text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-2">
                <Icon name="mail" size={16} /> {booking.counterpartContact.email}
              </span>
              {booking.counterpartContact.phone && (
                <span className="flex items-center gap-2">
                  <Icon name="call" size={16} /> {booking.counterpartContact.phone}
                </span>
              )}
            </div>
          )}

          {!blockConfirmOpen ? (
            <button
              onClick={() => setBlockConfirmOpen(true)}
              className="mt-4 flex items-center gap-1 border-t border-outline-variant/10 pt-4 font-label-sm text-label-sm text-outline hover:text-error"
            >
              <Icon name="block" size={16} />
              Bloquer cet utilisateur
            </button>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant/10 pt-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {counterpart.firstName} ne pourra plus vous contacter ni voir vos annonces.
              </p>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="md" onClick={() => setBlockConfirmOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  loading={blockUser.isPending}
                  onClick={() => blockUser.mutate(counterpart.id, { onSuccess: () => setBlockConfirmOpen(false) })}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </div>

        <section className="space-y-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Détails du colis</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailBox icon="weight" label="Poids" value={`${booking.request.weightKg} kg`} />
            <DetailBox icon="straighten" label="Taille" value={ITEM_SIZE_LABELS[booking.request.sizeEstimate]} />
            <DetailBox icon="verified_user" label="Assurance" value={booking.insuranceTier === "PREMIUM" ? "Premium (500€)" : "Basique"} />
            <DetailBox icon="inventory_2" label="Contenu" value={CATEGORY_LABELS[booking.request.category]} />
          </div>
        </section>

        {booking.status === "ACCEPTED" && booking.confirmationCode && isSender && (
          <div className="rounded-xl bg-primary-container p-4 text-on-primary">
            <p className="font-label-md text-label-md">Code de confirmation à donner au voyageur : </p>
            <p className="font-headline-lg text-headline-lg">{booking.confirmationCode}</p>
          </div>
        )}

        {actionError && <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">{actionError}</p>}

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
          onPay={() => router.push(`/paiement/${booking.id}`)}
          onPickup={() => runAction(() => pickupBooking.mutateAsync({ id: booking.id }))}
          onInTransit={() => runAction(() => inTransitBooking.mutateAsync({ id: booking.id }))}
          onDeliver={() => runAction(() => deliverBooking.mutateAsync({ id: booking.id, body: { confirmationCode } }))}
          onTrack={() => router.push(`/suivi/${booking.id}`)}
          loading={
            acceptBooking.isPending ||
            rejectBooking.isPending ||
            cancelBooking.isPending ||
            pickupBooking.isPending ||
            inTransitBooking.isPending ||
            deliverBooking.isPending
          }
        />

        {booking.status === "DELIVERED" && !alreadyReviewed && (
          <ReviewForm bookingId={booking.id} targetName={`${counterpart.firstName} ${counterpart.lastName}`} />
        )}
      </main>
    </div>
  );
}

function PinIcon({ icon }: { icon: string }) {
  return (
    <div className="z-10 rounded-full bg-surface-container-lowest p-1 ring-4 ring-surface">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10">
        <Icon name={icon} filled className="text-primary" />
      </div>
    </div>
  );
}

function DetailBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
      <Icon name={icon} className="text-primary-container" />
      <p className="font-label-sm text-label-sm text-outline">{label}</p>
      <p className="font-label-md text-label-md text-on-surface">{value}</p>
    </div>
  );
}

interface ActionAreaProps {
  booking: NonNullable<ReturnType<typeof useBooking>["data"]>["booking"];
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
        <div className="space-y-3">
          <p className="text-center font-body-md text-body-md text-on-surface-variant">
            En attente de réponse de {isSender ? "le voyageur" : "l'expéditeur"}.
          </p>
          <Button variant="outline" fullWidth onClick={props.onCancel} disabled={loading}>
            Annuler la demande
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          {isSender ? "Le voyageur" : "L'expéditeur"} vous propose cette réservation.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={props.onReject} disabled={loading}>
            Refuser
          </Button>
          <Button fullWidth onClick={props.onAccept} disabled={loading}>
            Accepter
          </Button>
        </div>
      </div>
    );
  }

  if (booking.status === "ACCEPTED" && isSender && !paid) {
    return (
      <Button fullWidth size="lg" onClick={props.onPay}>
        <Icon name="lock" />
        Procéder au paiement
      </Button>
    );
  }

  if (booking.status === "ACCEPTED" && isTraveler && paid) {
    return (
      <Button fullWidth size="lg" onClick={props.onPickup} disabled={loading}>
        <Icon name="package_2" />
        Confirmer la remise du colis
      </Button>
    );
  }

  if (booking.status === "PICKED_UP" && isTraveler) {
    return (
      <div className="space-y-3">
        <Button fullWidth size="lg" onClick={props.onInTransit} disabled={loading}>
          <Icon name="flight_takeoff" />
          Marquer comme en transit
        </Button>
        <DeliverForm {...props} />
      </div>
    );
  }

  if (booking.status === "IN_TRANSIT" && isTraveler) {
    return <DeliverForm {...props} />;
  }

  if (["ACCEPTED", "PICKED_UP", "IN_TRANSIT"].includes(booking.status)) {
    return (
      <Button fullWidth variant="outline" size="lg" onClick={props.onTrack}>
        <Icon name="local_shipping" />
        Suivre mon colis
      </Button>
    );
  }

  return null;
}

function DeliverForm(props: ActionAreaProps) {
  return (
    <div className="space-y-3 rounded-xl border border-outline-variant/30 p-4">
      <TextField
        label="Code de confirmation du destinataire"
        placeholder="6 chiffres"
        maxLength={6}
        value={props.confirmationCode}
        onChange={(e) => props.setConfirmationCode(e.target.value.replace(/\D/g, ""))}
      />
      <Button fullWidth onClick={props.onDeliver} disabled={props.loading || props.confirmationCode.length !== 6}>
        Confirmer la livraison
      </Button>
    </div>
  );
}
