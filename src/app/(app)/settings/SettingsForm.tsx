"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateProfile } from "./actions";
import {
  AVATAR_COLORS,
  type AvatarColor,
  type SettingsState,
} from "./constants";

const initialState: SettingsState = { status: "idle" };

type Props = {
  initialDisplayName: string;
  initialAvatarColor: AvatarColor;
};

export function SettingsForm({ initialDisplayName, initialAvatarColor }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [selectedColor, setSelectedColor] = useState<AvatarColor>(initialAvatarColor);

  return (
    <form action={formAction} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={32}
          defaultValue={initialDisplayName}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">Up to 32 characters.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Avatar colour</legend>
        <input type="hidden" name="avatar_color" value={selectedColor} />
        <div className="flex flex-wrap gap-3">
          {AVATAR_COLORS.map((color) => {
            const isSelected = color === selectedColor;
            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "relative inline-flex h-10 w-10 items-center justify-center rounded-full ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected ? "ring-2 ring-foreground ring-offset-2" : "hover:scale-105"
                )}
                style={{ backgroundColor: `var(--color-${color})` }}
                aria-label={color}
                aria-pressed={isSelected}
              >
                {isSelected ? <Check className="h-4 w-4 text-white" /> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
        >
          {state.message ?? "Saved."}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
