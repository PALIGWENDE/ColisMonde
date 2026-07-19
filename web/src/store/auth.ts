import { create } from "zustand";
import type { PublicUserDTO } from "@colismonde/shared";

export interface MeDTO extends PublicUserDTO {
  email: string;
  phone: string | null;
  isAdmin: boolean;
}

type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

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
 * Le token d'accès n'est JAMAIS persisté (pas de localStorage) : il ne vit qu'en mémoire.
 * Au rechargement de la page, il est régénéré via le cookie httpOnly de refresh (voir AuthBootstrap).
 * Cela limite fortement la surface d'exposition en cas de faille XSS côté frontend.
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
