import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BookingDTO, InsuranceTier } from "@colismonde/shared";
import { apiClient, apiUpload } from "@/lib/apiClient";

interface TrackingEvent {
  id: string;
  status: string;
  label: string;
  description: string | null;
  location: string | null;
  occurredAt: string;
}

/** Fichier issu d'expo-image-picker (asset.uri/mimeType), équivalent RN du File web. */
export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export function useMyBookings(role?: "sender" | "traveler") {
  return useQuery({
    queryKey: ["bookings", "mine", role],
    queryFn: () => apiClient.get<{ bookings: BookingDTO[] }>(`/api/bookings/mine${role ? `?role=${role}` : ""}`),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: () => apiClient.get<{ booking: BookingDTO }>(`/api/bookings/${id}`),
    enabled: Boolean(id),
  });
}

export function useBookingTracking(id: string | undefined) {
  return useQuery({
    queryKey: ["bookings", id, "tracking"],
    queryFn: () => apiClient.get<{ events: TrackingEvent[] }>(`/api/bookings/${id}/tracking`),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tripId: string; requestId: string; insuranceTier?: InsuranceTier }) =>
      apiClient.post<{ booking: BookingDTO }>("/api/bookings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

function useBookingAction(action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: unknown }) =>
      apiClient.patch<{ booking: BookingDTO }>(`/api/bookings/${id}/${action}`, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.id, "tracking"] });
    },
  });
}

export const useAcceptBooking = () => useBookingAction("accept");
export const useRejectBooking = () => useBookingAction("reject");
export const useCancelBooking = () => useBookingAction("cancel");
export const usePickupBooking = () => useBookingAction("pickup");
export const useInTransitBooking = () => useBookingAction("in-transit");
export const useDeliverBooking = () => useBookingAction("deliver");
export const useUpdateInsurance = () => useBookingAction("insurance");

export function useUploadProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: RNFile }) => {
      const formData = new FormData();
      formData.append("photo", file as unknown as Blob);
      return apiUpload<{ booking: BookingDTO }>(`/api/bookings/${id}/proof`, formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", data.booking.id] });
    },
  });
}
