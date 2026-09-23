"use client";

import Link from "next/link";
import { useState } from "react";
import type { CityDTO } from "@colismonde/shared";
import { Icon } from "@/components/ui/Icon";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
import { Button } from "@/components/ui/Button";
import { GlobeSection } from "@/components/globe/GlobeSection";
import { useSearchTrips } from "@/hooks/useTrips";
import { useAuthStore } from "@/store/auth";
import { formatDate } from "@/lib/format";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: "security",
    title: "Paiement 100% sécurisé",
    description: "L'argent n'est débloqué qu'à la réception de votre colis. ColisMonde garantit chaque transaction pour votre tranquillité d'esprit.",
    tone: "primary" as const,
  },
  {
    icon: "savings",
    title: "Économique",
    description: "Jusqu'à 70% moins cher que les transporteurs traditionnels pour vos envois internationaux.",
    tone: "light" as const,
  },
  {
    icon: "eco",
    title: "Éco-responsable",
    description: "Optimisez l'espace vide dans les bagages existants et réduisez l'empreinte carbone de vos colis.",
    tone: "light" as const,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = status === "authenticated";
  const [departureCity, setDepartureCity] = useState<CityDTO | null>(null);
  const [arrivalCity, setArrivalCity] = useState<CityDTO | null>(null);
  const { data } = useSearchTrips({});
  const trips = (data?.trips ?? []).slice(0, 3);

  const goSearch = () => {
    const params = new URLSearchParams();
    if (departureCity) params.set("departureCityId", departureCity.id);
    if (arrivalCity) params.set("arrivalCityId", arrivalCity.id);
    router.push(`/recherche${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-50 w-full bg-surface shadow-soft-glow">
        <div className="mx-auto flex w-full items-center justify-between px-container-padding-mobile py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <Icon name="public" />
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/accueil" className="rounded-xl bg-primary-container px-5 py-2.5 font-label-md text-label-md text-on-primary">
                Aller à l&apos;accueil
              </Link>
            ) : (
              <>
                <Link href="/connexion" className="hidden font-label-md text-label-md text-on-surface-variant hover:text-primary sm:block">
                  Se connecter
                </Link>
                <Link href="/inscription" className="rounded-xl bg-primary-container px-5 py-2.5 font-label-md text-label-md text-on-primary">
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-container-padding-mobile md:px-container-padding-desktop">
        <section className="py-12 md:py-20">
          <div className="flex flex-col items-center gap-10 md:flex-row">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/10 px-4 py-1 font-label-md text-label-md text-primary">
                <Icon name="public" size={18} />
                <span>Crowdshipping de confiance</span>
              </div>
              <h1 className="max-w-xl font-headline-lg-mobile text-headline-lg-mobile text-on-background md:font-headline-lg md:text-headline-lg">
                Envoyez vos colis partout dans le monde avec des voyageurs de confiance
              </h1>
              <p className="max-w-lg font-body-lg text-body-lg text-on-surface-variant">
                Une plateforme solidaire et sécurisée pour expédier vos paquets à moindre coût tout en permettant aux voyageurs
                d&apos;amortir leurs trajets.
              </p>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Link
                  href={isAuthenticated ? "/annonce/nouvelle" : "/inscription"}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-8 py-4 font-label-md text-label-md text-white transition-[box-shadow,transform] hover:shadow-lg active:scale-95"
                >
                  <Icon name="package_2" />
                  Envoyer un colis
                </Link>
                <Link
                  href={isAuthenticated ? "/annonce/nouvelle" : "/inscription"}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary-container px-8 py-4 font-label-md text-label-md text-primary-container transition-[background-color,transform] hover:bg-primary-container/5 active:scale-95"
                >
                  <Icon name="travel_explore" />
                  Proposer un trajet
                </Link>
              </div>
            </div>

            <div className="relative hidden w-full flex-1 md:block">
              <GlobeSection />
              <div className="glass-card absolute -bottom-6 -left-6 space-y-2 rounded-2xl p-6 shadow-soft-glow">
                <p className="font-headline-md text-headline-md text-primary-container">12.5k+</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Trajets effectués</p>
              </div>
              <div className="glass-card absolute right-0 top-10 flex items-center gap-4 rounded-2xl p-6 shadow-soft-glow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-white">
                  <Icon name="verified" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-background">Profils vérifiés</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">100% de sécurité</p>
                </div>
              </div>
            </div>

            <div className="w-full md:hidden">
              <GlobeSection />
            </div>
          </div>
        </section>

        <div className="relative z-10 mb-16 -mt-10 hidden md:block">
          <div className="grid grid-cols-4 items-center gap-4 rounded-3xl border border-surface-variant/50 bg-white p-6 shadow-soft-glow">
            <div className="space-y-1 px-4">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Départ</span>
              <CityAutocomplete value={departureCity} onChange={setDepartureCity} placeholder="Ville ou pays" />
            </div>
            <div className="space-y-1 border-l border-surface-variant px-4">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Destination</span>
              <CityAutocomplete value={arrivalCity} onChange={setArrivalCity} icon="near_me" placeholder="Ville ou pays" />
            </div>
            <div className="col-span-2">
              <Button fullWidth size="lg" onClick={goSearch}>
                Rechercher un trajet
              </Button>
            </div>
          </div>
        </div>

        <section className="py-12">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-background">Trajets populaires</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Les routes les plus fréquentées cette semaine</p>
            </div>
            <Link href="/recherche" className="flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
              Voir tout <Icon name="arrow_forward" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trajets/${trip.id}`}
                className="group overflow-hidden rounded-[24px] bg-white shadow-soft-glow transition-transform duration-300 hover:-translate-y-2"
              >
                <div className="relative flex h-48 items-end bg-gradient-to-br from-primary-container to-tertiary p-6">
                  <div className="text-white">
                    <p className="font-label-sm text-label-sm uppercase tracking-widest opacity-80">{formatDate(trip.departureDate)}</p>
                    <h3 className="font-headline-md text-headline-md">
                      {trip.departureCity.name} → {trip.arrivalCity.name}
                    </h3>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container font-label-md text-label-md text-on-surface-variant">
                        {trip.traveler.firstName[0]}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md">{trip.traveler.firstName}</p>
                        <div className="flex items-center gap-1 text-secondary">
                          <Icon name="star" filled size={14} />
                          <span className="text-xs">{trip.traveler.ratingAvg.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary-container/20 px-3 py-1 font-label-md text-label-md text-secondary">
                      Dès {trip.pricePerKg}€
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 font-label-sm text-label-sm text-on-surface-variant">
                    <Icon name="luggage" size={18} />
                    <span>Jusqu&apos;à {trip.availableWeightKg}kg disponibles</span>
                  </div>
                </div>
              </Link>
            ))}
            {trips.length === 0 && (
              <p className="col-span-full text-center font-body-md text-body-md text-on-surface-variant">
                Les premiers trajets apparaîtront ici dès leur publication.
              </p>
            )}
          </div>
        </section>

        <section className="py-16">
          <h2 className="mb-10 text-center font-headline-md text-headline-md text-on-background">Pourquoi choisir ColisMonde ?</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-[32px] bg-primary-container p-8 text-white md:col-span-2">
              <div className="relative z-10 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Icon name={FEATURES[0].icon} className="text-white" />
                </div>
                <h3 className="font-headline-md text-headline-md">{FEATURES[0].title}</h3>
                <p className="max-w-md font-body-md text-body-md opacity-90">{FEATURES[0].description}</p>
              </div>
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
            </div>
            {FEATURES.slice(1).map((f) => (
              <div key={f.title} className="space-y-4 rounded-[32px] bg-white p-8 shadow-soft-glow">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container/10">
                  <Icon name={f.icon} className="text-secondary" />
                </div>
                <h3 className="font-headline-md text-headline-md">{f.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{f.description}</p>
              </div>
            ))}
            <div className="flex flex-col items-center gap-8 overflow-hidden rounded-[32px] bg-secondary-container p-8 text-on-secondary-fixed md:col-span-2 md:flex-row">
              <div className="flex-1 space-y-4">
                <h3 className="font-headline-md text-headline-md">Suivi en temps réel</h3>
                <p className="font-body-md text-body-md opacity-90">
                  Communiquez directement avec votre voyageur via notre messagerie intégrée et suivez le trajet de votre colis.
                </p>
              </div>
              <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 md:w-64">
                <div className="w-full space-y-4 px-8">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-2/3 bg-white" />
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase text-white">
                    <span>Paris</span>
                    <span>En vol</span>
                    <span>Dakar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-10 border-t border-surface-variant/30 bg-surface-container-lowest py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-container-padding-mobile md:px-container-padding-desktop">
          <div className="flex flex-col items-center gap-4 md:w-full md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Icon name="public" className="text-primary-container" />
              <span className="font-headline-md text-headline-md text-primary-container">ColisMonde</span>
            </div>
            <nav className="flex gap-6 font-label-sm text-label-sm text-on-surface-variant">
              <Link href="/confidentialite" className="hover:text-primary hover:underline">
                Confidentialité
              </Link>
              <Link href="/conditions" className="hover:text-primary hover:underline">
                Conditions générales
              </Link>
              <Link href="/suppression-compte" className="hover:text-primary hover:underline">
                Suppression de compte
              </Link>
            </nav>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
            © {new Date().getFullYear()} ColisMonde International. Fait avec passion pour les voyageurs.
          </p>
        </div>
      </footer>
    </div>
  );
}
