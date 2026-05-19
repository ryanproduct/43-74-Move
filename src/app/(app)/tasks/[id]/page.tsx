import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ActivityFeed } from "@/components/ActivityFeed";
import { CommentThread } from "@/components/CommentThread";
import { DatePill } from "@/components/DatePill";
import {
  FileAttachmentList,
  type AttachmentWithUrl,
} from "@/components/FileAttachmentList";
import { FileUploader } from "@/components/FileUploader";
import { OwnerAvatar } from "@/components/OwnerAvatar";
import { PropertyPill } from "@/components/PropertyPill";
import { TaskStatusPill } from "@/components/TaskStatusPill";
import { TasksRealtime } from "@/components/TasksRealtime";
import {
  getTask,
  listActivity,
  listAttachments,
  listComments,
  signedAttachmentUrl,
} from "@/lib/tasks/queries";
import { PRIORITY_LABELS } from "@/lib/tasks/types";

import { EditableDescription } from "./_components/EditableDescription";
import { EditableTitle } from "./_components/EditableTitle";

type Params = Promise<{ id: string }>;

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-rose-500",
  med: "bg-amber-500",
  low: "bg-slate-300",
};

export default async function TaskDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const task = await getTask(id);
  if (!task) notFound();

  const [comments, attachments, activity] = await Promise.all([
    listComments("task", id),
    listAttachments("task", id),
    listActivity("task", id, 50),
  ]);

  // Resolve signed URLs in parallel so the attachment list renders ready-to-click.
  const attachmentsWithUrls: AttachmentWithUrl[] = await Promise.all(
    attachments.map(async (a) => ({
      id: a.id,
      filename: a.filename,
      storage_path: a.storage_path,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
      signed_url: await signedAttachmentUrl(a.storage_path, 3600),
    }))
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
      <TasksRealtime
        subscriptions={[
          { table: "tasks", filter: `id=eq.${id}` },
          { table: "comments", filter: `parent_id=eq.${id}` },
          { table: "attachments", filter: `parent_id=eq.${id}` },
          { table: "activity", filter: `parent_id=eq.${id}` },
        ]}
      />

      <Link
        href="/tasks"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to tasks
      </Link>

      <header className="flex flex-col gap-3">
        <EditableTitle taskId={task.id} initialTitle={task.title} />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <PropertyPill value={task.property} />
          <TaskStatusPill value={task.status} />
          {task.due_date && <DatePill date={task.due_date} />}
          <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-medium">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`}
            />
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 font-medium">
            <OwnerAvatar owner={task.owner} size="sm" />
            <span>{task.owner?.display_name ?? "Unassigned"}</span>
          </span>
        </div>
      </header>

      {task.status === "blocked" && task.blocked_reason && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <span className="font-medium">Blocked:</span> {task.blocked_reason}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Description</h2>
        <EditableDescription
          taskId={task.id}
          initialDescription={task.description}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Attachments</h2>
        <FileUploader taskId={task.id} />
        <FileAttachmentList taskId={task.id} attachments={attachmentsWithUrls} />
      </section>

      <CommentThread taskId={task.id} comments={comments} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Activity</h2>
        <ActivityFeed rows={activity} />
      </section>
    </div>
  );
}
