import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PackageRequestDTO, PackageCategory, ItemSize } from "@colismonde/shared";
import { apiClient } from "@/lib/apiClient";

export interface RequestSearchFilters {
  departureCityId?: string;
  arrivalCityId?: string;
  category?: PackageCategory;
  page?: number;
}

export interface CreateRequestPayload {
  departureCityId: string;
  arrivalCityId: string;
  desiredDate: string;
  weightKg: number;
  category: PackageCategory;
  description: string;
  sizeEstimate: ItemSize;
  isUrgent: boolean;
  offeredPrice: number;
}

function toQueryString<T extends object>(filters: T) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function useSearchRequests(filters: RequestSearchFilters) {
  const qs = toQueryString(filters);
  return useQuery({
    queryKey: ["requests", "search", filters],
    queryFn: () => apiClient.get<{ requests: PackageRequestDTO[]; total: number }>(`/api/requests${qs ? `?${qs}` : ""}`),
  });
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["requests", id],
    queryFn: () => apiClient.get<{ request: PackageRequestDTO }>(`/api/requests/${id}`),
    enabled: Boolean(id),
  });
}

export function useMyRequests() {
  return useQuery({
    queryKey: ["requests", "mine"],
    queryFn: () => apiClient.get<{ requests: PackageRequestDTO[] }>("/api/requests/mine"),
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => apiClient.post<{ request: PackageRequestDTO }>("/api/requests", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
