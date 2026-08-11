"use client";

import { authClient } from "@/lib/auth-client";
import { ArrowRight, Github, Loader2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";
import { useT } from "@/components/i18n";

type AuthMode = "login" | "register" | "forgot";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const t = useT();
  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "register") {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) throw new Error(result.error.message);
        const bootstrap = await fetch("/api/workspaces/bootstrap", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: workspace || name })
        });
        if (!bootstrap.ok) {
          const body = await bootstrap.json() as { error?: { message?: string } };
          throw new Error(body.error?.message ?? t("auth.workspaceFailed"));
        }
        router.push("/app/onboarding");
        router.refresh();
      } else if (mode === "login") {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/app" });
        if (result.error) throw new Error(result.error.message);
        router.push("/app");
        router.refresh();
      } else {
        const result = await authClient.requestPasswordReset({ email, redirectTo: "/login" });
        if (result.error) throw new Error(result.error.message);
        setMessage({ tone: "success", text: t("auth.resetSent") });
      }
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : t("common.somethingWrong") });
    } finally {
      setLoading(false);
    }
  }

  async function magicLink() {
    if (!email) {
      setMessage({ tone: "error", text: t("auth.enterEmailFirst") });
      return;
    }
    setLoading(true);
    const result = await authClient.signIn.magicLink({ email, callbackURL: "/app" });
    setLoading(false);
    setMessage(result.error
      ? { tone: "error", text: result.error.message ?? t("auth.linkFailed") }
      : { tone: "success", text: t("auth.linkSent") });
  }

  const title = mode === "register" ? t("auth.titleRegister") : mode === "login" ? t("auth.titleLogin") : t("auth.titleForgot");
  const subtitle = mode === "register" ? t("auth.subRegister") : mode === "login" ? t("auth.subLogin") : t("auth.subForgot");

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Logo />
        <div className="auth-heading"><div><Sparkles size={16} /></div><h1>{title}</h1><p>{subtitle}</p></div>
        <form onSubmit={submit}>
          {mode === "register" && <>
            <label>{t("auth.name")}<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder={t("auth.namePlaceholder")} /></label>
            <label>{t("auth.workspace")}<input required value={workspace} onChange={(event) => setWorkspace(event.target.value)} placeholder={t("auth.workspacePlaceholder")} /></label>
          </>}
          <label>{t("auth.email")}<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("auth.emailPlaceholder")} /></label>
          {mode !== "forgot" && <label>{t("auth.password")}
            <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("auth.passwordPlaceholder")} />
            {mode === "login" && <Link href="/forgot-password">{t("auth.forgot")}</Link>}
          </label>}
          {message && <div className={`form-message ${message.tone}`}>{message.text}</div>}
          <button className="button button-primary auth-submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : mode === "register" ? t("auth.submitRegister") : mode === "login" ? t("auth.submitLogin") : t("auth.submitForgot")}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>
        {mode !== "forgot" && <>
          <div className="auth-divider"><span>{t("auth.or")}</span></div>
          <div className="auth-alternatives">
            <button onClick={magicLink} disabled={loading}><Mail size={16} /> {t("auth.emailLink")}</button>
            {process.env.NEXT_PUBLIC_GITHUB_OAUTH === "true" && <button onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/app" })}><Github size={16} /> GitHub</button>}
          </div>
        </>}
        <p className="auth-switch">
          {mode === "register" ? <>{t("auth.haveAccount")} <Link href="/login">{t("auth.signIn")}</Link></> :
           mode === "login" ? <>{t("auth.newHere")} <Link href="/register">{t("auth.startFree")}</Link></> :
           <Link href="/login">{t("auth.backToLogin")}</Link>}
        </p>
      </section>
      <aside className="auth-aside">
        <div className="auth-quote">
          <span>REZARU</span>
          <blockquote>{t("auth.quote")}</blockquote>
          <div className="auth-mini-plan">
            {(["auth.step1", "auth.step2", "auth.step3"] as const).map((key, index) => <div key={key}><i>{index + 1}</i><span>{t(key)}</span></div>)}
          </div>
        </div>
      </aside>
    </main>
  );
}
