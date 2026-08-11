import { MailCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { T } from "@/components/i18n";

export default function VerifyEmailPage() {
  return <main className="simple-auth"><Logo /><MailCheck size={30} /><h1><T k="auth.checkInbox" /></h1><p><T k="auth.checkInboxCopy" /></p><Link className="button button-secondary" href="/login"><T k="auth.backToLogin" /></Link></main>;
}
