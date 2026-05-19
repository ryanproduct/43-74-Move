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

/**
 * "+ Add utility" trigger above the utilities table. Opens the
 * `UtilityForm` inside a Dialog.
 */
export function AddUtilityButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5"
        aria-label="Add a utility"
      >
        <Plus className="h-4 w-4" />
        <span>Add utility</span>
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
