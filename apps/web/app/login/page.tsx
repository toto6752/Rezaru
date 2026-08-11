import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

// Page titles are rendered on the server, where the language choice (held in
// localStorage) is not readable — so they stay in the default language.
export const metadata: Metadata = { title: "Вход" };
export default function LoginPage() { return <AuthForm mode="login" />; }
