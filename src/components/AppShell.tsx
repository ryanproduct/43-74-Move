import Link from "next/link";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NewTaskButton } from "@/components/NewTaskButton";
import { MobileTabBar, SidebarNav } from "@/components/SidebarNav";
import { UserMenu } from "@/components/UserMenu";

type AppShellProps = {
  user: {
    email: string;
    displayName: string;
    avatarColor: string;
  };
  children: React.ReactNode;
};

/**
 * The chrome around every authenticated route: top bar (wordmark, breadcrumb,
 * "+ New task", user menu), left sidebar (≥ md), and bottom tab bar (< md).
 * Server component — the interactive pieces are client components imported
 * here.
 */
export function AppShell({ user, children }: AppShellProps) {
  const initial = (user.displayName?.[0] ?? user.email[0] ?? "?").toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            aria-label="Move HQ home"
          >
            Move HQ
          </Link>
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-3">
          <NewTaskButton />
          <UserMenu
            displayName={user.displayName}
            email={user.email}
            avatarColor={user.avatarColor}
            initial={initial}
          />
        </div>
      </header>
      <div className="flex flex-1">
        <SidebarNav />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
