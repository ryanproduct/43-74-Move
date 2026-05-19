"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROPERTIES,
  PROPERTY_LABELS,
  type Property,
} from "@/lib/tasks/types";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects/types";
import { createProject, updateProject } from "@/app/(app)/projects/actions";

type ContractorOption = { id: string; name: string };

export type ProjectFormDefaults = {
  id?: string;
  name?: string;
  property?: Property;
  status?: ProjectStatus;
  /** Existing budget in pence (loaded from DB). Will be rendered as GBP. */
  budget_pence?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  chosen_contractor_id?: string | null;
};

type Props = {
  mode: "create" | "edit";
  defaults?: ProjectFormDefaults;
  contractors: ContractorOption[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

const NONE = "__none__";

function penceToGbpString(pence: number | null | undefined): string {
  if (pence === null || pence === undefined) return "";
  return (pence / 100).toFixed(2);
}

/**
 * Create + edit form for a project. Designed to live inside a Dialog. The
 * budget input is in GBP and converted to integer pence in the server action.
 * The "Chosen contractor" select only lists contractors already linked to
 * this project — on a freshly-created project it will be empty (None only),
 * which is correct: you choose after the contractors come in.
 */
export function ProjectForm({
  mode,
  defaults,
  contractors,
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [property, setProperty] = React.useState<Property>(
    defaults?.property ?? "addison"
  );
  const [status, setStatus] = React.useState<ProjectStatus>(
    defaults?.status ?? "planning"
  );
  const [chosen, setChosen] = React.useState<string>(
    defaults?.chosen_contractor_id ?? NONE
  );

  async function handleSubmit(formData: FormData) {
    setError(null);

    formData.set("property", property);
    formData.set("status", status);
    formData.set("chosen_contractor_id", chosen === NONE ? "" : chosen);

    startTransition(async () => {
      const result =
        mode === "edit" && defaults?.id
          ? await updateProject(defaults.id, formData)
          : await createProject(formData);

      if (!result.ok) {
        setError(result.error);
        toast.error(
          mode === "edit" ? "Couldn't save project" : "Couldn't create project",
          { description: result.error }
        );
        return;
      }

      toast.success(mode === "edit" ? "Project updated" : "Project created");
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          placeholder="New bathroom"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Property</Label>
          <Select value={property} onValueChange={(v) => setProperty(v as Property)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROPERTY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ProjectStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="budget_gbp">Budget (£)</Label>
          <Input
            id="budget_gbp"
            name="budget_gbp"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={penceToGbpString(defaults?.budget_pence)}
            placeholder="e.g. 8500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={defaults?.start_date ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end_date">Target end date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={defaults?.end_date ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Chosen contractor</Label>
          <Select value={chosen} onValueChange={setChosen}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {contractors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contractors.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Add contractors linked to this project from the Contractors page
              first, then pick the winner here.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults?.description ?? ""}
          placeholder="Scope, requirements, links… Markdown supported."
          className="min-h-[160px] resize-y"
        />
        <p className="text-[11px] text-muted-foreground">
          Markdown supported — links, lists, headings, code.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create project"}
        </Button>
      </div>
    </form>
  );
}
