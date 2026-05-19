import { cn } from "@/lib/utils";
import type { Property } from "@/lib/tasks/types";
import { PROPERTY_LABELS } from "@/lib/tasks/types";

const STYLES: Record<Property, string> = {
  hogarth: "bg-amber-100 text-amber-800 border-amber-200",
  addison: "bg-emerald-100 text-emerald-800 border-emerald-200",
  both: "bg-slate-100 text-slate-700 border-slate-200",
};

export function PropertyPill({
  value,
  className,
}: {
  value: Property;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STYLES[value],
        className
      )}
    >
      {PROPERTY_LABELS[value]}
    </span>
  );
}
