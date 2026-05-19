import { Boxes } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import {
  listInventory,
  signedInventoryPhotoUrl,
} from "@/lib/inventory/queries";

import { AddItemForm } from "./_components/AddItemForm";
import { AddRoomDialog } from "./_components/AddRoomDialog";
import { InventoryRealtime } from "./_components/InventoryRealtime";
import { RoomSection } from "./_components/RoomSection";

export default async function InventoryPage() {
  const rooms = await listInventory();
  const roomNames = rooms.map((r) => r.room);

  // Resolve all photo signed URLs in parallel so each row can render its
  // thumbnail without round-tripping at hydration time.
  const photoPaths = Array.from(
    new Set(
      rooms.flatMap((r) => r.items.map((i) => i.photo_path).filter(Boolean))
    )
  ) as string[];

  const photoUrlEntries = await Promise.all(
    photoPaths.map(async (p) => [p, await signedInventoryPhotoUrl(p, 3600)] as const)
  );
  const photoUrls: Record<string, string | null> = Object.fromEntries(
    photoUrlEntries
  );

  const totalItems = rooms.reduce((acc, r) => acc + r.items.length, 0);
  const totalDecided = rooms.reduce((acc, r) => acc + r.doneCount, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <InventoryRealtime />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Per-room contents at 43 Hogarth — sort each item into keep / sell /
            donate / bin, and flag the essentials for the first-day box.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {totalDecided}/{totalItems} decided
          </span>
          <AddRoomDialog existingRooms={roomNames} />
        </div>
      </header>

      <AddItemForm rooms={roomNames} />

      {rooms.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-8 w-8" />}
          title="No rooms yet"
          description="Add a room to start cataloguing what stays, what goes, and what gets unpacked first."
          action={<AddRoomDialog existingRooms={roomNames} />}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rooms.map((r) => (
            <RoomSection
              key={r.room}
              room={r.room}
              items={r.items}
              doneCount={r.doneCount}
              photoUrls={photoUrls}
            />
          ))}
        </div>
      )}
    </div>
  );
}
