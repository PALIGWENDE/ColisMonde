"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CityDTO, PackageCategory } from "@colismonde/shared";
import { PACKAGE_CATEGORIES } from "@colismonde/shared";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
import { Button } from "@/components/ui/Button";
import { TripCard } from "@/components/domain/TripCard";
import { useSearchTrips } from "@/hooks/useTrips";
import { CATEGORY_LABELS } from "@/lib/format";

function RecherchePageContent() {
  const searchParams = useSearchParams();
  const [departureCity, setDepartureCity] = useState<CityDTO | null>(null);
  const [arrivalCity, setArrivalCity] = useState<CityDTO | null>(null);
  const [category, setCategory] = useState<PackageCategory | undefined>(undefined);

  const filters = {
    departureCityId: departureCity?.id ?? searchParams.get("departureCityId") ?? undefined,
    arrivalCityId: arrivalCity?.id ?? searchParams.get("arrivalCityId") ?? undefined,
    category,
  };

  const { data, isLoading } = useSearchTrips(filters);
  const trips = data?.trips ?? [];

  return (
    <div>
      <header className="glass-header sticky top-0 z-40 flex w-full items-center justify-between px-container-padding-mobile py-4 shadow-soft-glow">
        <div className="flex items-center gap-2">
          <Icon name="language" className="text-primary" />
          <span className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-container-padding-mobile pb-10 md:px-container-padding-desktop">
        <section className="mb-8 mt-6">
          <h1 className="mb-6 font-headline-lg-mobile text-headline-lg-mobile text-on-background">Trouvez un voyageur</h1>
          <div className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-soft-glow">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CityAutocomplete label="Départ" value={departureCity} onChange={setDepartureCity} />
              <CityAutocomplete label="Arrivée" icon="flight_land" value={arrivalCity} onChange={setArrivalCity} />
            </div>
            <Button fullWidth type="button" className="flex items-center justify-center gap-2">
              <Icon name="search" />
              Rechercher des trajets
            </Button>
          </div>
        </section>

        <div className="hide-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory(undefined)}
            className={clsx(
              "whitespace-nowrap rounded-full border px-4 py-2 font-label-sm text-label-sm",
              !category ? "border-primary-container/20 bg-primary-container/10 text-primary-container" : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant",
            )}
          >
            Tout afficher
          </button>
          {PACKAGE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={clsx(
                "whitespace-nowrap rounded-full border px-4 py-2 font-label-sm text-label-sm",
                category === c ? "border-primary-container/20 bg-primary-container/10 text-primary-container" : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant",
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-background">
            {isLoading ? "Recherche..." : `${trips.length} trajet${trips.length > 1 ? "s" : ""} trouvé${trips.length > 1 ? "s" : ""}`}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>

        {!isLoading && trips.length === 0 && (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 p-8 text-center font-body-md text-body-md text-on-surface-variant">
            Aucun trajet ne correspond à votre recherche pour le moment.
          </div>
        )}
      </main>
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense>
      <RecherchePageContent />
    </Suspense>
  );
}
