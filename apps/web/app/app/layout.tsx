import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const [context, session] = await Promise.all([
    getWorkspaceContext(),
    auth.api.getSession({ headers: await headers() })
  ]);
  if (!context) redirect("/login");
  return <AppShell workspaceName={context.workspaceName} userName={session?.user.name ?? "Demo operator"} role={context.role} plan={context.plan}>{children}</AppShell>;
}
