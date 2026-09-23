import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReviewDTO } from "@colismonde/shared";
import { apiClient } from "@/lib/apiClient";

export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ["users", userId, "reviews"],
    queryFn: () => apiClient.get<{ reviews: ReviewDTO[] }>(`/api/users/${userId}/reviews`),
    enabled: Boolean(userId),
  });
}

export function useBookingReviews(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["bookings", bookingId, "reviews"],
    queryFn: () => apiClient.get<{ reviews: ReviewDTO[] }>(`/api/bookings/${bookingId}/reviews`),
    enabled: Boolean(bookingId),
  });
}

export function useCreateReview(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      apiClient.post<{ review: ReviewDTO }>(`/api/bookings/${bookingId}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings", bookingId, "reviews"] });
    },
  });
}
