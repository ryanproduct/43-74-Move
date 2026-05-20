"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  PROPERTIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  PROPERTY_LABELS,
  type Property,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
  type ProfileLite,
} from "@/lib/tasks/types";
import { createTask, updateTask } from "@/app/(app)/tasks/actions";

type ProjectOption = { id: string; name: string };
type UtilityOption = { id: string; name: string };
type ContractorOption = { id: string; name: string };

export type TaskFormDefaults = {
  id?: string;
  title?: string;
  description?: string | null;
  property?: Property;
  category?: TaskCategory;
  owner_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  project_id?: string | null;
  utility_id?: string | null;
  contractor_id?: string | null;
};

type Props = {
  mode: "create" | "edit";
  defaults?: TaskFormDefaults;
  profiles: ProfileLite[];
  projects: ProjectOption[];
  utilities: UtilityOption[];
  contractors: ContractorOption[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

const UNASSIGNED = "__unassigned__";
const NONE = "__none__";

/**
 * Create + edit form for a task. Designed to live inside a Dialog (modal) or
 * on its own. The description field is a generous Markdown-friendly textarea
 * (min 200px tall, expandable).
 */
export function TaskForm({
  mode,
  defaults,
  profiles,
  projects,
  utilities,
  contractors,
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [owner, setOwner] = React.useState(defaults?.owner_id ?? UNASSIGNED);
  const [property, setProperty] = React.useState<Property>(
    defaults?.property ?? "both"
  );
  const [category, setCategory] = React.useState<TaskCategory>(
    defaults?.category ?? "other"
  );
  const [status, setStatus] = React.useState<TaskStatus>(
    defaults?.status ?? "todo"
  );
  const [priority, setPriority] = React.useState<TaskPriority>(
    defaults?.priority ?? "med"
  );
  const [projectId, setProjectId] = React.useState(
    defaults?.project_id ?? NONE
  );
  const [utilityId, setUtilityId] = React.useState(
    defaults?.utility_id ?? NONE
  );
  const [contractorId, setContractorId] = React.useState(
    defaults?.contractor_id ?? NONE
  );

  async function handleSubmit(formData: FormData) {
    setError(null);

    // Normalise the controlled selects into the FormData payload.
    formData.set("property", property);
    formData.set("category", category);
    formData.set("status", status);
    formData.set("priority", priority);
    formData.set("owner_id", owner === UNASSIGNED ? "" : owner);
    formData.set("project_id", projectId === NONE ? "" : projectId);
    formData.set("utility_id", utilityId === NONE ? "" : utilityId);
    formData.set("contractor_id", contractorId === NONE ? "" : contractorId);

    startTransition(async () => {
      const result =
        mode === "edit" && defaults?.id
          ? await updateTask(defaults.id, formData)
          : await createTask(formData);

      if (!result.ok) {
        setError(result.error);
        toast.error(
          mode === "edit" ? "Couldn't save changes" : "Couldn't create task",
          { description: result.error }
        );
        return;
      }

      toast.success(mode === "edit" ? "Task updated" : "Task created");
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
          placeholder="What needs doing?"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults?.description ?? ""}
          placeholder="Notes, links, paragraphs… anything that helps."
          className="min-h-[200px] resize-y"
        />
        <p className="text-[11px] text-muted-foreground">
          Markdown supported — links, lists, headings, code.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Property</Label>
          <Select value={property} onValueChange={(v) => setProperty(v as Property)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROPERTY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as TaskCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Owner</Label>
          <Select value={owner} onValueChange={setOwner}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={defaults?.due_date ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Utility</Label>
          <Select value={utilityId} onValueChange={setUtilityId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {utilities.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Contractor</Label>
          <Select value={contractorId} onValueChange={setContractorId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {contractors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
