"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANG_KEY, type Lang } from "@/components/landing-copy";
import { roleLabel, statusLabel, uiCopy, type UiCopyKey } from "@/components/ui-copy";

/**
 * Language for everything behind the login.
 *
 * The choice lives in localStorage under the same key the landing uses, so
 * picking RU on the marketing page carries into the product and back.
 *
 * localStorage cannot be read on the server, so the first paint is always
 * Russian — the default for this market — and English swaps in on hydration
 * for the people who chose it. Storing the choice in a cookie would let the
 * server render it directly; that is the upgrade path if the flash ever
 * becomes noticeable.
 */
type LangContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (typeof uiCopy)[Lang];
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "ru" || saved === "en") setLangState(saved);
    } catch {
      // private mode — the default stands
    }
  }, []);

  // Another tab switching language should not leave this one out of step.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== LANG_KEY) return;
      if (event.newValue === "ru" || event.newValue === "en") setLangState(event.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // private mode — the choice just will not survive a reload
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: uiCopy[lang] }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

function useLangContext(): LangContextValue {
  const value = useContext(LangContext);
  // Falling back keeps a stray component outside the provider rendering real
  // Russian text rather than throwing in production.
  if (!value) return { lang: "ru", setLang: () => {}, t: uiCopy.ru };
  return value;
}

/** The active language plus a setter — for the toggle and for date formatting. */
export function useLang() {
  const { lang, setLang } = useLangContext();
  return { lang, setLang };
}

/** The dictionary, for client components. `t("app.save")` returns a string. */
export function useT() {
  const { t } = useLangContext();
  return useCallback((key: UiCopyKey) => t[key], [t]);
}

/**
 * A single translated string as an element.
 *
 * This exists so server components — the product pages, which stay server
 * components because they query the database directly — can carry translated
 * text without becoming client components wholesale.
 */
export function T({ k }: { k: UiCopyKey }) {
  const { t } = useLangContext();
  return <>{t[k]}</>;
}

/** A database status enum rendered in the reader's language. */
export function StatusLabel({ status }: { status: string }) {
  const { lang } = useLangContext();
  return <>{statusLabel(lang, status)}</>;
}

/** A workspace role rendered in the reader's language. */
export function RoleLabel({ role }: { role: string }) {
  const { lang } = useLangContext();
  return <>{roleLabel(lang, role)}</>;
}

/** Dates formatted for the active language rather than the server locale. */
export function useLocale() {
  const { lang } = useLangContext();
  return lang === "ru" ? "ru-RU" : "en-GB";
}

/**
 * A timestamp in the reader's language and time zone.
 *
 * The server renders in its own zone (UTC on the host) and the browser in the
 * visitor's, so the two passes legitimately differ — hence
 * suppressHydrationWarning on the text node rather than a mismatch warning on
 * every table row.
 */
export function LocalDate({ value, withTime = false }: { value: Date | string | number; withTime?: boolean }) {
  const locale = useLocale();
  const date = value instanceof Date ? value : new Date(value);
  const text = withTime ? date.toLocaleString(locale) : date.toLocaleDateString(locale);
  return <span suppressHydrationWarning>{text}</span>;
}
