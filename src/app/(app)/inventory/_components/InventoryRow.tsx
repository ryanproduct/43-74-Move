"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InventoryRow as InventoryItem } from "@/lib/inventory/types";

import {
  deleteInventoryItem,
  setInventoryNotes,
  updateInventoryItem,
} from "../actions";
import { DecisionPill } from "./DecisionPill";
import { InventoryPhotoCell } from "./InventoryPhotoCell";
import { PriorityStarToggle } from "./PriorityStarToggle";

type Props = {
  item: InventoryItem;
  /** Pre-signed 1h URL for `item.photo_path`, or null when missing. */
  photoSignedUrl: string | null;
};

export function InventoryRow({ item, photoSignedUrl }: Props) {
  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-start gap-3 rounded-md border bg-background px-3 py-2.5 md:grid-cols-[40px_minmax(0,1fr)_auto_auto_minmax(0,180px)_auto]">
      {/* Photo */}
      <div className="row-span-2 md:row-span-1">
        <InventoryPhotoCell
          itemId={item.id}
          photoPath={item.photo_path}
          signedUrl={photoSignedUrl}
        />
      </div>

      {/* Item name (inline-editable) */}
      <div className="min-w-0">
        <EditableItemName itemId={item.id} initialItem={item.item} />
      </div>

      {/* Decision pill */}
      <div className="flex items-center md:order-3">
        <DecisionPill itemId={item.id} value={item.decision} />
      </div>

      {/* Priority star */}
      <div className="hidden md:order-4 md:flex md:items-center">
        <PriorityStarToggle itemId={item.id} value={item.priority_unpack} />
      </div>

      {/* Notes (inline-editable, truncated) */}
      <div className="col-span-2 min-w-0 md:order-5 md:col-span-1">
        <EditableNotes itemId={item.id} initialNotes={item.notes} />
      </div>

      {/* Mobile star + delete; desktop delete only */}
      <div className="col-start-3 row-start-1 flex items-start gap-1 md:order-6 md:row-start-auto">
        <span className="md:hidden">
          <PriorityStarToggle itemId={item.id} value={item.priority_unpack} />
        </span>
        <DeleteItemButton itemId={item.id} itemName={item.item} />
      </div>
    </div>
  );
}

function EditableItemName({
  itemId,
  initialItem,
}: {
  itemId: string;
  initialItem: string;
}) {
  const [editing, setEditing] = React.useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit"
        className="block w-full truncate rounded px-1 py-0.5 text-left text-sm font-medium hover:bg-accent/50"
      >
        {initialItem}
      </button>
    );
  }

  // Mount the editor with the current initial value. Closing it (commit /
  // cancel) unmounts the editor, so realtime updates always re-seed it.
  return (
    <ItemNameEditor
      itemId={itemId}
      initialItem={initialItem}
      onClose={() => setEditing(false)}
    />
  );
}

function ItemNameEditor({
  itemId,
  initialItem,
  onClose,
}: {
  itemId: string;
  initialItem: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialItem);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function commit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Item name cannot be empty.");
      return;
    }
    if (trimmed === initialItem) {
      onClose();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateInventoryItem(itemId, trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        disabled={pending}
        className="h-7 text-sm"
      />
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

function EditableNotes({
  itemId,
  initialNotes,
}: {
  itemId: string;
  initialNotes: string | null;
}) {
  const [editing, setEditing] = React.useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit notes"
        className={cn(
          "block w-full truncate rounded px-1 py-0.5 text-left text-xs hover:bg-accent/50",
          initialNotes ? "text-muted-foreground" : "italic text-muted-foreground/60"
        )}
      >
        {initialNotes ?? "Add a note…"}
      </button>
    );
  }

  return (
    <NotesEditor
      itemId={itemId}
      initialNotes={initialNotes}
      onClose={() => setEditing(false)}
    />
  );
}

function NotesEditor({
  itemId,
  initialNotes,
  onClose,
}: {
  itemId: string;
  initialNotes: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialNotes ?? "");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function commit() {
    const next = value.trim();
    const prev = (initialNotes ?? "").trim();
    if (next === prev) {
      onClose();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setInventoryNotes(itemId, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        disabled={pending}
        rows={2}
        className="min-h-[44px] text-xs"
      />
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

function DeleteItemButton({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function onDelete() {
    if (!confirm(`Delete "${itemName}"?`)) return;
    startTransition(async () => {
      const result = await deleteInventoryItem(itemId);
      if (result.ok) router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onDelete}
      disabled={pending}
      title="Delete item"
      aria-label={`Delete ${itemName}`}
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
