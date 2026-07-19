"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/auth";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return <>{children}</>;
}

function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // best-effort : l'app reste utilisable sans service worker (juste pas installable)
      });
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegistration />
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  );
}
