"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProjectLite } from "@/lib/contractors/types";
import { ContractorForm } from "./ContractorForm";

type Props = {
  projects: ProjectLite[];
  /** Override the button label, e.g. for empty-state CTAs. */
  label?: string;
};

/**
 * "+ New contractor" trigger + create-mode modal. Closes on success. Reused
 * inside the empty state via the optional `label` prop.
 */
export function NewContractorButton({ projects, label = "New contractor" }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New contractor</DialogTitle>
          <DialogDescription>
            Capture a quote, contact, and your verdict.
          </DialogDescription>
        </DialogHeader>
        <ContractorForm
          mode="create"
          projects={projects}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
