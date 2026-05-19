import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentProfile } from "@/lib/profile";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentProfile();

  // The proxy already redirects unauthenticated requests to /login, but we
  // guard again here so server components inside the shell can safely assume
  // a user exists.
  if (!session) {
    redirect("/login");
  }

  const displayName =
    session.profile?.display_name ??
    session.email.split("@")[0] ??
    "Guest";
  const avatarColor = session.profile?.avatar_color ?? "sky-500";

  return (
    <AppShell user={{ email: session.email, displayName, avatarColor }}>
      {children}
      <RegisterServiceWorker />
      <Toaster />
    </AppShell>
  );
}
