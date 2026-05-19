import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";

import { ActivityFeed } from "@/components/ActivityFeed";
import { EmptyState } from "@/components/EmptyState";
import { PropertyPill } from "@/components/PropertyPill";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import {
  listActivity,
  listAttachments,
  listComments,
  signedAttachmentUrl,
} from "@/lib/tasks/queries";
import {
  getProject,
  listContractorOptionsForProject,
  listContractorsForProject,
  listProfilesByIds,
  listTasksForProject,
} from "@/lib/projects/queries";

import { DecisionsLog } from "../_components/DecisionsLog";
import { EditProjectButton } from "../_components/EditProjectButton";
import { EditableProjectDescription } from "../_components/EditableProjectDescription";
import { ProjectCommentThread } from "../_components/ProjectCommentThread";
import { ProjectFileAttachmentList, type ProjectAttachmentWithUrl } from "../_components/ProjectFileAttachmentList";
import { ProjectFileUploader } from "../_components/ProjectFileUploader";
import { ProjectsRealtime } from "../_components/ProjectsRealtime";
import { ProjectStatusPill } from "../_components/ProjectStatusPill";
import { RecordDecisionForm } from "../_components/RecordDecisionForm";
import { VerdictPill } from "../_components/VerdictPill";

type Params = Promise<{ id: string }>;

function formatGbp(pence: number | null | undefined): string | null {
  if (pence === null || pence === undefined) return null;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(pence / 100);
  } catch {
    return `£${(pence / 100).toFixed(2)}`;
  }
}

function safeFormatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const project = await getProject(id);
  if (!project) notFound();

  const [
    tasks,
    contractors,
    contractorOptions,
    comments,
    attachments,
    activity,
  ] = await Promise.all([
    listTasksForProject(id),
    listContractorsForProject(id),
    listContractorOptionsForProject(id),
    listComments("project", id),
    listAttachments("project", id),
    listActivity("project", id, 50),
  ]);

  // Resolve display names for everyone who has appeared in the decisions log.
  const decisionAuthorIds = project.decisions.map((d) => d.decided_by);
  const profilesById = await listProfilesByIds(decisionAuthorIds);

  // Signed URLs for the attachments list.
  const attachmentsWithUrls: ProjectAttachmentWithUrl[] = await Promise.all(
    attachments.map(async (a) => ({
      id: a.id,
      filename: a.filename,
      storage_path: a.storage_path,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
      signed_url: await signedAttachmentUrl(a.storage_path, 3600),
    }))
  );

  const taskCards: TaskCardData[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    property: t.property,
    due_date: t.due_date,
    priority: t.priority,
    owner: t.owner,
  }));

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;

  const budget = formatGbp(project.budget_pence);
  const start = safeFormatDate(project.start_date);
  const end = safeFormatDate(project.end_date);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
      <ProjectsRealtime
        subscriptions={[
          { table: "projects", filter: `id=eq.${id}` },
          { table: "tasks", filter: `project_id=eq.${id}` },
          { table: "contractors", filter: `project_id=eq.${id}` },
          { table: "comments", filter: `parent_id=eq.${id}` },
          { table: "attachments", filter: `parent_id=eq.${id}` },
          { table: "activity", filter: `parent_id=eq.${id}` },
        ]}
      />

      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to projects
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <EditProjectButton
            defaults={{
              id: project.id,
              name: project.name,
              property: project.property,
              status: project.status,
              budget_pence: project.budget_pence,
              start_date: project.start_date,
              end_date: project.end_date,
              description: project.description,
              chosen_contractor_id: project.chosen_contractor_id,
            }}
            contractors={contractorOptions}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <PropertyPill value={project.property} />
          <ProjectStatusPill value={project.status} />
          {budget && (
            <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-medium">
              {budget}
            </span>
          )}
          {start && (
            <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-medium">
              Start: {start}
            </span>
          )}
          {end && (
            <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-medium">
              End: {end}
            </span>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Description</h2>
        <EditableProjectDescription
          projectId={project.id}
          initialDescription={project.description}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Decisions</h2>
        <DecisionsLog
          decisions={project.decisions}
          profilesById={profilesById}
        />
        <RecordDecisionForm projectId={project.id} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Tasks{" "}
            <span className="font-normal text-muted-foreground">
              ({doneCount} done / {totalCount} total)
            </span>
          </h2>
        </div>
        {taskCards.length === 0 ? (
          <EmptyState
            title="No tasks linked yet"
            description="Tasks with their Project field set to this project will appear here."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {taskCards.map((t) => (
              <li key={t.id}>
                <TaskCard task={t} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Contractors considered</h2>
        {contractors.length === 0 ? (
          <EmptyState
            title="No contractors linked yet"
            description="From the Contractors page, set a contractor's Project field to this project to see them here."
          />
        ) : (
          <ul className="flex flex-col divide-y rounded-md border">
            {contractors.map((c) => {
              const isChosen = project.chosen_contractor_id === c.id;
              return (
                <li
                  key={c.id}
                  className={
                    "flex items-center gap-3 px-3 py-2 text-sm " +
                    (isChosen ? "bg-emerald-50/60" : "")
                  }
                >
                  <div className="flex-1 truncate">
                    <Link
                      href={`/contractors/${c.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {c.trade}
                    </p>
                  </div>
                  <VerdictPill value={c.verdict} />
                  {isChosen && (
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                      Chosen
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Attachments</h2>
        <ProjectFileUploader projectId={project.id} />
        <ProjectFileAttachmentList
          projectId={project.id}
          attachments={attachmentsWithUrls}
        />
      </section>

      <ProjectCommentThread projectId={project.id} comments={comments} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Activity</h2>
        <ActivityFeed rows={activity} />
      </section>
    </div>
  );
}
