"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CheckSquare,
  Folder,
  HardHat,
  LayoutDashboard,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, mobile: true },
  { href: "/tasks", label: "Tasks", Icon: CheckSquare, mobile: true },
  { href: "/utilities", label: "Utilities", Icon: Plug, mobile: true },
  { href: "/contractors", label: "Contractors", Icon: HardHat, mobile: true },
  { href: "/projects", label: "Projects", Icon: Folder, mobile: true },
  { href: "/inventory", label: "Inventory", Icon: Boxes, mobile: true },
  { href: "/settings", label: "Settings", Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="hidden h-full w-56 flex-col border-r bg-sidebar text-sidebar-foreground md:flex"
    >
      <ul className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <nav
      aria-label="Main (mobile)"
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden"
    >
      <ul className="grid grid-cols-6">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
