"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createInventoryItem } from "../actions";

type Props = {
  existingRooms: string[];
};

/**
 * Adds a room by creating a single placeholder item inside it (the only way
 * to materialise a room — there's no separate rooms table). The user is then
 * encouraged to rename / fill in details.
 */
export function AddRoomDialog({ existingRooms }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [room, setRoom] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    setError(null);
    const trimmed = room.trim();
    if (!trimmed) {
      setError("Room name is required.");
      return;
    }
    if (existingRooms.includes(trimmed)) {
      setError("A room with that name already exists.");
      return;
    }

    startTransition(async () => {
      // Create a single placeholder item to materialise the new room.
      const result = await createInventoryItem({
        room: trimmed,
        item: "(no items yet)",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRoom("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a room</DialogTitle>
          <DialogDescription>
            Rooms are created implicitly with their first item. We&apos;ll add a
            placeholder item — rename or delete it once you have real entries.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-room-name">Room name</Label>
          <Input
            id="new-room-name"
            autoFocus
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="e.g. Loft, Garage"
            disabled={pending}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Adding…" : "Add room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
