import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationType } from "@colismonde/shared";
import { apiClient } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedBookingId: string | null;
  createdAt: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const status = useAuthStore((s) => s.status);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<{ notifications: NotificationDTO[] }>("/api/notifications"),
    enabled: status === "authenticated",
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (notification: NotificationDTO) => {
      queryClient.setQueryData<{ notifications: NotificationDTO[] } | undefined>(["notifications"], (old) =>
        old ? { notifications: [notification, ...old.notifications] } : old,
      );
    };

    socket.on("notification:new", handleNew);
    return () => {
      socket.off("notification:new", handleNew);
    };
  }, [status, queryClient]);

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
