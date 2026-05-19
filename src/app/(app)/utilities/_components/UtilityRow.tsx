import Link from "next/link";
import { ExternalLink, Phone } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  UTILITY_ADDISON_ACTION_LABELS,
  UTILITY_HOGARTH_ACTION_LABELS,
  UTILITY_TYPE_LABELS,
  type UtilityRow as UtilityRowType,
} from "@/lib/utilities/types";

import { InlineDateCell } from "./InlineDateCell";
import { InlineStatusCell } from "./InlineStatusCell";

type Props = {
  utility: UtilityRowType;
};

/**
 * Table row for the utilities list. The `status` and `switch_date` cells
 * are inline-editable; clicking them toggles to a Select / date input that
 * saves via a server action.
 */
export function UtilityRow({ utility }: Props) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          href={`/utilities/${utility.id}`}
          className="hover:underline underline-offset-2"
        >
          {utility.name}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {UTILITY_TYPE_LABELS[utility.type]}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {utility.account_number ?? "—"}
      </TableCell>
      <TableCell className="text-xs">
        {UTILITY_HOGARTH_ACTION_LABELS[utility.hogarth_action]}
      </TableCell>
      <TableCell className="text-xs">
        {UTILITY_ADDISON_ACTION_LABELS[utility.addison_action]}
      </TableCell>
      <TableCell>
        <InlineDateCell utilityId={utility.id} value={utility.switch_date} />
      </TableCell>
      <TableCell>
        <InlineStatusCell utilityId={utility.id} value={utility.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          {utility.contact_phone && (
            <a
              href={`tel:${utility.contact_phone}`}
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {utility.contact_phone}
            </a>
          )}
          {utility.contact_url && (
            <a
              href={utility.contact_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              <span className="truncate max-w-[160px]">Website</span>
            </a>
          )}
          {!utility.contact_phone && !utility.contact_url && (
            <span>—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
