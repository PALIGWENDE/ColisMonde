"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import type { BookingDTO } from "@colismonde/shared";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/store/auth";
import { useLogout } from "@/hooks/useAuthActions";
import { useUploadAvatar, useUploadDocument } from "@/hooks/useUsers";
import { useMyBookings } from "@/hooks/useBookings";
import { useUserReviews } from "@/hooks/useReviews";
import { BOOKING_STATUS_LABELS, CATEGORY_LABELS, formatDate, formatPrice } from "@/lib/format";

type Tab = "sender" | "traveler";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const uploadAvatar = useUploadAvatar();
  const uploadDocument = useUploadDocument();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("sender");

  const { data: senderBookings } = useMyBookings("sender");
  const { data: travelerBookings } = useMyBookings("traveler");
  const { data: reviewsData } = useUserReviews(user?.id);

  if (!user) return null;

  const deliveredAsTraveler = (travelerBookings?.bookings ?? []).filter((b) => b.status === "DELIVERED");
  const totalEarnings = deliveredAsTraveler.reduce((sum, b) => sum + b.agreedPrice, 0);
  const shipmentsCount = senderBookings?.bookings.length ?? 0;
  const tripsCount = travelerBookings?.bookings.length ?? 0;

  return (
    <div>
      <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-surface px-container-padding-mobile py-4 shadow-soft-glow">
        <button className="text-primary" aria-label="Langue">
          <Icon name="language" />
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</h1>
        <button className="text-on-surface-variant" aria-label="Notifications">
          <Icon name="notifications" />
        </button>
      </header>

      <main className="mx-auto max-w-md px-container-padding-mobile pt-6">
        <section className="mb-8 flex flex-col items-center text-center">
          <button onClick={() => avatarInputRef.current?.click()} className="group relative">
            <div className="mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-soft-glow transition-transform group-hover:scale-105">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.firstName} width={112} height={112} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-container font-headline-lg text-headline-lg text-on-surface-variant">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
              )}
            </div>
            {user.isVerified && (
              <div className="absolute bottom-4 right-0 rounded-full border-2 border-white bg-primary p-1">
                <Icon name="verified" filled className="text-white" size={18} />
              </div>
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar.mutate(file);
            }}
          />

          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
            {user.firstName} {user.lastName}
          </h2>
          {(user.city || user.country) && (
            <div className="mt-1 flex items-center gap-2">
              <Icon name="location_on" className="text-sm text-primary" />
              <span className="font-label-md text-label-md text-on-surface-variant">
                {[user.city, user.country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          <div className="mt-8 grid w-full grid-cols-3 rounded-xl bg-white p-4 shadow-soft-glow">
            <Stat value={shipmentsCount} label="Envois" />
            <Stat value={tripsCount} label="Trajets" border />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="font-headline-md text-headline-md text-primary">{user.ratingAvg.toFixed(1)}</span>
                <Icon name="star" filled className="text-secondary-container" size={16} />
              </div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Note</span>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => documentInputRef.current?.click()}
          className="mb-8 flex w-full items-center justify-between rounded-xl border border-primary-container/20 bg-primary-container/10 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-container p-2">
              <Icon name="verified_user" className="text-white" />
            </div>
            <div>
              <p className="font-label-md text-label-md text-primary">{user.isVerified ? "Profil Vérifié" : "Vérifier mon profil"}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {user.isVerified ? "Identité et documents validés" : "Ajoutez une pièce d'identité"}
              </p>
            </div>
          </div>
          <Icon name="chevron_right" className="text-primary" />
        </button>
        <input
          ref={documentInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadDocument.mutate({ file, type: "ID_CARD" });
          }}
        />

        <div className="flex rounded-2xl bg-surface-container-high p-1">
          <button
            onClick={() => setTab("sender")}
            className={clsx(
              "flex-1 rounded-xl py-3 text-label-md transition-colors duration-200",
              tab === "sender" ? "bg-white font-bold text-primary shadow-soft-glow" : "text-on-surface-variant",
            )}
          >
            En tant qu&apos;expéditeur
          </button>
          <button
            onClick={() => setTab("traveler")}
            className={clsx(
              "flex-1 rounded-xl py-3 text-label-md transition-colors duration-200",
              tab === "traveler" ? "bg-white font-bold text-primary shadow-soft-glow" : "text-on-surface-variant",
            )}
          >
            En tant que voyageur
          </button>
        </div>

        {tab === "traveler" && (
          <div className="space-y-8 py-6">
            <div className="relative overflow-hidden rounded-2xl border-l-4 border-primary bg-white p-6 shadow-soft-glow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant">Mes revenus</p>
                  <h3 className="mt-1 font-headline-lg text-headline-lg text-primary">{formatPrice(totalEarnings)}</h3>
                </div>
                <span className="rounded-2xl bg-primary-container/20 p-3 text-primary">
                  <Icon name="account_balance_wallet" filled size={28} />
                </span>
              </div>
            </div>

            <BookingList
              title="Mes livraisons"
              bookings={travelerBookings?.bookings ?? []}
              emptyLabel="Vous n'avez pas encore transporté de colis."
            />
          </div>
        )}

        {tab === "sender" && (
          <div className="space-y-8 py-6">
            <BookingList
              title="Mes envois"
              bookings={senderBookings?.bookings ?? []}
              emptyLabel="Vous n'avez pas encore envoyé de colis."
            />
          </div>
        )}

        {reviewsData && reviewsData.reviews.length > 0 && (
          <section className="space-y-4 pb-4">
            <h4 className="font-headline-md text-headline-md text-on-surface">Derniers avis</h4>
            <div className="space-y-3">
              {reviewsData.reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="rounded-2xl border border-surface-variant/30 bg-white p-4 shadow-soft-glow">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-label-md">
                      {review.author.firstName} {review.author.lastName[0]}.
                    </span>
                    <div className="flex text-secondary-container">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icon key={i} name="star" filled={i < review.rating} size={16} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="italic text-on-surface-variant">{review.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 space-y-4">
          <h3 className="px-1 font-label-md text-label-md uppercase tracking-widest text-outline">Compte</h3>
          <div className="overflow-hidden rounded-xl bg-white shadow-soft-glow">
            <Link
              href="/profil/parametres"
              className="group flex w-full items-center justify-between p-4 transition-colors hover:bg-surface-container-low"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-on-surface-variant transition-colors group-hover:text-primary">
                  <Icon name="settings" />
                </div>
                <span className="font-body-md text-body-md">Confidentialité et compte</span>
              </div>
              <Icon name="chevron_right" className="text-outline-variant transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="mx-4 h-[1px] bg-outline-variant/30" />
            <button
              onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/connexion") })}
              className="group flex w-full items-center justify-between p-4 transition-colors hover:bg-error/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 text-error">
                  <Icon name="logout" />
                </div>
                <span className="font-medium text-error">Déconnexion</span>
              </div>
            </button>
          </div>
        </div>

        <div className="py-6 text-center opacity-40">
          <p className="font-label-sm text-label-sm">ColisMonde v1.0.0</p>
        </div>
      </main>
    </div>
  );
}

function Stat({ value, label, border }: { value: number; label: string; border?: boolean }) {
  return (
    <div className={clsx("flex flex-col items-center", border && "border-x border-outline-variant")}>
      <span className="font-headline-md text-headline-md text-primary">{value}</span>
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{label}</span>
    </div>
  );
}

function BookingList({
  title,
  bookings,
  emptyLabel,
}: {
  title: string;
  bookings: BookingDTO[];
  emptyLabel: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-headline-md text-headline-md text-on-surface">{title}</h4>
      </div>
      {bookings.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant">{emptyLabel}</p>}
      <div className="space-y-4">
        {bookings.slice(0, 5).map((booking) => (
          <Link
            key={booking.id}
            href={`/envois/${booking.id}`}
            className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-soft-glow"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                {CATEGORY_LABELS[booking.request.category]}
              </span>
              <span
                className={clsx(
                  "flex items-center gap-1 text-label-md font-bold",
                  booking.status === "DELIVERED" ? "text-green-600" : "text-secondary",
                )}
              >
                <Icon name={booking.status === "DELIVERED" ? "check_circle" : "schedule"} size={16} />
                {BOOKING_STATUS_LABELS[booking.status]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-label-sm text-on-surface-variant">Départ</p>
                <p className="font-bold text-body-lg">{booking.trip.departureCity.name}</p>
              </div>
              <Icon name="flight_takeoff" className="text-primary" />
              <div className="flex-1 text-right">
                <p className="text-label-sm text-on-surface-variant">Arrivée</p>
                <p className="font-bold text-body-lg">{booking.trip.arrivalCity.name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-surface-variant pt-4">
              <p className="text-label-md text-on-surface-variant">{formatDate(booking.createdAt)}</p>
              <p className="text-label-md font-bold text-secondary">{formatPrice(booking.agreedPrice)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
