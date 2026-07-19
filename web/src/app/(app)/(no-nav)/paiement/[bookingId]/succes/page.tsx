"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBooking } from "@/hooks/useBookings";
import { useBookingPayment } from "@/hooks/usePayments";
import { formatDateTime, formatPrice } from "@/lib/format";

export default function PaymentSuccessPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { data: bookingData } = useBooking(params.bookingId);
  const { data: paymentData } = useBookingPayment(params.bookingId);
  const [copied, setCopied] = useState(false);

  const booking = bookingData?.booking;
  const payment = paymentData?.payment;

  const copyId = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background">
      <div className="w-full max-w-md flex-1 px-container-padding-mobile py-stack-lg">
        <div className="relative mb-stack-md mt-stack-lg flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-container/10 shadow-[0px_4px_20px_rgba(0,158,73,0.15)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Icon name="check" className="text-5xl text-white" />
            </div>
          </div>
        </div>

        <div className="mb-stack-lg text-center">
          <h1 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Paiement réussi !</h1>
          <p className="px-4 font-body-md text-body-md text-on-surface-variant">
            Votre colis est désormais assuré et prêt à être expédié.
          </p>
        </div>

        <div className="relative mb-stack-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-soft-glow">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tertiary-fixed">
              <Icon name="verified_user" filled className="text-tertiary" />
            </div>
            <div>
              <h3 className="font-label-md text-label-md text-on-surface">Transaction sécurisée</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Protection ColisMonde active</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-white shadow-soft-glow">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Récapitulatif</span>
              <span className="rounded-full bg-secondary-container/10 px-2 py-1 font-label-sm text-label-sm font-bold text-secondary">Payé</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between border-b border-surface-variant pb-4">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">ID Transaction</p>
                  <p className="font-label-md text-label-md text-on-surface">#{booking?.id.slice(0, 12).toUpperCase()}</p>
                </div>
                <button onClick={copyId} aria-label="Copier">
                  <Icon name={copied ? "check" : "content_copy"} className={copied ? "text-primary" : "text-outline-variant"} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Montant Total</p>
                  <p className="font-headline-md text-headline-md text-primary">{booking ? formatPrice(booking.totalPrice) : "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Date</p>
                  <p className="font-label-md text-label-md text-on-surface">{payment?.paidAt ? formatDateTime(payment.paidAt) : "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-stack-lg mt-8 flex items-center gap-2">
          <Icon name="shield" className="text-sm text-on-surface-variant" />
          <span className="font-label-sm text-label-sm text-on-surface-variant">Assurance multirisque incluse</span>
        </div>

        <div className="mt-auto w-full space-y-4">
          <Button fullWidth size="lg" onClick={() => booking && router.push(`/suivi/${booking.id}`)} className="flex items-center justify-center gap-2">
            <Icon name="package_2" />
            Suivre mon colis
          </Button>
          <Button fullWidth size="lg" variant="outline" onClick={() => router.push("/accueil")}>
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    </main>
  );
}
