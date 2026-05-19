"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { UtilityForm } from "./UtilityForm";

type Props = {
  /** Override the button label, e.g. for empty-state CTAs. */
  label?: string;
};

/**
 * "+ Add utility" trigger above the utilities table. Opens the
 * `UtilityForm` inside a Dialog. Reused inside the empty state via the
 * optional `label` prop ("Add the first utility").
 */
export function AddUtilityButton({ label = "Add utility" }: Props = {}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5"
        aria-label={label}
      >
        <Plus className="h-4 w-4" />
        <span>{label}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New utility</DialogTitle>
            <DialogDescription>
              Track a service to set up, switch over, or cancel.
            </DialogDescription>
          </DialogHeader>
          <UtilityForm
            mode="create"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
