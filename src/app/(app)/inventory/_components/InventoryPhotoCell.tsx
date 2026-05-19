"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { setInventoryPhoto } from "../actions";

type Props = {
  itemId: string;
  photoPath: string | null;
  /** 1h signed URL pre-resolved on the server, or null if no photo / signing failed. */
  signedUrl: string | null;
};

/**
 * Renders the photo thumbnail (when present) and a small upload affordance
 * (when absent). Uploads go to the private `attachments` bucket under
 * `inventory/<item-id>/<uuid>-<filename>`; on success we call the server
 * action `setInventoryPhoto` to persist the path, then refresh.
 */
export function InventoryPhotoCell({ itemId, photoPath, signedUrl }: Props) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const uuid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `inventory/${itemId}/${uuid}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await setInventoryPhoto(itemId, storagePath);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  const hasPhoto = !!photoPath;
  const previewUrl = hasPhoto ? signedUrl : null;

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={
          hasPhoto ? "Replace photo for this item" : "Upload a photo for this item"
        }
        title={hasPhoto ? "Click to replace photo" : "Click to upload a photo"}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60",
          hasPhoto && "border-solid",
          !hasPhoto && "border-dashed"
        )}
      >
        {hasPhoto && previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block h-full w-full"
          >
            {/* Plain <img> is intentional — signed URLs from Supabase aren't on
                the next/image remote-pattern allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Inventory item photo"
              className="h-full w-full object-cover"
            />
          </a>
        ) : hasPhoto ? (
          // Photo path is set but signing failed; show a generic image marker.
          <ImagePlus className="h-4 w-4" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-[10px] font-medium">
            …
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      {error && <p className="max-w-[140px] text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
