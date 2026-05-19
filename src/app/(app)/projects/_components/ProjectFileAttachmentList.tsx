"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { File as FileIcon, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { deleteAttachment } from "@/app/(app)/projects/[id]/actions";

export type ProjectAttachmentWithUrl = {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  signed_url: string | null;
};

type Props = {
  projectId: string;
  attachments: ProjectAttachmentWithUrl[];
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ProjectFileAttachmentList({ projectId, attachments }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove(att: ProjectAttachmentWithUrl) {
    if (
      !confirm(`Remove "${att.filename}"? This deletes the file from storage.`)
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAttachment(att.id, projectId, att.storage_path);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (attachments.length === 0) {
    return (
      <EmptyState
        icon={<FileIcon className="h-6 w-6" />}
        title="No attachments yet"
        description="Drop a quote, mood-board image, or spec sheet into the uploader above."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y rounded-md border">
      {attachments.map((att) => (
        <li
          key={att.id}
          className="flex items-center gap-3 px-3 py-2 text-sm"
        >
          <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 truncate">
            {att.signed_url ? (
              <a
                href={att.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {att.filename}
              </a>
            ) : (
              <span className="font-medium text-muted-foreground">
                {att.filename}
              </span>
            )}
            <p className="text-[11px] text-muted-foreground">
              {att.mime_type} · {formatBytes(att.size_bytes)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(att)}
            disabled={pending}
            aria-label={`Remove ${att.filename}`}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
