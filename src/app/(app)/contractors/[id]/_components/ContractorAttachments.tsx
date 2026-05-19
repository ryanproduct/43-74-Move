"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { deleteAttachment } from "@/app/(app)/contractors/[id]/actions";

export type ContractorAttachmentWithUrl = {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  signed_url: string | null;
};

type Props = {
  contractorId: string;
  attachments: ContractorAttachmentWithUrl[];
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
  return mime.startsWith("image/");
}

function isPdf(mime: string): boolean {
  return mime === "application/pdf" || mime.endsWith("/pdf");
}

/**
 * Contractor attachments — a two-column grid of tiles. PDFs render as a
 * paper-stack card (per the design); photos render with the thumbnail
 * itself. Falls back to a generic file tile otherwise.
 */
export function ContractorAttachments({ contractorId, attachments }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove(att: ContractorAttachmentWithUrl) {
    if (
      !confirm(`Remove "${att.filename}"? This deletes the file from storage.`)
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAttachment(
        att.id,
        contractorId,
        att.storage_path
      );
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
        description="Drop a PDF, photo, or document into the uploader above."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {attachments.map((att) => (
        <li key={att.id} className="group relative">
          <a
            href={att.signed_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex h-full flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-foreground/20 hover:bg-accent/30",
              !att.signed_url && "pointer-events-none opacity-60"
            )}
          >
            <Thumb attachment={att} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{att.filename}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatBytes(att.size_bytes)} ·{" "}
                {att.mime_type.split("/")[1] ?? att.mime_type}
              </p>
            </div>
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(att)}
            disabled={pending}
            aria-label={`Remove ${att.filename}`}
            className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function Thumb({ attachment }: { attachment: ContractorAttachmentWithUrl }) {
  if (isImage(attachment.mime_type) && attachment.signed_url) {
    return (
      // Using a plain <img> here keeps this client component portable; the
      // signed URL is short-lived so next/image's optimisation pipeline
      // would be wasted on these one-off views.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={attachment.signed_url}
        alt={attachment.filename}
        className="h-32 w-full rounded-md border bg-muted/30 object-cover"
        loading="lazy"
      />
    );
  }
  if (isPdf(attachment.mime_type)) {
    return (
      <div className="relative flex h-32 w-full items-center justify-center rounded-md border bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-900 dark:to-stone-950">
        <FileText className="h-10 w-10 text-amber-700 dark:text-amber-400" />
        <span className="absolute right-2 top-2 rounded-full border border-orange-500/40 bg-orange-100/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          PDF
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-32 w-full items-center justify-center rounded-md border bg-muted/30">
      <ImageIcon className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}
