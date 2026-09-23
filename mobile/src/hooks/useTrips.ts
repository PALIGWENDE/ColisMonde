import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TripDTO, TransportMode, PackageCategory, ItemSize } from "@colismonde/shared";
import { apiClient } from "@/lib/apiClient";

export type TripSort = "date" | "price_asc" | "price_desc" | "rating";

export interface TripSearchFilters {
  departureCityId?: string;
  arrivalCityId?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: PackageCategory;
  minWeightKg?: number;
  maxPricePerKg?: number;
  sort?: TripSort;
  page?: number;
}

export interface CreateTripPayload {
  departureCityId: string;
  arrivalCityId: string;
  departureDate: string;
  arrivalDate?: string | null;
  availableWeightKg: number;
  pricePerKg: number;
  acceptedCategories: PackageCategory[];
  maxItemSize: ItemSize;
  transportMode: TransportMode;
  notes?: string;
}

function toQueryString<T extends object>(filters: T) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function useSearchTrips(filters: TripSearchFilters) {
  const qs = toQueryString(filters);
  return useQuery({
    queryKey: ["trips", "search", filters],
    queryFn: () => apiClient.get<{ trips: TripDTO[]; total: number }>(`/api/trips${qs ? `?${qs}` : ""}`),
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ["trips", id],
    queryFn: () => apiClient.get<{ trip: TripDTO }>(`/api/trips/${id}`),
    enabled: Boolean(id),
  });
}

export function useMyTrips() {
  return useQuery({
    queryKey: ["trips", "mine"],
    queryFn: () => apiClient.get<{ trips: TripDTO[] }>("/api/trips/mine"),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTripPayload) => apiClient.post<{ trip: TripDTO }>("/api/trips", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
