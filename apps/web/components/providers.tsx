"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LangProvider } from "@/components/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } }
  }));
  // LangProvider wraps everything so the language switch in the app menu also
  // reaches the pages under it, not just the shell around them.
  return <QueryClientProvider client={client}><LangProvider>{children}</LangProvider></QueryClientProvider>;
}
