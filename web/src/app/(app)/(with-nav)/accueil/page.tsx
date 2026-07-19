"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TripCard } from "@/components/domain/TripCard";
import { RequestCard } from "@/components/domain/RequestCard";
import { useSearchTrips } from "@/hooks/useTrips";
import { useSearchRequests } from "@/hooks/useRequests";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth";

export default function AccueilPage() {
  const user = useAuthStore((s) => s.user);
  const { data: tripsData, isLoading: tripsLoading } = useSearchTrips({});
  const { data: requestsData, isLoading: requestsLoading } = useSearchRequests({});
  const { data: notificationsData } = useNotifications();
  const unreadCount = notificationsData?.notifications.filter((n) => !n.isRead).length ?? 0;

  return (
    <div>
      <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-surface px-container-padding-mobile py-4 shadow-soft-glow">
        <div className="flex items-center gap-2">
          <Icon name="language" className="text-primary" />
          <h1 className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</h1>
        </div>
        <Link href="/profil" className="relative transition-transform active:scale-95" aria-label="Notifications">
          <Icon name="notifications" className="text-on-surface-variant" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-secondary" />}
        </Link>
      </header>

      <main className="mx-auto max-w-md">
        <section className="mt-6 px-container-padding-mobile">
          {user && (
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
              Bonjour {user.firstName}, où envoyez-vous un colis aujourd&apos;hui ?
            </p>
          )}
          <Link
            href="/recherche"
            className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-soft-glow"
          >
            <Icon name="search" className="text-primary" />
            <span className="font-body-md text-body-md text-outline">Rechercher un trajet ou une ville...</span>
          </Link>
        </section>

        <section className="mt-8 space-y-4 px-container-padding-mobile">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline-md text-lg text-on-surface">Voyageurs disponibles</h2>
            <Link href="/recherche" className="font-label-md text-label-md text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          {tripsLoading && <SkeletonList />}
          {!tripsLoading && tripsData?.trips.length === 0 && <EmptyState label="Aucun trajet disponible pour le moment." />}
          {tripsData?.trips.slice(0, 5).map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </section>

        <section className="mt-8 space-y-4 px-container-padding-mobile pb-6">
          <h2 className="px-1 pt-4 font-headline-md text-lg text-on-surface">Demandes d&apos;envoi</h2>
          {requestsLoading && <SkeletonList />}
          {!requestsLoading && requestsData?.requests.length === 0 && <EmptyState label="Aucune demande d'envoi ouverte." />}
          {requestsData?.requests.slice(0, 5).map((request) => <RequestCard key={request.id} request={request} />)}
        </section>
      </main>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container" />
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-center font-body-md text-body-md text-on-surface-variant">
      {label}
    </div>
  );
}
