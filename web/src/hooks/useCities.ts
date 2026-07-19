"use client";

import { useQuery } from "@tanstack/react-query";
import type { CityDTO } from "@colismonde/shared";
import { apiClient } from "@/lib/apiClient";

export function useCitySearch(query: string) {
  return useQuery({
    queryKey: ["cities", "search", query],
    queryFn: () => apiClient.get<{ cities: CityDTO[] }>(`/api/cities/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60_000,
  });
}
