import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data instantly, refetch in background when stale
      staleTime: 30_000,
      // Keep unused cache entries for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Refetch when the tab / window regains focus
      refetchOnWindowFocus: true,
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
