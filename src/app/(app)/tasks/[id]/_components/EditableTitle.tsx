"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { setTaskTitle } from "@/app/(app)/tasks/actions";

type Props = {
  taskId: string;
  initialTitle: string;
};

export function EditableTitle({ taskId, initialTitle }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialTitle);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function startEditing() {
    setValue(initialTitle);
    setEditing(true);
  }

  function commit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Title cannot be empty.");
      return;
    }
    if (trimmed === initialTitle) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setTaskTitle(taskId, trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <h1
        onClick={startEditing}
        className="cursor-text text-2xl font-semibold tracking-tight hover:bg-accent/40 rounded px-1 -mx-1"
        title="Click to edit"
      >
        {initialTitle}
      </h1>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setValue(initialTitle);
            setEditing(false);
          }
        }}
        disabled={pending}
        className={cn("text-2xl font-semibold tracking-tight h-auto py-1")}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
