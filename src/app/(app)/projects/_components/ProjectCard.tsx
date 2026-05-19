import Link from "next/link";

import { Card } from "@/components/ui/card";
import { DatePill } from "@/components/DatePill";
import { PropertyPill } from "@/components/PropertyPill";
import { cn } from "@/lib/utils";
import type { ProjectWithRelations } from "@/lib/projects/types";

import { ProjectStatusPill } from "./ProjectStatusPill";

type Props = {
  project: ProjectWithRelations;
  className?: string;
};

/**
 * Card used in the /projects list. Whole card is a link to the workspace
 * unless the user clicks the chosen-contractor sub-link, which navigates to
 * /contractors/[id] instead.
 */
export function ProjectCard({ project, className }: Props) {
  const done = project.task_count_done;
  const total = project.task_count_total;

  return (
    <Card className={cn("group p-4 transition-colors hover:bg-accent/30", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 text-base font-semibold leading-snug hover:underline"
          >
            {project.name}
          </Link>
          <ProjectStatusPill value={project.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <PropertyPill value={project.property} />
          {project.end_date && <DatePill date={project.end_date} />}
          <span className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 font-medium">
            {done} / {total} tasks
          </span>
        </div>

        {project.chosen_contractor && (
          <p className="text-xs text-muted-foreground">
            Chosen contractor:{" "}
            <Link
              href={`/contractors/${project.chosen_contractor.id}`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {project.chosen_contractor.name}
            </Link>
          </p>
        )}
      </div>
    </Card>
  );
}
