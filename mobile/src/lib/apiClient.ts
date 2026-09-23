import * as SecureStore from "expo-secure-store";
import type { ApiErrorBody } from "@colismonde/shared";
import { API_URL } from "@/lib/config";
import { useAuthStore } from "@/store/auth";

const REFRESH_TOKEN_KEY = "cm_refresh_token";

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.status = status;
    this.code = body.error;
    this.details = body.details;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

/**
 * Best-effort : expo-secure-store n'est pas supporté sur la cible web (react-native-web, utile
 * seulement pour du debug rapide en navigateur, pas une cible de prod) — un échec ici ne doit
 * jamais casser le flux de connexion/inscription, la session est déjà active en mémoire (Zustand).
 */
export async function persistRefreshToken(token: string) {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (err) {
    console.warn("[apiClient] Échec de la persistance du refresh token", err);
  }
}

export async function clearRefreshToken() {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.warn("[apiClient] Échec de la suppression du refresh token", err);
  }
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Le web renvoie ici sur le cookie httpOnly cm_refresh (credentials:"include"). RN n'a pas de vrai
 * cookie jar navigateur pour ça de façon fiable, donc le refresh token est stocké explicitement via
 * expo-secure-store et renvoyé dans le corps JSON — le backend l'accepte pour les clients envoyant
 * X-Client-Type: mobile (voir backend/src/modules/auth/auth.routes.ts).
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
      if (!storedRefreshToken) return null;

      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Client-Type": "mobile" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        useAuthStore.getState().setSession(data.user, data.accessToken);
        if (data.refreshToken) await persistRefreshToken(data.refreshToken);
        return data.accessToken as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRetry, headers, ...rest } = options;
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "X-Client-Type": "mobile",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuthRetry && !path.startsWith("/api/auth")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, { ...options, skipAuthRetry: true });
    }
    useAuthStore.getState().clear();
    await clearRefreshToken();
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiClientError(res.status, data ?? { error: "UNKNOWN", message: "Une erreur est survenue" });
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
  refresh: refreshAccessToken,
};

/** Pour les envois de fichiers (multipart), sans forcer Content-Type JSON. */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "X-Client-Type": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new ApiClientError(res.status, data ?? { error: "UNKNOWN", message: "Échec de l'envoi du fichier" });
  }
  return data as T;
}
