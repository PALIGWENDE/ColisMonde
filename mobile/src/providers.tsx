import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/auth";

/** Port de web/src/app/providers.tsx — au démarrage, tente de restaurer la session via le refresh token stocké (expo-secure-store côté mobile, cookie httpOnly côté web). */
function AuthBootstrap({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setGuest = useAuthStore((s) => s.setGuest);

  useEffect(() => {
    if (status !== "idle") return;
    setLoading();
    apiClient
      .refresh()
      .then((token) => {
        if (!token) setGuest();
      })
      .catch(() => setGuest());
  }, [status, setLoading, setGuest]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  );
}
