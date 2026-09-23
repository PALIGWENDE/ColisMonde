import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentStatus, DocumentType, PublicUserDTO } from "@colismonde/shared";
import { apiClient, apiUpload } from "@/lib/apiClient";
import { useAuthStore, type MeDTO } from "@/store/auth";
import type { RNFile } from "./useBookings";

export interface VerificationDocumentDTO {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  reviewedAt: string | null;
  createdAt: string;
}

export function usePublicUser(id: string | undefined) {
  return useQuery({
    queryKey: ["users", id, "public"],
    queryFn: () => apiClient.get<{ user: PublicUserDTO }>(`/api/users/${id}/public`),
    enabled: Boolean(id),
  });
}

export function useUpdateMe() {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (payload: Partial<{ firstName: string; lastName: string; phone: string; bio: string; country: string; city: string }>) =>
      apiClient.patch<{ user: MeDTO }>("/api/users/me", payload),
    onSuccess: (data) => updateUser(data.user),
  });
}

export function useUploadAvatar() {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (file: RNFile) => {
      const formData = new FormData();
      formData.append("avatar", file as unknown as Blob);
      return apiUpload<{ user: MeDTO }>("/api/users/me/avatar", formData);
    },
    onSuccess: (data) => updateUser(data.user),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type }: { file: RNFile; type: "ID_CARD" | "PASSPORT" | "DRIVER_LICENSE" }) => {
      const formData = new FormData();
      formData.append("document", file as unknown as Blob);
      formData.append("type", type);
      return apiUpload("/api/users/me/documents", formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "me", "documents"] }),
  });
}

/** Documents de vérification déjà envoyés, avec leur statut (en attente / validé / refusé). */
export function useMyDocuments() {
  return useQuery({
    queryKey: ["users", "me", "documents"],
    queryFn: () => apiClient.get<{ documents: VerificationDocumentDTO[] }>("/api/users/me/documents"),
  });
}

/** Suppression de compte en libre-service (RGPD / Apple 5.1.1v / politique Google Play). */
export function useDeleteAccount() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: () => apiClient.delete("/api/users/me"),
    onSettled: () => clear(),
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ["users", "me", "blocks"],
    queryFn: () => apiClient.get<{ blockedUsers: PublicUserDTO[] }>("/api/users/me/blocks"),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiClient.post(`/api/users/${userId}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "me", "blocks"] }),
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/api/users/${userId}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "me", "blocks"] }),
  });
}
