"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createInventoryItem } from "../actions";

type Props = {
  rooms: string[];
  /** If set, pre-selects this room and locks the picker (used per-room footer). */
  lockedRoom?: string;
};

const NEW_ROOM = "__new_room__";

/**
 * Small inline form to add an item. The room picker is a `Select` over the
 * known rooms plus a "+ New room…" option that swaps in a free-text input.
 * Submitting creates an inventory row; the new room is implicitly created.
 */
export function AddItemForm({ rooms, lockedRoom }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const initialRoom = lockedRoom ?? rooms[0] ?? NEW_ROOM;
  const [roomMode, setRoomMode] = React.useState<string>(initialRoom);
  const [newRoom, setNewRoom] = React.useState("");
  const [item, setItem] = React.useState("");

  function submit() {
    setError(null);
    const chosenRoom =
      lockedRoom ?? (roomMode === NEW_ROOM ? newRoom.trim() : roomMode);
    if (!chosenRoom) {
      setError("Pick or name a room.");
      return;
    }
    if (!item.trim()) {
      setError("Item name is required.");
      return;
    }

    startTransition(async () => {
      const result = await createInventoryItem({
        room: chosenRoom,
        item: item.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        toast.error("Couldn't add item", { description: result.error });
        return;
      }
      toast.success(`Added "${item.trim()}"`);
      setItem("");
      if (!lockedRoom && roomMode === NEW_ROOM) {
        // Keep the new room as the active option so the next add lands there.
        setRoomMode(newRoom.trim());
        setNewRoom("");
      }
      router.refresh();
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {!lockedRoom && (
          <Select value={roomMode} onValueChange={setRoomMode}>
            <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
              <SelectValue placeholder="Room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r} value={r} className="text-xs">
                  {r}
                </SelectItem>
              ))}
              <SelectItem value={NEW_ROOM} className="text-xs">
                + New room…
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {!lockedRoom && roomMode === NEW_ROOM && (
          <Input
            value={newRoom}
            placeholder="New room name"
            onChange={(e) => setNewRoom(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            className="h-8 w-[160px] text-xs"
          />
        )}

        <Input
          value={item}
          placeholder={
            lockedRoom ? `Add an item to ${lockedRoom}` : "Item name"
          }
          onChange={(e) => setItem(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={pending}
          className="h-8 flex-1 min-w-[160px] text-xs"
        />

        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={pending}
          className="h-8 gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
