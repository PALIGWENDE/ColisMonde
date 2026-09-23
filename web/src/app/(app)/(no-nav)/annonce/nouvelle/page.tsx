"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { CityDTO, ItemSize, PackageCategory, TransportMode } from "@colismonde/shared";
import { PACKAGE_CATEGORIES, ITEM_SIZES, TRANSPORT_MODES } from "@colismonde/shared";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { useCreateRequest } from "@/hooks/useRequests";
import { useCreateTrip } from "@/hooks/useTrips";
import { CATEGORY_LABELS, ITEM_SIZE_LABELS, TRANSPORT_MODE_LABELS } from "@/lib/format";
import { ApiClientError } from "@/lib/apiClient";

type Mode = "send" | "travel";

export default function NouvelleAnnoncePage() {
  const [mode, setMode] = useState<Mode>("send");

  return (
    <div>
      <TopAppBar title="Nouvelle annonce" showBack />
      <main className="mx-auto max-w-md space-y-6 px-container-padding-mobile pt-6">
        <div className="flex rounded-2xl bg-surface-container-high p-1">
          <button
            onClick={() => setMode("send")}
            className={clsx(
              "flex-1 rounded-xl py-3 text-label-md font-label-md transition-colors",
              mode === "send" ? "bg-white font-bold text-primary shadow-soft-glow" : "text-on-surface-variant",
            )}
          >
            J&apos;envoie un colis
          </button>
          <button
            onClick={() => setMode("travel")}
            className={clsx(
              "flex-1 rounded-xl py-3 text-label-md font-label-md transition-colors",
              mode === "travel" ? "bg-white font-bold text-primary shadow-soft-glow" : "text-on-surface-variant",
            )}
          >
            Je voyage
          </button>
        </div>

        {mode === "send" ? <SendPackageForm /> : <OfferTripForm />}
      </main>
    </div>
  );
}

