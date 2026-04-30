import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data instantly, refetch in background when stale
      staleTime: 60_000, // 1 minute
      // Keep unused cache entries for 10 minutes
      gcTime: 10 * 60 * 1000,
      // DISABLE refetch when the tab / window regains focus to avoid "hangs"
      refetchOnWindowFocus: false,
      // Retry up to 3 times on failure (with exponential backoff)
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      // Don't refetch on every remount if data is still fresh
      refetchOnMount: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
