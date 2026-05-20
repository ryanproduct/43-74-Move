import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Globe, Mail, Phone, Star } from "lucide-react";

import { ActivityFeed } from "@/components/ActivityFeed";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listActivity,
  listAttachments,
  listComments,
} from "@/lib/tasks/queries";
import {
  getContractor,
  listProjects,
  signedAttachmentUrl,
} from "@/lib/contractors/queries";

import { ContractorsRealtime } from "../_components/ContractorsRealtime";
import { QuoteSummary } from "../_components/QuoteSummary";
import { ContractorAttachments } from "./_components/ContractorAttachments";
import { ContractorComments } from "./_components/ContractorComments";
import { ContractorFileUploader } from "./_components/ContractorFileUploader";
import { EditContractorButton } from "./_components/EditContractorButton";
import { EditableNotes } from "./_components/EditableNotes";
import { VerdictPicker } from "./_components/VerdictPicker";
import type { ContractorAttachmentWithUrl } from "./_components/ContractorAttachments";

type Params = Promise<{ id: string }>;

/**
 * Contractor detail page. Closely follows
 * `design-references/contractor-detail.html` for layout, typography, and
 * spacing. The two-column main grid mirrors the reference: quote +
 * verdict-reasoning + notes on the left, contact + attachments + references
 * + comments on the right. Activity collapses into an expandable section at
 * the bottom.
 */
