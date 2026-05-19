"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/SidebarNav";

function labelForSegment(segment: string, href: string): string {
  const match = NAV_ITEMS.find((item) => item.href === href);
  if (match) return match.label;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") {
    return <span className="text-sm text-muted-foreground">Dashboard</span>;
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    return { href, label: labelForSegment(segment, href) };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden text-sm text-muted-foreground sm:block">
      <ol className="flex items-center gap-1">
        <li>
          <Link href="/" className="hover:text-foreground">
            Move HQ
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              <span aria-hidden>/</span>
              {isLast ? (
                <span className="text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
