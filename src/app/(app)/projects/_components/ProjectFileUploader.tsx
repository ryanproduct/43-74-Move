"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { recordAttachment } from "@/app/(app)/projects/[id]/actions";

type Props = {
  projectId: string;
  className?: string;
};

/**
 * Drag-drop + click uploader for project attachments. Uploads each file to
 * the private `attachments` bucket under `project/<project-id>/<uuid>-<name>`,
 * then records a row via the project `recordAttachment` server action.
 *
 * Functionally identical to the task-side uploader but parameterised for
 * projects; kept local to avoid editing a component owned by another agent.
 */
export function ProjectFileUploader({ projectId, className }: Props) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const supabase = createClient();

    try {
      for (const file of Array.from(files)) {
        const uuid =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `project/${projectId}/${uuid}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setError(uploadError.message);
          continue;
        }

        const result = await recordAttachment({
          projectId,
          filename: file.name,
          storagePath,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });

        if (!result.ok) {
          setError(result.error);
        }
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-muted/50",
        dragging && "border-foreground/40 bg-muted/60",
        uploading && "pointer-events-none opacity-70",
        className
      )}
    >
      <Upload className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-medium">
        {uploading ? "Uploading…" : "Drop files or click to upload"}
      </p>
      <p className="text-[11px] text-muted-foreground">
        Stored privately, viewable via signed URL.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
