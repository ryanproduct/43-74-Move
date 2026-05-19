import { FolderKanban } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { listProjects } from "@/lib/projects/queries";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
  type ProjectStatus,
  type ProjectWithRelations,
} from "@/lib/projects/types";

import { NewProjectButton } from "./_components/NewProjectButton";
import { ProjectCard } from "./_components/ProjectCard";
import { ProjectsRealtime } from "./_components/ProjectsRealtime";

/** Bucket projects into the canonical status order. Empty buckets are dropped. */
function groupByStatus(
  projects: ProjectWithRelations[]
): Array<{ status: ProjectStatus; projects: ProjectWithRelations[] }> {
  const buckets = new Map<ProjectStatus, ProjectWithRelations[]>();
  for (const status of PROJECT_STATUS_ORDER) buckets.set(status, []);
  for (const p of projects) {
    const arr = buckets.get(p.status);
    if (arr) arr.push(p);
  }
  return PROJECT_STATUS_ORDER.map((status) => ({
    status,
    projects: buckets.get(status) ?? [],
  })).filter((g) => g.projects.length > 0);
}

export default async function ProjectsPage() {
  const projects = await listProjects();
  const groups = groupByStatus(projects);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <ProjectsRealtime subscriptions={[{ table: "projects" }, { table: "tasks" }]} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Workstreams at one of the houses — renovation, repair, anything
            that needs its own page.
          </p>
        </div>
        <NewProjectButton />
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="No projects yet"
          description="Add a project to track tasks, decisions, quotes and the chosen contractor in one place."
          action={<NewProjectButton label="Add the first project" />}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.status} className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {PROJECT_STATUS_LABELS[group.status]}{" "}
                <span className="text-muted-foreground/70">
                  ({group.projects.length})
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.projects.map((p) => (
                  <li key={p.id}>
                    <ProjectCard project={p} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
