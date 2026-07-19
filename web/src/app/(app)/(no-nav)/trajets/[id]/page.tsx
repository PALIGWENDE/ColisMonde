"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useTrip(params.id);
  const user = useAuthStore((s) => s.user);
  const [showBookingForm, setShowBookingForm] = useState(false);

  if (isLoading) {
    return (
      <div>
        <TopAppBar title="Détails du trajet" showBack />
        <div className="p-container-padding-mobile">
          <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
        </div>
      </div>
    );
  }

  const trip = data?.trip;
  if (!trip) {
    return (
      <div>
        <TopAppBar title="Détails du trajet" showBack />
        <p className="p-container-padding-mobile font-body-md text-body-md text-on-surface-variant">Trajet introuvable.</p>
      </div>
    );
  }

  const isOwnTrip = user?.id === trip.traveler.id;

  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar title="Détails du trajet" showBack actions={<Icon name="share" className="text-primary" />} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-container-padding-mobile pb-40 pt-stack-md">
        <div className="relative mb-gutter overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-soft-glow">
          <div className="flex flex-col items-center">
            <div className="mb-8 flex w-full items-center justify-between">
              <div className="text-center">
                <p className="mb-1 font-headline-md text-headline-md text-primary">{trip.departureCity.name}</p>
                <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                  {trip.departureCity.countryCode}
                </p>
              </div>
              <div className="relative flex h-10 flex-1 items-center justify-center px-4">
                <div className="flight-path" />
                <Icon name={TRANSPORT_MODE_ICONS[trip.transportMode]} className="absolute bg-surface-container-lowest px-1 text-primary plane-float" />
              </div>
              <div className="text-center">
                <p className="mb-1 font-headline-md text-headline-md text-primary">{trip.arrivalCity.name}</p>
                <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                  {trip.arrivalCity.countryCode}
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-4 border-t border-outline-variant/30 pt-6">
              <InfoStat icon="calendar_today" label="Date" value={formatDate(trip.departureDate)} />
              <InfoStat icon="weight" label="Poids" value={`${trip.availableWeightKg}kg disp.`} />
              <InfoStat icon="payments" label="Récompense" value={`${trip.pricePerKg}€/kg`} highlight />
            </div>
          </div>
        </div>

        <section className="mb-gutter">
          <h2 className="mb-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Voyageur</h2>
          <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-soft-glow">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary-container/20 bg-surface-container">
                {trip.traveler.avatarUrl ? (
                  <Image src={trip.traveler.avatarUrl} alt={trip.traveler.firstName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-headline-md text-headline-md text-on-surface-variant">
                    {trip.traveler.firstName[0]}
                  </div>
                )}
                {trip.traveler.isVerified && (
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-primary p-0.5">
                    <Icon name="verified" filled className="text-white" size={14} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-headline-md text-headline-md leading-tight text-primary">
                  {trip.traveler.firstName} {trip.traveler.lastName}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <Icon name="star" filled className="text-secondary" size={18} />
                  <p className="font-label-md text-label-md">
                    {trip.traveler.ratingAvg.toFixed(1)} <span className="font-normal text-on-surface-variant">({trip.traveler.ratingCount} avis)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-gutter">
          <h2 className="mb-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Détails de l&apos;envoi</h2>
          <div className="grid grid-cols-1 gap-stack-md">
            <DetailItem icon="straighten" label="Taille maximale" value={ITEM_SIZE_LABELS[trip.maxItemSize]} />
            <DetailItem
              icon="category"
              label="Catégories acceptées"
              value={trip.acceptedCategories.map((c) => CATEGORY_LABELS[c]).join(", ")}
            />
            {trip.notes && <DetailItem icon="inventory_2" label="Notes du voyageur" value={trip.notes} />}
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-secondary-container/20 bg-secondary-container/10 p-4">
          <Icon name="info" className="text-secondary" />
          <p className="font-body-md text-body-md text-on-surface-variant">
            Ce voyageur s&apos;est engagé à respecter les délais de livraison. Pensez à bien emballer vos objets fragiles.
          </p>
        </div>

        {showBookingForm && !isOwnTrip && (
          <BookingForm trip={trip} onClose={() => setShowBookingForm(false)} onSuccess={(bookingId) => router.push(`/envois/${bookingId}`)} />
        )}
      </main>

      {!isOwnTrip && !showBookingForm && (
        <footer className="fixed bottom-0 left-0 z-40 w-full border-t border-outline-variant/10 bg-surface/80 p-container-padding-mobile pb-safe backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="font-label-sm text-label-sm text-on-surface-variant">À partir de</p>
              <p className="font-headline-md text-headline-md font-bold text-secondary">{formatPrice(trip.pricePerKg)}/kg</p>
            </div>
            <Button size="lg" fullWidth onClick={() => setShowBookingForm(true)} className="flex-1">
              <Icon name="calendar_add_on" />
              Réserver ce trajet
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

function InfoStat({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <Icon name={icon} className="mb-1 text-secondary" />
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className={clsx("font-label-md text-label-md font-bold", highlight && "text-secondary")}>{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border-l-4 border-primary bg-surface-container-lowest p-4 shadow-soft-glow">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10 text-primary">
        <Icon name={icon} />
      </div>
      <div>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <p className="font-label-md text-label-md font-semibold">{value}</p>
      </div>
    </div>
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={submit} className="mt-gutter space-y-4 rounded-xl border border-primary-container/20 bg-surface-container-lowest p-5 shadow-soft-glow">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md text-on-background">Décrivez votre colis</h3>
        <button type="button" onClick={onClose} aria-label="Fermer">
          <Icon name="close" className="text-on-surface-variant" />
        </button>
      </div>

      <TextField
        label={`Poids (kg, max ${trip.availableWeightKg})`}
        type="number"
        step="0.1"
        min="0.1"
        max={trip.availableWeightKg}
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
      />

      <div className="space-y-1.5">
        <span className="block font-label-md text-label-md text-on-surface-variant">Catégorie</span>
        <div className="flex flex-wrap gap-2">
          {trip.acceptedCategories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={clsx(
                "rounded-full px-4 py-2 text-label-sm font-label-sm",
                category === c ? "bg-primary-container text-on-primary" : "border border-outline-variant/40 text-on-surface-variant",
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block font-label-md text-label-md text-on-surface-variant">Taille</span>
        <div className="flex gap-2">
          {ITEM_SIZES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSizeEstimate(s)}
              className={clsx(
                "flex-1 rounded-xl py-2 text-label-sm font-label-sm",
                sizeEstimate === s ? "bg-primary-container text-on-primary" : "border border-outline-variant/40 text-on-surface-variant",
              )}
            >
              {ITEM_SIZE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="pkg-description">
          Description
        </label>
        <textarea
          id="pkg-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md focus:border-primary-container focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-primary-container/10 p-4">
        <span className="font-label-md text-label-md text-on-surface-variant">Prix estimé</span>
        <span className="font-headline-md text-headline-md text-primary">{formatPrice(estimatedPrice)}</span>
      </div>

      {error && <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">{error}</p>}

      <Button type="submit" fullWidth size="lg" loading={createRequest.isPending || createBooking.isPending}>
        Envoyer la demande de réservation
      </Button>
      <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
        Le voyageur doit accepter votre demande avant le paiement.
      </p>
    </form>
  );
}
