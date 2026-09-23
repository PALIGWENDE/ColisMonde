import { create } from "zustand";
import type { PublicUserDTO } from "@colismonde/shared";

export interface MeDTO extends PublicUserDTO {
  email: string;
  phone: string | null;
  isAdmin: boolean;
}

export type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

interface AuthState {
  status: AuthStatus;
  user: MeDTO | null;
  accessToken: string | null;
  setSession: (user: MeDTO, accessToken: string) => void;
  updateUser: (user: MeDTO) => void;
  setGuest: () => void;
  setLoading: () => void;
  clear: () => void;
}

/**
 * Même forme que web/src/store/auth.ts (status/user/accessToken en mémoire), mais le mobile
 * persiste EN PLUS le refresh token via expo-secure-store (voir src/lib/apiClient.ts) : contrairement
 * au web, RN n'a pas de vrai cookie jar navigateur pour renvoyer de façon fiable le cookie httpOnly
 * cm_refresh au serveur (voir backend/src/modules/auth/auth.routes.ts, header X-Client-Type: mobile).
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ status: "authenticated", user, accessToken }),
  updateUser: (user) => set({ user }),
  setGuest: () => set({ status: "guest", user: null, accessToken: null }),
  setLoading: () => set({ status: "loading" }),
  clear: () => set({ status: "guest", user: null, accessToken: null }),
}));
