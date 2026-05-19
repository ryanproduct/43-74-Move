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

/**
 * Persistent "+ New task" trigger in the top bar. Opens the real TaskForm
 * inside a Dialog. Form references (profiles / projects / utilities) are
 * lazy-loaded on first open via the browser supabase client so we don't pay
 * for them on every page render.
 */
export function NewTaskButton() {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [utilities, setUtilities] = useState<Option[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5"
        aria-label="Create a new task"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">New task</span>
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
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
