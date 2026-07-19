"use client";

import { useEffect, useRef, useState } from "react";
import type { CityDTO } from "@colismonde/shared";
import { useCitySearch } from "@/hooks/useCities";
import { Icon } from "./Icon";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data, isFetching } = useCitySearch(debounced);
  const cities = data?.cities ?? [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && <label className="block font-label-md text-label-md text-on-surface-variant">{label}</label>}
      <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface p-3 focus-within:border-primary-container">
        <Icon name={icon} className="text-primary" />
        <input
          className="w-full border-none bg-transparent font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-0"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && debounced.trim().length >= 2 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevated">
          {isFetching && <div className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Recherche...</div>}
          {!isFetching && cities.length === 0 && (
            <div className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Aucune ville trouvée</div>
          )}
          {cities.map((city) => (
            <button
              key={city.id}
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-low"
              onClick={() => {
                onChange(city);
                setInputValue(`${city.name}, ${city.country}`);
                setOpen(false);
              }}
            >
              <Icon name="location_on" className="text-outline" size={20} />
              <span className="font-body-md text-body-md">
                {city.name} <span className="text-on-surface-variant">— {city.country}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
