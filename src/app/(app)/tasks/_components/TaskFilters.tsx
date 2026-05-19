"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  PROPERTIES,
  STATUS_LABELS,
  CATEGORY_LABELS,
  PROPERTY_LABELS,
  type ProfileLite,
} from "@/lib/tasks/types";

type Props = {
  profiles: ProfileLite[];
};

const ANY = "__any__";

export function TaskFilters({ profiles }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ANY) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    startTransition(() => {
      router.push(`/tasks${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  function clear() {
    const view = searchParams.get("view");
    const params = new URLSearchParams();
    if (view) params.set("view", view);
    startTransition(() => {
      router.push(`/tasks${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  const property = searchParams.get("property") ?? ANY;
  const owner = searchParams.get("owner") ?? ANY;
  const category = searchParams.get("category") ?? ANY;
  const status = searchParams.get("status") ?? ANY;
  const hasFilter = [property, owner, category, status].some((v) => v !== ANY);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        label="Property"
        value={property}
        onChange={(v) => update("property", v)}
        options={PROPERTIES.map((p) => ({ value: p, label: PROPERTY_LABELS[p] }))}
      />
      <FilterSelect
        label="Owner"
        value={owner}
        onChange={(v) => update("owner", v)}
        options={profiles.map((p) => ({ value: p.id, label: p.display_name }))}
      />
      <FilterSelect
        label="Category"
        value={category}
        onChange={(v) => update("category", v)}
        options={TASK_CATEGORIES.map((c) => ({
          value: c,
          label: CATEGORY_LABELS[c],
        }))}
      />
      <FilterSelect
        label="Status"
        value={status}
        onChange={(v) => update("status", v)}
        options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
      />
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={pending}
          className="text-xs"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-[110px] text-xs">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