function SendPackageForm() {
  const router = useRouter();
  const createRequest = useCreateRequest();
  const [departureCity, setDepartureCity] = useState<CityDTO | null>(null);
  const [arrivalCity, setArrivalCity] = useState<CityDTO | null>(null);
  const [desiredDate, setDesiredDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [category, setCategory] = useState<PackageCategory>("OTHER");
  const [description, setDescription] = useState("");
  const [sizeEstimate, setSizeEstimate] = useState<ItemSize>("SMALL");
  const [isUrgent, setIsUrgent] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!departureCity || !arrivalCity) return setError("Sélectionnez une ville de départ et d'arrivée");
    if (!desiredDate || !weightKg || !description || !offeredPrice) return setError("Merci de remplir tous les champs");

    try {
      await createRequest.mutateAsync({
        departureCityId: departureCity.id,
        arrivalCityId: arrivalCity.id,
        desiredDate: new Date(desiredDate).toISOString(),
        weightKg: Number(weightKg),
        category,
        description,
        sizeEstimate,
        isUrgent,
        offeredPrice: Number(offeredPrice),
      });
      router.push("/accueil");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 pb-12">
      <CityAutocomplete label="Départ" value={departureCity} onChange={setDepartureCity} />
      <CityAutocomplete label="Destination" icon="near_me" value={arrivalCity} onChange={setArrivalCity} />
      <TextField
        label="Date souhaitée"
        type="date"
        icon="calendar_month"
        value={desiredDate}
        onChange={(e) => setDesiredDate(e.target.value)}
      />
      <TextField
        label="Poids estimé (kg)"
        type="number"
        step="0.1"
        min="0.1"
        icon="weight"
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
      />

      <div className="space-y-1.5">
        <span className="block font-label-md text-label-md text-on-surface-variant">Catégorie</span>
        <div className="flex flex-wrap gap-2">
          {PACKAGE_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={clsx(
                "rounded-full px-4 py-2 text-label-sm font-label-sm transition-colors",
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
                "flex-1 rounded-xl py-2 text-label-sm font-label-sm transition-colors",
                sizeEstimate === s ? "bg-primary-container text-on-primary" : "border border-outline-variant/40 text-on-surface-variant",
              )}
            >
              {ITEM_SIZE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md focus:border-primary-container focus:outline-none"
          placeholder="Ex : un smartphone reconditionné, dans sa boîte d'origine."
        />
      </div>

      <TextField
        label="Prix que vous proposez (€)"
        type="number"
        step="1"
        min="0"
        icon="payments"
        value={offeredPrice}
        onChange={(e) => setOfferedPrice(e.target.value)}
      />

      <button
        type="button"
        onClick={() => setIsUrgent((v) => !v)}
        className={clsx(
          "flex w-full items-center justify-between rounded-xl border p-4 transition-colors",
          isUrgent ? "border-secondary bg-secondary-container/10" : "border-outline-variant/30",
        )}
      >
        <span className="flex items-center gap-2 font-label-md text-label-md">
          <Icon name="bolt" className="text-secondary" /> Envoi urgent
        </span>
        <span className={clsx("h-6 w-11 rounded-full p-0.5 transition-colors", isUrgent ? "bg-secondary" : "bg-outline-variant")}>
          <span className={clsx("block h-5 w-5 rounded-full bg-white transition-transform", isUrgent && "translate-x-5")} />
        </span>
      </button>

      {error && <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">{error}</p>}

      <Button type="submit" fullWidth size="lg" loading={createRequest.isPending}>
        Publier ma demande d&apos;envoi
      </Button>
    </form>
  );
}

function OfferTripForm() {
  const router = useRouter();
  const createTrip = useCreateTrip();
  const [departureCity, setDepartureCity] = useState<CityDTO | null>(null);
  const [arrivalCity, setArrivalCity] = useState<CityDTO | null>(null);
  const [departureDate, setDepartureDate] = useState("");
  const [availableWeightKg, setAvailableWeightKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [acceptedCategories, setAcceptedCategories] = useState<PackageCategory[]>(["OTHER"]);
  const [maxItemSize, setMaxItemSize] = useState<ItemSize>("MEDIUM");
  const [transportMode, setTransportMode] = useState<TransportMode>("PLANE");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (c: PackageCategory) => {
    setAcceptedCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!departureCity || !arrivalCity) return setError("Sélectionnez une ville de départ et d'arrivée");
    if (!departureDate || !availableWeightKg || !pricePerKg) return setError("Merci de remplir tous les champs");
    if (acceptedCategories.length === 0) return setError("Choisissez au moins une catégorie acceptée");

    try {
      const trip = await createTrip.mutateAsync({
        departureCityId: departureCity.id,
        arrivalCityId: arrivalCity.id,
        departureDate: new Date(departureDate).toISOString(),
        availableWeightKg: Number(availableWeightKg),
        pricePerKg: Number(pricePerKg),
        acceptedCategories,
        maxItemSize,
        transportMode,
        notes: notes || undefined,
      });
      router.push(`/trajets/${trip.trip.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 pb-12">
      <CityAutocomplete label="Départ" value={departureCity} onChange={setDepartureCity} />
      <CityAutocomplete label="Destination" icon="flight_land" value={arrivalCity} onChange={setArrivalCity} />
      <TextField
        label="Date de départ"
        type="date"
        icon="calendar_month"
        value={departureDate}
        onChange={(e) => setDepartureDate(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Poids disponible (kg)"
          type="number"
          step="0.5"
          min="0.5"
          icon="luggage"
          value={availableWeightKg}
          onChange={(e) => setAvailableWeightKg(e.target.value)}
        />
        <TextField
          label="Prix par kg (€)"
          type="number"
          step="1"
          min="0"
          icon="payments"
          value={pricePerKg}
          onChange={(e) => setPricePerKg(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <span className="block font-label-md text-label-md text-on-surface-variant">Catégories acceptées</span>
        <div className="flex flex-wrap gap-2">
          {PACKAGE_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggleCategory(c)}
              className={clsx(
                "rounded-full px-4 py-2 text-label-sm font-label-sm transition-colors",
                acceptedCategories.includes(c)
                  ? "bg-primary-container text-on-primary"
                  : "border border-outline-variant/40 text-on-surface-variant",
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block font-label-md text-label-md text-on-surface-variant">Taille maximale acceptée</span>
        <div className="flex gap-2">
          {ITEM_SIZES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setMaxItemSize(s)}
              className={clsx(
                "flex-1 rounded-xl py-2 text-label-sm font-label-sm transition-colors",
                maxItemSize === s ? "bg-primary-container text-on-primary" : "border border-outline-variant/40 text-on-surface-variant",
              )}
            >
              {ITEM_SIZE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block font-label-md text-label-md text-on-surface-variant">Moyen de transport</span>
        <div className="flex flex-wrap gap-2">
          {TRANSPORT_MODES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTransportMode(t)}
              className={clsx(
                "rounded-full px-4 py-2 text-label-sm font-label-sm transition-colors",
                transportMode === t ? "bg-primary-container text-on-primary" : "border border-outline-variant/40 text-on-surface-variant",
              )}
            >
              {TRANSPORT_MODE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="notes">
          Notes (optionnel)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md focus:border-primary-container focus:outline-none"
          placeholder="Ex : vol direct, bagage en soute disponible."
        />
      </div>

      {error && <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">{error}</p>}

      <Button type="submit" fullWidth size="lg" loading={createTrip.isPending}>
        Publier mon trajet
      </Button>
    </form>
  );
}
