import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Phone } from "lucide-react";

import { ActivityFeed } from "@/components/ActivityFeed";
import { DatePill } from "@/components/DatePill";
import {
  listActivity,
  listAttachments,
  listComments,
  signedAttachmentUrl,
} from "@/lib/tasks/queries";
import { getUtility } from "@/lib/utilities/queries";
import {
  UTILITY_ADDISON_ACTION_LABELS,
  UTILITY_HOGARTH_ACTION_LABELS,
  UTILITY_TYPE_LABELS,
} from "@/lib/utilities/types";

import { UtilitiesRealtime } from "../_components/UtilitiesRealtime";
import { UtilityStatusPill } from "../_components/UtilityStatusPill";
import { EditUtilityButton } from "./_components/EditUtilityButton";
import { EditableNotes } from "./_components/EditableNotes";
import {
  UtilityFileAttachmentList,
  type UtilityAttachmentWithUrl,
} from "./_components/UtilityFileAttachmentList";
import { UtilityFileUploader } from "./_components/UtilityFileUploader";
import { UtilityCommentThread } from "./_components/UtilityCommentThread";

type Params = Promise<{ id: string }>;

export default async function UtilityDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const utility = await getUtility(id);
  if (!utility) notFound();

  const [comments, attachments, activity] = await Promise.all([
    listComments("utility", id),
    listAttachments("utility", id),
    listActivity("utility", id, 50),
  ]);

  const attachmentsWithUrls: UtilityAttachmentWithUrl[] = await Promise.all(
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
      <UtilitiesRealtime
        subscriptions={[
          { table: "utilities", filter: `id=eq.${id}` },
          { table: "comments", filter: `parent_id=eq.${id}` },
          { table: "attachments", filter: `parent_id=eq.${id}` },
          { table: "activity", filter: `parent_id=eq.${id}` },
        ]}
      />

      <Link
        href="/utilities"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to utilities
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{utility.name}</h1>
          <EditUtilityButton
            defaults={{
              id: utility.id,
              name: utility.name,
              type: utility.type,
              account_number: utility.account_number,
              hogarth_action: utility.hogarth_action,
              addison_action: utility.addison_action,
              switch_date: utility.switch_date,
              status: utility.status,
              contact_phone: utility.contact_phone,
              contact_url: utility.contact_url,
              notes: utility.notes,
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 font-medium">
            {UTILITY_TYPE_LABELS[utility.type]}
          </span>
          <UtilityStatusPill value={utility.status} />
          {utility.switch_date && <DatePill date={utility.switch_date} />}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 rounded-md border bg-card p-4 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Account number
          </span>
          <span className="font-mono">
            {utility.account_number ?? "—"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Switch date
          </span>
          <span>{utility.switch_date ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Hogarth action
          </span>
          <span>{UTILITY_HOGARTH_ACTION_LABELS[utility.hogarth_action]}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Addison action
          </span>
          <span>{UTILITY_ADDISON_ACTION_LABELS[utility.addison_action]}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Contact phone
          </span>
          {utility.contact_phone ? (
            <a
              href={`tel:${utility.contact_phone}`}
              className="inline-flex items-center gap-1 hover:underline"
            >
              <Phone className="h-3 w-3" />
              {utility.contact_phone}
            </a>
          ) : (
            <span>—</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Contact URL
          </span>
          {utility.contact_url ? (
            <a
              href={utility.contact_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">{utility.contact_url}</span>
            </a>
          ) : (
            <span>—</span>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Notes</h2>
        <EditableNotes utilityId={utility.id} initialNotes={utility.notes} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Attachments</h2>
        <UtilityFileUploader utilityId={utility.id} />
        <UtilityFileAttachmentList
          utilityId={utility.id}
          attachments={attachmentsWithUrls}
        />
      </section>

      <UtilityCommentThread utilityId={utility.id} comments={comments} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Activity</h2>
        <ActivityFeed rows={activity} />
      </section>
    </div>
  );
}
