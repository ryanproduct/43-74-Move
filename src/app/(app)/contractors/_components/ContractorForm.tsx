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
  CONTRACTOR_VERDICTS,
  VERDICT_LABELS,
  type ContractorVerdict,
  type ProjectLite,
} from "@/lib/contractors/types";
import {
  createContractor,
  updateContractor,
} from "@/app/(app)/contractors/actions";

export type ContractorFormDefaults = {
  id?: string;
  name?: string;
  trade?: string;
  project_id?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  quote_amount_pence?: number | null;
  quote_includes?: string | null;
  quote_excludes?: string | null;
  timeline?: string | null;
  references_notes?: string | null;
  verdict?: ContractorVerdict;
  verdict_notes?: string | null;
  notes?: string | null;
};

type Props = {
  mode: "create" | "edit";
  defaults?: ContractorFormDefaults;
  projects: ProjectLite[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

const NONE = "__none__";

const TRADE_SUGGESTIONS = [
  "Bathroom fitter",
  "Tiler",
  "Plumber",
  "Electrician",
  "Decorator",
  "Carpenter",
  "Cleaner",
  "Removals",
  "Gardener",
  "Other",
];

/**
 * Create + edit form for a contractor. Designed to live inside a Dialog
 * (modal) or on its own. Long-form fields (includes, excludes, notes,
 * verdict notes) use Textareas; the `notes` field supports Markdown.
 * GBP amount is entered in pounds and converted to integer pence server-side.
 */
export function ContractorForm({
  mode,
  defaults,
  projects,
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [projectId, setProjectId] = React.useState(
    defaults?.project_id ?? NONE
  );
  const [verdict, setVerdict] = React.useState<ContractorVerdict>(
    defaults?.verdict ?? "considering"
  );

  // Quote amount: prefer pounds-with-pence; preserve null vs 0.
  const initialQuote =
    defaults?.quote_amount_pence === null ||
    defaults?.quote_amount_pence === undefined
      ? ""
      : (defaults.quote_amount_pence / 100).toFixed(2);

  async function handleSubmit(formData: FormData) {
    setError(null);

    formData.set("verdict", verdict);
    formData.set("project_id", projectId === NONE ? "" : projectId);

    startTransition(async () => {
      const result =
        mode === "edit" && defaults?.id
          ? await updateContractor(defaults.id, formData)
          : await createContractor(formData);

      if (!result.ok) {
        setError(result.error);
        toast.error(
          mode === "edit"
            ? "Couldn't save contractor"
            : "Couldn't create contractor",
          { description: result.error }
        );
        return;
      }

      toast.success(
        mode === "edit" ? "Contractor updated" : "Contractor added"
      );
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Business name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={defaults?.name ?? ""}
            placeholder="e.g. Riverside Bathrooms Ltd"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="trade">Trade</Label>
          <Input
            id="trade"
            name="trade"
            required
            list="contractor-trade-suggestions"
            defaultValue={defaults?.trade ?? ""}
            placeholder="Bathroom fitter"
          />
          <datalist id="contractor-trade-suggestions">
            {TRADE_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact_name">Contact name</Label>
          <Input
            id="contact_name"
            name="contact_name"
            defaultValue={defaults?.contact_name ?? ""}
            placeholder="Mark Pengelly"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaults?.phone ?? ""}
            placeholder="07712 345 678"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults?.email ?? ""}
            placeholder="hello@example.co.uk"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={defaults?.website ?? ""}
            placeholder="https://"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quote_amount">Quote amount (£)</Label>
          <Input
            id="quote_amount"
            name="quote_amount"
            inputMode="decimal"
            defaultValue={initialQuote}
            placeholder="9450"
          />
          <p className="text-[11px] text-muted-foreground">
            Enter pounds (e.g. 9450 or 9450.00). Stored as pence.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timeline">Timeline</Label>
          <Input
            id="timeline"
            name="timeline"
            defaultValue={defaults?.timeline ?? ""}
            placeholder="3 weeks from start · available from 5 June"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quote_includes">Quote includes</Label>
          <Textarea
            id="quote_includes"
            name="quote_includes"
            defaultValue={defaults?.quote_includes ?? ""}
            placeholder={"One item per line or separated by semicolons."}
            className="min-h-[100px] resize-y"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote_excludes">Quote excludes</Label>
          <Textarea
            id="quote_excludes"
            name="quote_excludes"
            defaultValue={defaults?.quote_excludes ?? ""}
            placeholder={"What's not in the quote."}
            className="min-h-[100px] resize-y"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="references_notes">References / reviews</Label>
        <Textarea
          id="references_notes"
          name="references_notes"
          defaultValue={defaults?.references_notes ?? ""}
          placeholder="Recommended by… Trustpilot 4.6/5… etc."
          className="min-h-[80px] resize-y"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Verdict</Label>
          <Select
            value={verdict}
            onValueChange={(v) => setVerdict(v as ContractorVerdict)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRACTOR_VERDICTS.map((v) => (
                <SelectItem key={v} value={v}>
                  {VERDICT_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="verdict_notes">Verdict notes</Label>
          <Input
            id="verdict_notes"
            name="verdict_notes"
            defaultValue={defaults?.verdict_notes ?? ""}
            placeholder="Why this verdict?"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaults?.notes ?? ""}
          placeholder="Long-form notes, links, paragraphs… Markdown supported."
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
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Add contractor"}
        </Button>
      </div>
    </form>
  );
}
