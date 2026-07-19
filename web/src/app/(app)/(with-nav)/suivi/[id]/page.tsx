"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBooking, useBookingTracking, useUploadProof } from "@/hooks/useBookings";
import { useBookingConversation } from "@/hooks/useMessages";
import { useAuthStore } from "@/store/auth";
import { BOOKING_STATUS_LABELS, formatDateTime } from "@/lib/format";
import type { BookingStatus } from "@colismonde/shared";

const TIMELINE_ORDER: BookingStatus[] = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export default function TrackingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: bookingData } = useBooking(params.id);
  const { data: trackingData } = useBookingTracking(params.id);
  const { data: conversationData } = useBookingConversation(params.id);
  const uploadProof = useUploadProof();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const booking = bookingData?.booking;
  const events = trackingData?.events ?? [];
  const isTraveler = booking?.traveler.id === user?.id;
  const counterpart = booking ? (booking.sender.id === user?.id ? booking.traveler : booking.sender) : null;

  const copyCode = () => {
    if (!booking?.confirmationCode) return;
    navigator.clipboard.writeText(booking.confirmationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!booking) {
    return (
      <div>
        <TopAppBar title="Suivi de colis" showBack />
      </div>
    );
  }

  return (
    <div>
      <TopAppBar title="Suivi de colis" showBack actions={<Icon name="notifications" className="text-primary" />} />

      <main className="space-y-gutter px-container-padding-mobile pt-6 pb-12">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-soft-glow">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">ID Expédition</span>
              <p className="font-headline-md text-headline-md text-primary">{booking.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="rounded-full bg-secondary-container/20 px-3 py-1">
              <span className="font-label-sm text-label-sm font-bold text-secondary">{BOOKING_STATUS_LABELS[booking.status]}</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline">De</span>
              <span className="font-label-md text-label-md">{booking.trip.departureCity.name}</span>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4">
              <div className="absolute top-1/2 w-full border-t border-dashed border-outline-variant" />
              <Icon name="flight_takeoff" filled className="relative z-10 bg-surface-container-lowest px-2 text-primary-container" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-label-sm text-label-sm text-outline">À</span>
              <span className="font-label-md text-label-md">{booking.trip.arrivalCity.name}</span>
            </div>
          </div>
        </section>

        {booking.confirmationCode && (
          <section className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary shadow-lg">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Icon name="verified_user" size={96} />
            </div>
            <div className="relative z-10">
              <h3 className="mb-2 font-label-md text-label-md text-on-primary-container">Code de confirmation</h3>
              <button onClick={copyCode} className="mt-4 flex justify-between gap-2" aria-label="Copier le code">
                {booking.confirmationCode.split("").map((digit, i) => (
                  <span key={i} className="flex h-14 w-12 items-center justify-center rounded-lg border border-on-primary/20 bg-on-primary/10 font-headline-md text-headline-md">
                    {digit}
                  </span>
                ))}
              </button>
              <p className="mt-4 font-label-sm text-label-sm italic opacity-80">
                {copied ? "Code copié dans le presse-papier !" : "Présentez ce code au voyageur lors de la réception."}
              </p>
            </div>
          </section>
        )}

        <section className="py-4">
          <h2 className="mb-6 font-headline-md text-headline-md text-on-surface">Suivi détaillé</h2>
          <div className="relative space-y-10 pl-8">
            <div className="absolute bottom-4 left-[15px] top-4 w-[2px] bg-outline-variant" />
            {TIMELINE_ORDER.map((status) => {
              const event = events.find((e) => e.status === status);
              const done = Boolean(event);
              const isCurrent = booking.status === status;
              return (
                <div key={status} className={clsx("relative", !done && "opacity-50")}>
                  <div
                    className={clsx(
                      "absolute -left-10 z-10 flex h-8 w-8 items-center justify-center rounded-full",
                      done ? (isCurrent ? "animate-pulse bg-primary-container" : "bg-primary") : "border-2 border-outline-variant bg-surface-container-high",
                    )}
                  >
                    {done ? (
                      isCurrent ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      ) : (
                        <Icon name="check" className="text-lg text-white" />
                      )
                    ) : (
                      <Icon name="inventory_2" className="text-lg text-outline-variant" />
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h4 className={clsx("font-label-md text-label-md text-on-surface", isCurrent && "font-bold text-primary")}>
                      {event?.label ?? BOOKING_STATUS_LABELS[status]}
                    </h4>
                    <span className="font-label-sm text-label-sm text-outline">
                      {event ? formatDateTime(event.occurredAt) : isCurrent ? "Actuel" : "À venir"}
                    </span>
                  </div>
                  {event?.description && <p className="font-body-md text-on-surface-variant">{event.description}</p>}
                  {event?.location && (
                    <p className="mt-1 flex items-center gap-1 font-label-sm text-label-sm text-outline">
                      <Icon name="location_on" size={14} /> {event.location}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Preuve de livraison</h2>
          <div
            className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center transition-colors hover:bg-surface-container"
            onClick={() => booking.status === "DELIVERED" && isTraveler && fileInputRef.current?.click()}
          >
            {booking.proofPhotoUrl ? (
              <div className="relative mb-4 h-48 w-full max-w-[280px] overflow-hidden rounded-lg shadow-sm">
                <Image src={booking.proofPhotoUrl} alt="Preuve de livraison" fill className="object-cover" />
              </div>
            ) : (
              <div className="relative mb-4 flex h-32 w-full max-w-[280px] items-center justify-center rounded-lg bg-surface-container">
                <Icon name="photo_camera" size={40} className="text-outline-variant" />
              </div>
            )}
            <p className="font-label-md text-label-md text-on-surface-variant">
              {booking.proofPhotoUrl ? "Photo enregistrée" : "La photo apparaîtra ici une fois livrée"}
            </p>
            {booking.status === "DELIVERED" && isTraveler && !booking.proofPhotoUrl && (
              <p className="font-label-sm text-label-sm text-outline">Appuyez pour ajouter une photo de preuve</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadProof.mutate({ id: booking.id, file });
            }}
          />
        </section>

        {counterpart && (
          <section className="flex items-center gap-4 rounded-xl bg-surface-container-highest p-4">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-surface-container">
              {counterpart.avatarUrl ? (
                <Image src={counterpart.avatarUrl} alt={counterpart.firstName} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-label-md text-label-md">{counterpart.firstName[0]}</div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-label-md text-label-md">
                {counterpart.firstName} {counterpart.lastName}
              </h4>
              <div className="flex items-center gap-1">
                <Icon name="star" filled className="text-secondary" size={16} />
                <span className="font-label-sm text-label-sm text-on-surface-variant">{counterpart.ratingAvg.toFixed(1)}</span>
              </div>
            </div>
            <Button
              size="md"
              disabled={!conversationData?.conversationId}
              onClick={() => conversationData && router.push(`/messages/${conversationData.conversationId}`)}
              className="flex items-center gap-2"
            >
              <Icon name="chat_bubble" size={18} />
              Contacter
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}
