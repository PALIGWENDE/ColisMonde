import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import type { CityDTO } from "@colismonde/shared";
import { useCitySearch } from "@/hooks/useCities";
import { Icon } from "./Icon";
import { shadows } from "@/theme/shadows";

interface CityAutocompleteProps {
  label?: string;
  icon?: string;
  placeholder?: string;
  value: CityDTO | null;
  onChange: (city: CityDTO | null) => void;
}

/** Recherche mondiale de villes/pays avec debounce, branchée sur GET /api/cities/search. */
export function CityAutocomplete({ label, icon = "location_on", placeholder = "Ville ou pays", value, onChange }: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value ? `${value.name}, ${value.country}` : "");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data, isFetching } = useCitySearch(debounced);
  const cities = data?.cities ?? [];

  return (
    <View className="gap-1.5">
      {label && <Text className="font-label-md text-label-md text-on-surface-variant">{label}</Text>}
      <View className="flex-row items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface p-3">
        <Icon name={icon} className="text-primary" />
        <TextInput
          className="flex-1 font-body-md text-body-md text-on-surface"
          placeholder={placeholder}
          placeholderTextColor="#6f797a"
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          // délai pour laisser le tap sur un résultat s'exécuter avant la fermeture au blur (pas de "click outside" en RN)
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </View>

      {open && debounced.trim().length >= 2 && (
        <View className="z-30 mt-1 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest" style={shadows.elevated}>
          {isFetching && (
            <View className="flex-row items-center gap-2 px-4 py-3">
              <ActivityIndicator size="small" />
              <Text className="font-label-sm text-label-sm text-on-surface-variant">Recherche...</Text>
            </View>
          )}
          {!isFetching && cities.length === 0 && (
            <Text className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Aucune ville trouvée</Text>
          )}
          {cities.map((city) => (
            <Pressable
              key={city.id}
              className="flex-row items-center gap-3 px-4 py-3"
              onPress={() => {
                onChange(city);
                setInputValue(`${city.name}, ${city.country}`);
                setOpen(false);
              }}
            >
              <Icon name="location_on" className="text-outline" size={20} />
              <Text className="font-body-md text-body-md text-on-surface">
                {city.name} <Text className="text-on-surface-variant">— {city.country}</Text>
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
