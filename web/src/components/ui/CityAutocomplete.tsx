"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const inputId = useId();
  const listboxId = useId();
  const [inputValue, setInputValue] = useState(value ? `${value.name}, ${value.country}` : "");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data, isFetching } = useCitySearch(debounced);
  const cities = data?.cities ?? [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [cities.length, debounced]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectCity = (city: CityDTO) => {
    onChange(city);
    setInputValue(`${city.name}, ${city.country}`);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || cities.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % cities.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? cities.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectCity(cities[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="block font-label-md text-label-md text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface p-3 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/25">
        <Icon name={icon} className="text-primary" />
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          className="w-full border-none bg-transparent font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-0"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>

      {open && debounced.trim().length >= 2 && (
        <div
          id={listboxId}
          role="listbox"
          aria-live="polite"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevated"
        >
          {isFetching && <div className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Recherche…</div>}
          {!isFetching && cities.length === 0 && (
            <div className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Aucune ville trouvée</div>
          )}
          {cities.map((city, i) => (
            <button
              key={city.id}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              type="button"
              className={
                i === activeIndex
                  ? "flex w-full items-center gap-3 bg-surface-container-low px-4 py-3 text-left"
                  : "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-low"
              }
              onClick={() => selectCity(city)}
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
