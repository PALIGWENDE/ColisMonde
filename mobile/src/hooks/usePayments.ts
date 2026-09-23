import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface PaymentDTO {
  id: string;
  bookingId: string;
  amount: number;
  shippingFee: number;
  serviceFee: number;
  insuranceFee: number;
  currency: string;
  status: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
  provider: string;
  paidAt: string | null;
  createdAt: string;
}

export function useBookingPayment(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["payments", bookingId],
    queryFn: () => apiClient.get<{ payment: PaymentDTO }>(`/api/payments/bookings/${bookingId}/payment`),
    enabled: Boolean(bookingId),
    retry: false,
  });
}

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => apiClient.post<{ payment: PaymentDTO }>(`/api/payments/bookings/${bookingId}/payment`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments", data.payment.bookingId] });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => apiClient.post<{ payment: PaymentDTO }>(`/api/payments/${paymentId}/confirm`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments", data.payment.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings", data.payment.bookingId] });
    },
  });
}
