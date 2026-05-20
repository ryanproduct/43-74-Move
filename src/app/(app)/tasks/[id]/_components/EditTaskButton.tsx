"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm, type TaskFormDefaults } from "@/components/TaskForm";
import { createClient } from "@/lib/supabase/client";
import type { ProfileLite } from "@/lib/tasks/types";

type Option = { id: string; name: string };

type Props = {
  defaults: TaskFormDefaults & { id: string };
};

/**
 * "Edit" trigger in the task detail header. Lazy-loads the
 * profiles/projects/utilities options the first time the dialog opens so the
 * detail page itself doesn't pay for them on initial render.
 */
export function EditTaskButton({ defaults }: Props) {
  const [open, setOpen] = React.useState(false);
  const [profiles, setProfiles] = React.useState<ProfileLite[]>([]);
  const [projects, setProjects] = React.useState<Option[]>([]);
  const [utilities, setUtilities] = React.useState<Option[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!open || loaded) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const [profilesRes, projectsRes, utilitiesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_color")
          .order("display_name"),
        supabase.from("projects").select("id, name").order("name"),
        supabase.from("utilities").select("id, name").order("name"),
      ]);
      if (cancelled) return;
      setProfiles((profilesRes.data ?? []) as ProfileLite[]);
      setProjects((projectsRes.data ?? []) as Option[]);
      setUtilities((utilitiesRes.data ?? []) as Option[]);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <TaskForm
          mode="edit"
          defaults={defaults}
          profiles={profiles}
          projects={projects}
          utilities={utilities}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
