"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import type { InsuranceTier } from "@colismonde/shared";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBooking, useUpdateInsurance } from "@/hooks/useBookings";
import { useConfirmPayment, useCreatePaymentIntent } from "@/hooks/usePayments";
import { CATEGORY_LABELS, formatPrice } from "@/lib/format";
import { ApiClientError } from "@/lib/apiClient";

export default function PaymentSummaryPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { data, isLoading } = useBooking(params.bookingId);
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
      router.push(`/paiement/${booking.id}/succes`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Le paiement a échoué");
    } finally {
      setPaying(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <div>
        <TopAppBar title="ColisMonde" showBack />
        <div className="p-container-padding-mobile">
          <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-40">
      <TopAppBar title="ColisMonde" showBack actions={<Icon name="notifications" className="text-primary" />} />

      <main className="space-y-stack-md px-container-padding-mobile pt-6">
        <section className="rounded-2xl bg-white p-4 shadow-soft-glow">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-center">
              <p className="font-label-sm text-on-surface-variant">DÉPART</p>
              <p className="font-headline-md text-primary">{booking.trip.departureCity.countryCode}</p>
              <p className="font-label-md text-on-surface">{booking.trip.departureCity.name}</p>
            </div>
            <div className="flex flex-1 flex-col items-center px-4">
              <Icon name="flight_takeoff" className="mb-1 text-secondary" />
              <div className="flight-path" />
            </div>
            <div className="text-center">
              <p className="font-label-sm text-on-surface-variant">ARRIVÉE</p>
              <p className="font-headline-md text-primary">{booking.trip.arrivalCity.countryCode}</p>
              <p className="font-label-md text-on-surface">{booking.trip.arrivalCity.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-surface-container pt-3">
            <Icon name="package_2" size={18} className="text-on-surface-variant" />
            <p className="font-label-md text-on-surface-variant">
              Colis ({CATEGORY_LABELS[booking.request.category]}) • {booking.request.weightKg}kg
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-label-md uppercase tracking-wider text-on-surface-variant">Résumé des coûts</h2>
          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-soft-glow">
            <Row label="Frais d'expédition" value={formatPrice(booking.agreedPrice)} />
            <Row label="Frais de service" value={formatPrice(booking.serviceFee)} />
            <Row label="Assurance" value={formatPrice(booking.insuranceFee)} />
            <div className="flex items-center justify-between border-t border-dashed border-outline-variant pt-4">
              <span className="font-headline-md text-on-surface">Total</span>
              <span className="font-headline-md text-primary">{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-label-md uppercase tracking-wider text-on-surface-variant">Assurance voyage</h2>
          <div className="grid grid-cols-1 gap-3">
            <InsuranceOption
              label="Basique"
              description="Gratuit"
              selected={booking.insuranceTier === "BASIC"}
              onClick={() => selectInsurance("BASIC")}
            />
            <InsuranceOption
              label="Premium"
              description="15€ — Couvre jusqu'à 500€"
              recommended
              selected={booking.insuranceTier === "PREMIUM"}
              onClick={() => selectInsurance("PREMIUM")}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-label-md uppercase tracking-wider text-on-surface-variant">Mode de paiement</h2>
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft-glow">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-surface-container">
                <Icon name="credit_card" className="text-on-surface-variant" />
              </div>
              <div>
                <p className="font-label-md text-on-surface">Carte de paiement (démo)</p>
                <p className="font-label-sm text-on-surface-variant">Paiement simulé — aucune carte réelle requise</p>
              </div>
            </div>
            <Icon name="check_circle" className="text-primary" />
          </div>
        </section>

        {error && <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-on-error-container">{error}</p>}
      </main>

      <div className="fixed bottom-0 left-0 z-50 w-full bg-white p-container-padding-mobile pb-safe shadow-[0px_-4px_20px_rgba(0,158,73,0.08)]">
        <Button fullWidth size="lg" onClick={pay} loading={paying} className="flex items-center justify-center gap-3">
          <Icon name="lock" filled />
          Payer {formatPrice(booking.totalPrice)}
        </Button>
        <p className="mt-3 px-4 text-center font-label-sm text-on-surface-variant">
          Paiement sécurisé. En payant, vous acceptez nos conditions générales de transport.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-label-md text-on-surface">{value}</span>
    </div>
  );
}

function InsuranceOption({
  label,
  description,
  recommended,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  recommended?: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative flex items-center rounded-2xl bg-white p-4 text-left shadow-soft-glow transition-colors",
        selected ? "border-2 border-primary" : "border-2 border-transparent",
      )}
    >
      <div className={clsx("flex h-5 w-5 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-outline-variant")}>
        {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>
      <div className="ml-4 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-label-md text-on-surface">{label}</p>
          {recommended && (
            <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">RECOMMANDÉ</span>
          )}
        </div>
        <p className="font-label-sm text-on-surface-variant">{description}</p>
      </div>
      {selected && <Icon name="verified_user" className="text-primary" />}
    </button>
  );
}
