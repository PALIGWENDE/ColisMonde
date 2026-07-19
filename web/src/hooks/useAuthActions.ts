"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore, type MeDTO } from "@/store/auth";

interface AuthResponse {
  user: MeDTO;
  accessToken: string;
  accessTokenExpiresAt: string;
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

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: RegisterPayload) => apiClient.post<AuthResponse>("/api/auth/register", payload),
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: LoginPayload) => apiClient.post<AuthResponse>("/api/auth/login", payload),
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: () => apiClient.post("/api/auth/logout"),
    onSettled: () => clear(),
  });
}
