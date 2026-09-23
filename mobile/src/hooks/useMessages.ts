import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationDTO, MessageDTO } from "@colismonde/shared";
import { apiClient } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";

export function useBookingConversation(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["bookings", bookingId, "conversation"],
    queryFn: () => apiClient.get<{ conversationId: string }>(`/api/bookings/${bookingId}/conversation`),
    enabled: Boolean(bookingId),
    retry: false,
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiClient.get<{ conversations: ConversationDTO[] }>("/api/conversations"),
    refetchInterval: 20_000,
  });
}

export function useConversationMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["conversations", conversationId, "messages"],
    queryFn: () => apiClient.get<{ messages: MessageDTO[] }>(`/api/conversations/${conversationId}/messages`),
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("conversation:join", conversationId);

    const handleNewMessage = (message: MessageDTO) => {
      if (message.conversationId !== conversationId) return;
      queryClient.setQueryData<{ messages: MessageDTO[] } | undefined>(
        ["conversations", conversationId, "messages"],
        (old) => (old ? { messages: [...old.messages, message] } : old),
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.off("message:new", handleNewMessage);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post<{ message: MessageDTO }>(`/api/conversations/${conversationId}/messages`, { content }),
    onSuccess: (data) => {
      queryClient.setQueryData<{ messages: MessageDTO[] } | undefined>(
        ["conversations", conversationId, "messages"],
        (old) => (old ? { messages: [...old.messages, data.message] } : old),
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
