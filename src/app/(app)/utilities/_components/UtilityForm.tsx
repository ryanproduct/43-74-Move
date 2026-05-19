"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
  UTILITY_ADDISON_ACTIONS,
  UTILITY_ADDISON_ACTION_LABELS,
  UTILITY_HOGARTH_ACTIONS,
  UTILITY_HOGARTH_ACTION_LABELS,
  UTILITY_STATUSES,
  UTILITY_STATUS_LABELS,
  UTILITY_TYPES,
  UTILITY_TYPE_LABELS,
  type UtilityAddisonAction,
  type UtilityHogarthAction,
  type UtilityStatus,
  type UtilityType,
} from "@/lib/utilities/types";
import {
  createUtility,
  updateUtility,
} from "@/app/(app)/utilities/actions";

export type UtilityFormDefaults = {
  id?: string;
  name?: string;
  type?: UtilityType;
  account_number?: string | null;
  hogarth_action?: UtilityHogarthAction;
  addison_action?: UtilityAddisonAction;
  switch_date?: string | null;
  status?: UtilityStatus;
  contact_phone?: string | null;
  contact_url?: string | null;
  notes?: string | null;
};

type Props = {
  mode: "create" | "edit";
  defaults?: UtilityFormDefaults;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/**
 * Create + edit form for a utility. Mirrors `TaskForm`'s layout. Designed
 * to live inside a Dialog (modal) or on its own page.
 */
export function UtilityForm({ mode, defaults, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [type, setType] = React.useState<UtilityType>(
    defaults?.type ?? "other"
  );
  const [hogarthAction, setHogarthAction] = React.useState<UtilityHogarthAction>(
    defaults?.hogarth_action ?? "none"
  );
  const [addisonAction, setAddisonAction] = React.useState<UtilityAddisonAction>(
    defaults?.addison_action ?? "none"
  );
  const [status, setStatus] = React.useState<UtilityStatus>(
    defaults?.status ?? "not_started"
  );

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    formData.set("hogarth_action", hogarthAction);
    formData.set("addison_action", addisonAction);
    formData.set("status", status);

    startTransition(async () => {
      const result =
        mode === "edit" && defaults?.id
          ? await updateUtility(defaults.id, formData)
          : await createUtility(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

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
          placeholder="Octopus Energy, Virgin Media, …"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as UtilityType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UTILITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {UTILITY_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account_number">Account number</Label>
          <Input
            id="account_number"
            name="account_number"
            defaultValue={defaults?.account_number ?? ""}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Hogarth action</Label>
          <Select
            value={hogarthAction}
            onValueChange={(v) => setHogarthAction(v as UtilityHogarthAction)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UTILITY_HOGARTH_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {UTILITY_HOGARTH_ACTION_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Addison action</Label>
          <Select
            value={addisonAction}
            onValueChange={(v) => setAddisonAction(v as UtilityAddisonAction)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UTILITY_ADDISON_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {UTILITY_ADDISON_ACTION_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="switch_date">Switch date</Label>
          <Input
            id="switch_date"
            name="switch_date"
            type="date"
            defaultValue={defaults?.switch_date ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as UtilityStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UTILITY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {UTILITY_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input
            id="contact_phone"
            name="contact_phone"
            defaultValue={defaults?.contact_phone ?? ""}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact_url">Contact URL</Label>
          <Input
            id="contact_url"
            name="contact_url"
            type="url"
            defaultValue={defaults?.contact_url ?? ""}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaults?.notes ?? ""}
          placeholder="Markdown supported."
          className="min-h-[120px] resize-y"
        />
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
              : "Create utility"}
        </Button>
      </div>
    </form>
  );
}
