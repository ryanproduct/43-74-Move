"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ContractorForm,
  type ContractorFormDefaults,
} from "@/app/(app)/contractors/_components/ContractorForm";
import { deleteContractor } from "@/app/(app)/contractors/actions";
import type { ProjectLite } from "@/lib/contractors/types";

type Props = {
  defaults: ContractorFormDefaults & { id: string };
  projects: ProjectLite[];
};

/**
 * "Edit" trigger + edit-mode modal. Also wires the danger-zone delete.
 */
export function EditContractorButton({ defaults, projects }: Props) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const [deleting, startDelete] = React.useTransition();

  function onDelete() {
    if (
      !confirm(
        `Delete "${defaults.name}"? Notes, attachments and comments will be removed.`
      )
    ) {
      return;
    }
    startDelete(async () => {
      const result = await deleteContractor(defaults.id);
      if (result && !result.ok) {
        toast.error("Couldn't delete contractor", {
          description: result.error,
        });
        return;
      }
      toast.success(`Deleted "${defaults.name}"`);
      router.push("/contractors");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit contractor</DialogTitle>
            <DialogDescription>
              Update the quote, contact, or any other field.
            </DialogDescription>
          </DialogHeader>
          <ContractorForm
            mode="edit"
            defaults={defaults}
            projects={projects}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={deleting}
        className="gap-1.5 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {deleting ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}
