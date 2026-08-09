"use client";

import type { Lang } from "@/components/landing-copy";

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (next: Lang) => void }) {
  return (
    <div className="lang-switch" role="group" aria-label="Язык / Language">
      {(["ru", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={lang === code ? "is-active" : ""}
          aria-pressed={lang === code}
          onClick={() => onChange(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
