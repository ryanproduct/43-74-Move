"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import type { ProfileLite } from "@/lib/tasks/types";
import { createClient } from "@/lib/supabase/client";

type Option = { id: string; name: string };

type ButtonProps = {
  /** Override the trigger label; collapses to a `<span>` always visible. */
  label?: string;
  /** Force the label to always show (e.g. inside empty-state CTAs). */
  alwaysShowLabel?: boolean;
};

/**
 * Persistent "+ New task" trigger in the top bar. Opens the real TaskForm
 * inside a Dialog. Form references (profiles / projects / utilities) are
 * lazy-loaded on first open via the browser supabase client so we don't pay
 * for them on every page render.
 *
 * Reused inside empty states with a richer label, e.g.
 *   `<NewTaskButton label="Add the first task" alwaysShowLabel />`
 */
export function NewTaskButton({
  label = "New task",
  alwaysShowLabel = false,
}: ButtonProps = {}) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [utilities, setUtilities] = useState<Option[]>([]);
  const [contractors, setContractors] = useState<Option[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const [profilesRes, projectsRes, utilitiesRes, contractorsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_color")
          .order("display_name"),
        supabase.from("projects").select("id, name").order("name"),
        supabase.from("utilities").select("id, name").order("name"),
        supabase.from("contractors").select("id, name").order("name"),
      ]);
      if (cancelled) return;
      setProfiles((profilesRes.data ?? []) as ProfileLite[]);
      setProjects((projectsRes.data ?? []) as Option[]);
      setUtilities((utilitiesRes.data ?? []) as Option[]);
      setContractors((contractorsRes.data ?? []) as Option[]);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5"
        aria-label={label === "New task" ? "Create a new task" : label}
      >
        <Plus className="h-4 w-4" />
        <span className={alwaysShowLabel ? "" : "hidden sm:inline"}>
          {label}
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Capture anything from a one-line reminder to a full page of notes.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            mode="create"
            profiles={profiles}
            projects={projects}
            utilities={utilities}
            contractors={contractors}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