export default async function ContractorDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const contractor = await getContractor(id);
  if (!contractor) notFound();

  const [projects, comments, rawAttachments, activity] = await Promise.all([
    listProjects(),
    listComments("contractor", id),
    listAttachments("contractor", id),
    listActivity("contractor", id, 50),
  ]);

  const attachments: ContractorAttachmentWithUrl[] = await Promise.all(
    rawAttachments.map(async (a) => ({
      id: a.id,
      filename: a.filename,
      storage_path: a.storage_path,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
      signed_url: await signedAttachmentUrl(a.storage_path, 3600),
    }))
  );

  return (
    <div>
      <ContractorsRealtime
        subscriptions={[
          { table: "contractors", filter: `id=eq.${id}` },
          { table: "comments", filter: `parent_id=eq.${id}` },
          { table: "attachments", filter: `parent_id=eq.${id}` },
          { table: "activity", filter: `parent_id=eq.${id}` },
        ]}
      />

      {/* Verdict accent strip — peripheral signal of current state */}
      <div
        aria-hidden
        className={`h-1 w-full ${verdictStripClass(contractor.verdict)}`}
      />

      {/* Header zone — soft wash, contractor name, verdict pill */}
      <section
        className={`border-b ${verdictWashClass(contractor.verdict)}`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-7 pt-6 md:px-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/contractors"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Contractors
            </Link>
            {contractor.project && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <Link
                  href={`/projects/${contractor.project.id}`}
                  className="hover:text-foreground"
                >
                  {contractor.project.name}
                </Link>
              </>
            )}
            <span className="text-muted-foreground/40">/</span>
            <span>Contractor</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl">
                {contractor.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  {contractor.trade}
                </span>
                {contractor.project && (
                  <>
                    <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
                    <span>considered for</span>
                    <Link
                      href={`/projects/${contractor.project.id}`}
                      className="inline-flex items-center rounded-full border border-orange-200 px-2.5 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-950/30"
                    >
                      {contractor.project.name}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <VerdictPicker
                contractorId={contractor.id}
                value={contractor.verdict}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main grid — left: quote / notes / verdict reasoning ; right: contact / attachments / references / comments */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          {/* LEFT COLUMN */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Quote */}
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Quote
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {contractor.quote_amount_pence === null
                    ? "Not yet received"
                    : "From the contractor"}
                </span>
              </CardHeader>
              <CardContent className="pt-2">
                <QuoteSummary
                  amountPence={contractor.quote_amount_pence}
                  includes={contractor.quote_includes}
                  excludes={contractor.quote_excludes}
                  timeline={contractor.timeline}
                />
              </CardContent>
            </Card>

            {/* Notes (Apple Notes feel) */}
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Notes
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Markdown · click to edit
                </span>
              </CardHeader>
              <CardContent className="pt-3">
                <EditableNotes
                  contractorId={contractor.id}
                  initialNotes={contractor.notes}
                />
              </CardContent>
            </Card>

            {/* Why we picked / didn't pick */}
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Why we picked / didn&apos;t pick
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  short — for future-us
                </span>
              </CardHeader>
              <CardContent className="pt-2">
                {contractor.verdict_notes ? (
                  <p className="text-sm leading-relaxed">
                    {contractor.verdict_notes}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Use Edit to add a sentence on why this verdict — your future
                    self will thank you.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Contact */}
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Contact
                </CardTitle>
                <span className="text-xs text-muted-foreground">primary</span>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {contractor.contact_name && (
                  <p className="text-sm font-semibold">
                    {contractor.contact_name}
                  </p>
                )}
                {contractor.phone && (
                  <ContactRow
                    icon={<Phone className="h-3.5 w-3.5" />}
                    href={`tel:${contractor.phone.replace(/\s+/g, "")}`}
                    label={contractor.phone}
                  />
                )}
                {contractor.email && (
                  <ContactRow
                    icon={<Mail className="h-3.5 w-3.5" />}
                    href={`mailto:${contractor.email}`}
                    label={contractor.email}
                  />
                )}
                {contractor.website && (
                  <ContactRow
                    icon={<Globe className="h-3.5 w-3.5" />}
                    href={
                      contractor.website.startsWith("http")
                        ? contractor.website
                        : `https://${contractor.website}`
                    }
                    label={contractor.website.replace(/^https?:\/\//, "")}
                    external
                  />
                )}
                {!contractor.phone &&
                  !contractor.email &&
                  !contractor.website &&
                  !contractor.contact_name && (
                    <p className="text-sm italic text-muted-foreground">
                      No contact details yet.
                    </p>
                  )}
                <div className="pt-2">
                  <EditContractorButton
                    defaults={{
                      id: contractor.id,
                      name: contractor.name,
                      trade: contractor.trade,
                      project_id: contractor.project_id,
                      contact_name: contractor.contact_name,
                      phone: contractor.phone,
                      email: contractor.email,
                      website: contractor.website,
                      quote_amount_pence: contractor.quote_amount_pence,
                      quote_includes: contractor.quote_includes,
                      quote_excludes: contractor.quote_excludes,
                      timeline: contractor.timeline,
                      references_notes: contractor.references_notes,
                      verdict: contractor.verdict,
                      verdict_notes: contractor.verdict_notes,
                      notes: contractor.notes,
                    }}
                    projects={projects}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Attachments
                </CardTitle>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {attachments.length} files
                </span>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <ContractorAttachments
                  contractorId={contractor.id}
                  attachments={attachments}
                />
                <ContractorFileUploader contractorId={contractor.id} />
              </CardContent>
            </Card>

            {/* References */}
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  References
                </CardTitle>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" /> reviews
                </span>
              </CardHeader>
              <CardContent className="pt-2 text-sm leading-relaxed">
                {contractor.references_notes ? (
                  <p className="whitespace-pre-wrap">
                    {contractor.references_notes}
                  </p>
                ) : (
                  <p className="italic text-muted-foreground">
                    Use Edit to capture who recommended them, reviews, or any
                    past-work references.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Comments
                </CardTitle>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {comments.length}
                </span>
              </CardHeader>
              <CardContent className="pt-2">
                <ContractorComments
                  contractorId={contractor.id}
                  comments={comments}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer utility zone — collapsible Activity + Address aside */}
        <section className="mt-8 flex flex-col gap-3">
          <details className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium">
              <span className="inline-block h-3 w-3 rotate-0 transition-transform group-open:rotate-90">
                ▸
              </span>
              <span className="grow">Activity</span>
              <span className="text-xs text-muted-foreground">
                {activity.length === 0
                  ? "No changes yet"
                  : `${activity.length} change${activity.length === 1 ? "" : "s"}`}
              </span>
            </summary>
            <div className="border-t bg-muted/20 px-4 py-3">
              <ActivityFeed rows={activity} />
            </div>
          </details>
        </section>

        <footer className="mt-10 flex items-center justify-between border-t pt-4 pb-2 text-xs text-muted-foreground">
          <span>Move 43-74 · private</span>
          <span className="tabular-nums">
            last edited {new Date(contractor.updated_at).toLocaleString("en-GB")}
          </span>
        </footer>
      </main>
    </div>
  );
}

/**
 * Tailwind class for the 4px verdict accent strip — drives the page's
 * peripheral colour from the contractor's verdict.
 */
function verdictStripClass(v: string): string {
  switch (v) {
    case "shortlist":
      return "bg-sky-500";
    case "chosen":
      return "bg-orange-600";
    case "rejected":
      return "bg-stone-300";
    default:
      return "bg-stone-400";
  }
}

/**
 * Soft gradient wash behind the header — same hue as the verdict, but very
 * faint, so the verdict colours the whole top of the page.
 */
function verdictWashClass(v: string): string {
  switch (v) {
    case "shortlist":
      return "bg-gradient-to-b from-sky-50/70 to-transparent dark:from-sky-950/30";
    case "chosen":
      return "bg-gradient-to-b from-orange-50/70 to-transparent dark:from-orange-950/30";
    case "rejected":
      return "bg-gradient-to-b from-stone-100/70 to-transparent dark:from-stone-900/30";
    default:
      return "bg-gradient-to-b from-stone-100/70 to-transparent dark:from-stone-900/30";
  }
}

function ContactRow({
  icon,
  href,
  label,
  external,
}: {
  icon: React.ReactNode;
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-2 text-sm hover:text-foreground"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground">
        {icon}
      </span>
      <span className="truncate text-foreground/80">{label}</span>
    </a>
  );
}

