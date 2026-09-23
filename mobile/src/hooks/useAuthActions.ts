import { useMutation } from "@tanstack/react-query";
import { apiClient, clearRefreshToken, persistRefreshToken } from "@/lib/apiClient";
import { disconnectSocket } from "@/lib/socket";
import { registerForPushNotifications, unregisterCurrentDevicePush } from "@/lib/pushNotifications";
import { useAuthStore, type MeDTO } from "@/store/auth";

interface AuthResponse {
  user: MeDTO;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  city?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

async function onAuthSuccess(data: AuthResponse, setSession: (user: MeDTO, token: string) => void) {
  setSession(data.user, data.accessToken);
  if (data.refreshToken) await persistRefreshToken(data.refreshToken);
  void registerForPushNotifications();
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: RegisterPayload) => apiClient.post<AuthResponse>("/api/auth/register", payload),
    onSuccess: (data) => onAuthSuccess(data, setSession),
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: LoginPayload) => apiClient.post<AuthResponse>("/api/auth/login", payload),
    onSuccess: (data) => onAuthSuccess(data, setSession),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await unregisterCurrentDevicePush();
      await apiClient.post("/api/auth/logout");
    },
    onSettled: async () => {
      clear();
      disconnectSocket();
      await clearRefreshToken();
    },
  });
}
