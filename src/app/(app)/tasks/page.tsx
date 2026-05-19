import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { TasksRealtime } from "@/components/TasksRealtime";
import {
  listProfiles,
  listTasks,
  type TaskFilters as TaskFiltersInput,
} from "@/lib/tasks/queries";
import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  PROPERTIES,
  type Property,
  type TaskCategory,
  type TaskStatus,
} from "@/lib/tasks/types";

import { KanbanBoard } from "./_components/KanbanBoard";
import { TaskFilters } from "./_components/TaskFilters";
import { ViewToggle } from "./_components/ViewToggle";

type Search = Promise<{
  property?: string;
  owner?: string;
  category?: string;
  status?: string;
  view?: string;
}>;

function coerceProperty(v?: string): Property | undefined {
  return v && (PROPERTIES as readonly string[]).includes(v)
    ? (v as Property)
    : undefined;
}
function coerceCategory(v?: string): TaskCategory | undefined {
  return v && (TASK_CATEGORIES as readonly string[]).includes(v)
    ? (v as TaskCategory)
    : undefined;
}
function coerceStatus(v?: string): TaskStatus | undefined {
  return v && (TASK_STATUSES as readonly string[]).includes(v)
    ? (v as TaskStatus)
    : undefined;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const view = sp.view === "kanban" ? "kanban" : "list";

  const filters: TaskFiltersInput = {
    property: coerceProperty(sp.property),
    owner: sp.owner || undefined,
    category: coerceCategory(sp.category),
    status: coerceStatus(sp.status),
  };

  const [tasks, profiles] = await Promise.all([listTasks(filters), listProfiles()]);

  const cards: TaskCardData[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    property: t.property,
    due_date: t.due_date,
    priority: t.priority,
    owner: t.owner,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <TasksRealtime subscriptions={[{ table: "tasks" }]} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Everything that needs doing for the move.
          </p>
        </div>
        <ViewToggle />
      </header>

      <TaskFilters profiles={profiles} />

      {cards.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No tasks match these filters"
          description="Try clearing filters, or add a new task from the top bar."
        />
      ) : view === "kanban" ? (
        <KanbanBoard tasks={cards} />
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
