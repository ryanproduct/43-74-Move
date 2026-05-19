import Link from "next/link";
import { Phone, Mail, Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatGBPFromPence,
  type ContractorRow,
} from "@/lib/contractors/types";
import { VerdictPill } from "./VerdictPill";

type Props = {
  contractor: ContractorRow;
  /** Whether to show the trade (hidden in trade-grouped lists where it's redundant). */
  showTrade?: boolean;
  /** Whether to show the project name (hidden in project-grouped lists). */
  showProject?: boolean;
  className?: string;
};

/**
 * Compact card for the contractor list view. Whole card is a link to the
 * detail page. Shows the verdict pill, headline number (quote), trade or
 * project context, and a small row of contact methods.
 */
export function ContractorCard({
  contractor,
  showTrade = true,
  showProject = true,
  className,
}: Props) {
  const { id, name, trade, quote_amount_pence, project, verdict } = contractor;

  return (
    <Link
      href={`/contractors/${id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold leading-tight">
            {name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {showTrade ? trade : showProject && project ? project.name : trade}
            {showTrade && showProject && project ? (
              <>
                <span className="mx-1.5 text-muted-foreground/50">·</span>
                <span>{project.name}</span>
              </>
            ) : null}
          </p>
        </div>
        <VerdictPill value={verdict} />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-lg font-semibold tabular-nums">
          {quote_amount_pence === null ? (
            <span className="text-xs font-normal text-muted-foreground">
              No quote yet
            </span>
          ) : (
            formatGBPFromPence(quote_amount_pence)
          )}
        </p>
        <ContactGlyphs
          phone={contractor.phone}
          email={contractor.email}
          website={contractor.website}
        />
      </div>
    </Link>
  );
}

function ContactGlyphs({
  phone,
  email,
  website,
}: {
  phone: string | null;
  email: string | null;
  website: string | null;
}) {
  const items: { key: string; icon: React.ReactNode; label: string }[] = [];
  if (phone)
    items.push({ key: "p", icon: <Phone className="h-3 w-3" />, label: "Phone" });
  if (email)
    items.push({ key: "e", icon: <Mail className="h-3 w-3" />, label: "Email" });
  if (website)
    items.push({
      key: "w",
      icon: <Globe className="h-3 w-3" />,
      label: "Website",
    });
  if (items.length === 0) return null;
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {items.map((it) => (
        <span
          key={it.key}
          aria-label={it.label}
          title={it.label}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border bg-background"
        >
          {it.icon}
        </span>
      ))}
    </span>
  );
}
