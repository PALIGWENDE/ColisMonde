import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import clsx from "clsx";
import type { CityDTO, ItemSize, PackageCategory, TransportMode } from "@colismonde/shared";
import { PACKAGE_CATEGORIES, ITEM_SIZES, TRANSPORT_MODES } from "@colismonde/shared";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
import { DateField } from "@/components/ui/DateField";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { useCreateRequest } from "@/hooks/useRequests";
import { useCreateTrip } from "@/hooks/useTrips";
import { CATEGORY_LABELS, ITEM_SIZE_LABELS, TRANSPORT_MODE_LABELS, formatPrice } from "@/lib/format";
import { ApiClientError } from "@/lib/apiClient";

type Mode = "send" | "travel";

export default function NouvelleAnnonceScreen() {
  const [mode, setMode] = useState<Mode>("send");

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="Nouvelle annonce" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-container-padding-mobile pt-6 pb-12" keyboardShouldPersistTaps="handled">
          <View className="flex-row rounded-2xl bg-surface-container-high p-1">
            <Pressable onPress={() => setMode("send")} className={clsx("flex-1 items-center rounded-xl py-3", mode === "send" && "bg-white")}>
              <Text className={clsx("font-label-md text-label-md", mode === "send" ? "font-bold text-primary" : "text-on-surface-variant")}>
                J&apos;envoie un colis
              </Text>
            </Pressable>
            <Pressable onPress={() => setMode("travel")} className={clsx("flex-1 items-center rounded-xl py-3", mode === "travel" && "bg-white")}>
              <Text className={clsx("font-label-md text-label-md", mode === "travel" ? "font-bold text-primary" : "text-on-surface-variant")}>
                Je voyage
              </Text>
            </Pressable>
          </View>

          {mode === "send" ? <SendPackageForm key="send" /> : <OfferTripForm key="travel" />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Barre de progression + titre d'étape — remplace un long formulaire à scroll unique par un parcours guidé. */
function WizardHeader({ step, totalSteps, title }: { step: number; totalSteps: number; title: string }) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} className={clsx("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary-container" : "bg-outline-variant/40")} />
        ))}
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Étape {step + 1} sur {totalSteps}
        </Text>
        <Text className="font-headline-md text-headline-md text-on-background">{title}</Text>
      </View>
    </View>
  );
}

function WizardNav({
  step,
  totalSteps,
  onBack,
  onNext,
  loading,
  nextLabel,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
  nextLabel?: string;
}) {
  const isLast = step === totalSteps - 1;
  return (
    <View className="flex-row gap-3">
      {step > 0 && (
        <View className="flex-1">
          <Button variant="outline" fullWidth onPress={onBack}>
            Précédent
          </Button>
        </View>
      )}
      <View className="flex-1">
        <Button fullWidth loading={loading} onPress={onNext}>
          {isLast ? (nextLabel ?? "Publier") : "Suivant"}
        </Button>
      </View>
    </View>
  );
}

