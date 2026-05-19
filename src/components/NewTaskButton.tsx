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

/**
 * Persistent "+ New task" trigger in the top bar. The real TaskForm lands in
 * Prompt 4 — for now the dialog body is a friendly placeholder so the wiring
 * (keyboard focus, close button, overlay) is exercised end-to-end.
 */
export function NewTaskButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5"
        aria-label="Create a new task"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">New task</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Task creation lands in Prompt 4. The full Markdown-friendly form
              will live behind this button.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
