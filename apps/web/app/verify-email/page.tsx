import { MailCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function VerifyEmailPage() {
  return <main className="simple-auth"><Logo /><MailCheck size={30} /><h1>Check your inbox</h1><p>Open the verification link we sent to finish securing your OutcomeOS account.</p><Link className="button button-secondary" href="/login">Return to sign in</Link></main>;
}