function CategoryPicker({
  categories,
  selected,
  onToggle,
}: {
  categories: readonly PackageCategory[];
  selected: PackageCategory[];
  onToggle: (c: PackageCategory) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {categories.map((c) => {
        const active = selected.includes(c);
        return (
          <Pressable
            key={c}
            onPress={() => onToggle(c)}
            className={clsx("rounded-full px-4 py-2", active ? "bg-primary-container" : "border border-outline-variant/40")}
          >
            <Text className={clsx("text-label-sm font-label-sm", active ? "text-on-primary" : "text-on-surface-variant")}>
              {CATEGORY_LABELS[c]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SizePicker({ value, onChange }: { value: ItemSize; onChange: (s: ItemSize) => void }) {
  return (
    <View className="flex-row gap-2">
      {ITEM_SIZES.map((s) => (
        <Pressable
          key={s}
          onPress={() => onChange(s)}
          className={clsx("flex-1 items-center rounded-xl py-2", value === s ? "bg-primary-container" : "border border-outline-variant/40")}
        >
          <Text className={clsx("text-label-sm font-label-sm", value === s ? "text-on-primary" : "text-on-surface-variant")}>
            {ITEM_SIZE_LABELS[s]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="font-label-md text-label-md text-on-surface-variant">{children}</Text>;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="rounded-xl bg-error-container px-4 py-3">
      <Text className="font-label-md text-label-md text-on-error-container">{message}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-outline-variant/10 py-2">
      <Text className="font-label-sm text-label-sm text-on-surface-variant">{label}</Text>
      <Text className="font-label-md text-label-md text-on-background">{value}</Text>
    </View>
  );
}

const SEND_STEPS = ["Trajet", "Le colis", "Prix & envoi"];

function SendPackageForm() {
  const router = useRouter();
  const createRequest = useCreateRequest();
  const [step, setStep] = useState(0);
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

  const submit = async () => {
    setError(null);
    try {
      await createRequest.mutateAsync({
        departureCityId: departureCity!.id,
        arrivalCityId: arrivalCity!.id,
        desiredDate: new Date(desiredDate).toISOString(),
        weightKg: Number(weightKg),
        category,
        description,
        sizeEstimate,
        isUrgent,
        offeredPrice: Number(offeredPrice),
      });
      router.replace("/accueil");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  const goNext = () => {
    setError(null);
    if (step === 0) {
      if (!departureCity || !arrivalCity) return setError("Sélectionnez une ville de départ et d'arrivée");
      if (!desiredDate) return setError("Choisissez une date souhaitée");
      return setStep(1);
    }
    if (step === 1) {
      if (!weightKg || !description) return setError("Merci de renseigner le poids et une description");
      return setStep(2);
    }
    if (!offeredPrice) return setError("Indiquez le prix que vous proposez");
    submit();
  };

  return (
    <View className="gap-6">
      <WizardHeader step={step} totalSteps={SEND_STEPS.length} title={SEND_STEPS[step]} />

      {step === 0 && (
        <View className="gap-5">
          <CityAutocomplete label="Départ" value={departureCity} onChange={setDepartureCity} />
          <CityAutocomplete label="Destination" icon="near_me" value={arrivalCity} onChange={setArrivalCity} />
          <DateField label="Date souhaitée" value={desiredDate} onChange={setDesiredDate} minimumDate={new Date()} />
        </View>
      )}

      {step === 1 && (
        <View className="gap-5">
          <TextField label="Poids estimé (kg)" icon="weight" keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
          <View className="gap-1.5">
            <FieldLabel>Catégorie</FieldLabel>
            <CategoryPicker categories={PACKAGE_CATEGORIES} selected={[category]} onToggle={setCategory} />
          </View>
          <View className="gap-1.5">
            <FieldLabel>Taille</FieldLabel>
            <SizePicker value={sizeEstimate} onChange={setSizeEstimate} />
          </View>
          <View className="gap-1.5">
            <FieldLabel>Description</FieldLabel>
            <TextInput
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex : un smartphone reconditionné, dans sa boîte d'origine."
              placeholderTextColor="#6f797a"
              className="rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md text-on-surface"
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
          </View>
        </View>
      )}

      {step === 2 && (
        <View className="gap-5">
          <TextField label="Prix que vous proposez (€)" icon="payments" keyboardType="numeric" value={offeredPrice} onChangeText={setOfferedPrice} />

          <Pressable
            onPress={() => setIsUrgent((v) => !v)}
            className={clsx("flex-row items-center justify-between rounded-xl border p-4", isUrgent ? "border-secondary bg-secondary-container/10" : "border-outline-variant/30")}
          >
            <View className="flex-row items-center gap-2">
              <Icon name="bolt" className="text-secondary" />
              <Text className="font-label-md text-label-md text-on-background">Envoi urgent</Text>
            </View>
            <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ true: "#B71C1C", false: "#bec8ca" }} />
          </Pressable>

          <View className="gap-1 rounded-xl bg-surface-container-lowest p-4">
            <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Récapitulatif</Text>
            <SummaryRow label="Trajet" value={`${departureCity?.name ?? "—"} → ${arrivalCity?.name ?? "—"}`} />
            <SummaryRow label="Colis" value={`${weightKg || "—"} kg · ${CATEGORY_LABELS[category]}`} />
          </View>
        </View>
      )}

      {error && <ErrorBanner message={error} />}

      <WizardNav step={step} totalSteps={SEND_STEPS.length} onBack={() => setStep((s) => s - 1)} onNext={goNext} loading={createRequest.isPending} nextLabel="Publier ma demande" />
    </View>
  );
}

const TRAVEL_STEPS = ["Trajet", "Capacité", "Prix & notes"];

function OfferTripForm() {
  const router = useRouter();
  const createTrip = useCreateTrip();
  const [step, setStep] = useState(0);
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

  const submit = async () => {
    setError(null);
    try {
      const { trip } = await createTrip.mutateAsync({
        departureCityId: departureCity!.id,
        arrivalCityId: arrivalCity!.id,
        departureDate: new Date(departureDate).toISOString(),
        availableWeightKg: Number(availableWeightKg),
        pricePerKg: Number(pricePerKg),
        acceptedCategories,
        maxItemSize,
        transportMode,
        notes: notes || undefined,
      });
      router.replace({ pathname: "/trajets/[id]", params: { id: trip.id } });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  const goNext = () => {
    setError(null);
    if (step === 0) {
      if (!departureCity || !arrivalCity) return setError("Sélectionnez une ville de départ et d'arrivée");
      if (!departureDate) return setError("Choisissez une date de départ");
      return setStep(1);
    }
    if (step === 1) {
      if (!availableWeightKg) return setError("Indiquez le poids disponible");
      if (acceptedCategories.length === 0) return setError("Choisissez au moins une catégorie acceptée");
      return setStep(2);
    }
    if (!pricePerKg) return setError("Indiquez le prix par kg");
    submit();
  };

  return (
    <View className="gap-6">
      <WizardHeader step={step} totalSteps={TRAVEL_STEPS.length} title={TRAVEL_STEPS[step]} />

      {step === 0 && (
        <View className="gap-5">
          <CityAutocomplete label="Départ" value={departureCity} onChange={setDepartureCity} />
          <CityAutocomplete label="Destination" icon="flight_land" value={arrivalCity} onChange={setArrivalCity} />
          <DateField label="Date de départ" value={departureDate} onChange={setDepartureDate} minimumDate={new Date()} />
          <View className="gap-1.5">
            <FieldLabel>Moyen de transport</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {TRANSPORT_MODES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTransportMode(t)}
                  className={clsx("rounded-full px-4 py-2", transportMode === t ? "bg-primary-container" : "border border-outline-variant/40")}
                >
                  <Text className={clsx("text-label-sm font-label-sm", transportMode === t ? "text-on-primary" : "text-on-surface-variant")}>
                    {TRANSPORT_MODE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      {step === 1 && (
        <View className="gap-5">
          <TextField label="Poids disponible (kg)" icon="luggage" keyboardType="decimal-pad" value={availableWeightKg} onChangeText={setAvailableWeightKg} />
          <View className="gap-1.5">
            <FieldLabel>Catégories acceptées</FieldLabel>
            <CategoryPicker categories={PACKAGE_CATEGORIES} selected={acceptedCategories} onToggle={toggleCategory} />
          </View>
          <View className="gap-1.5">
            <FieldLabel>Taille maximale acceptée</FieldLabel>
            <SizePicker value={maxItemSize} onChange={setMaxItemSize} />
          </View>
        </View>
      )}

      {step === 2 && (
        <View className="gap-5">
          <TextField label="Prix par kg (€)" icon="payments" keyboardType="numeric" value={pricePerKg} onChangeText={setPricePerKg} />
          <View className="gap-1.5">
            <FieldLabel>Notes (optionnel)</FieldLabel>
            <TextInput
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ex : vol direct, bagage en soute disponible."
              placeholderTextColor="#6f797a"
              className="rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md text-on-surface"
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
          </View>

          <View className="gap-1 rounded-xl bg-surface-container-lowest p-4">
            <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Récapitulatif</Text>
            <SummaryRow label="Trajet" value={`${departureCity?.name ?? "—"} → ${arrivalCity?.name ?? "—"}`} />
            <SummaryRow label="Capacité" value={`${availableWeightKg || "—"} kg disponibles`} />
            {pricePerKg && <SummaryRow label="Tarif" value={`${formatPrice(Number(pricePerKg))}/kg`} />}
          </View>
        </View>
      )}

      {error && <ErrorBanner message={error} />}

      <WizardNav step={step} totalSteps={TRAVEL_STEPS.length} onBack={() => setStep((s) => s - 1)} onNext={goNext} loading={createTrip.isPending} nextLabel="Publier mon trajet" />
    </View>
  );
}
