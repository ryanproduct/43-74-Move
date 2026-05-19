"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { sendTestSummary, updateEmailDaily, updateProfile } from "./actions";
import {
  AVATAR_COLORS,
  type AvatarColor,
  type EmailDailyState,
  type SettingsState,
  type TestEmailState,
} from "./constants";

const initialProfileState: SettingsState = { status: "idle" };
const initialEmailState: EmailDailyState = { status: "idle" };
const initialTestState: TestEmailState = { status: "idle" };

type Props = {
  initialDisplayName: string;
  initialAvatarColor: AvatarColor;
  initialEmailDaily: boolean;
};

export function SettingsForm({
  initialDisplayName,
  initialAvatarColor,
  initialEmailDaily,
}: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, initialProfileState);
  const [selectedColor, setSelectedColor] = useState<AvatarColor>(initialAvatarColor);

  const [emailState, emailFormAction, emailPending] = useActionState(
    updateEmailDaily,
    initialEmailDaily ? { ...initialEmailState, email_daily: true } : { ...initialEmailState, email_daily: false }
  );
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);

  // Show the latest user-driven toggle while the server is still responding.
  // Once a response arrives, defer to the server-confirmed value (which lets
  // the action roll back on failure without an extra effect).
  const emailDaily =
    pendingToggle !== null && emailPending
      ? pendingToggle
      : (emailState.email_daily ?? initialEmailDaily);

  const [testState, testFormAction, testPending] = useActionState(
    sendTestSummary,
    initialTestState
  );

  return (
    <div className="space-y-12">
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

      <section className="space-y-4 border-t border-border pt-8">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Daily email</h2>
          <p className="text-sm text-muted-foreground">
            A plain-text summary at 7am UK time covering today&apos;s tasks, anything blocked,
            and what changed since yesterday.
          </p>
        </div>

        <form action={emailFormAction} className="space-y-3">
          <input type="hidden" name="email_daily" value={emailDaily ? "true" : "false"} />
          <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-card p-4">
            <div className="space-y-1">
              <Label htmlFor="email_daily_toggle" className="text-sm font-medium">
                Send me the daily 7am summary email
              </Label>
              <p className="text-xs text-muted-foreground">
                Turn this off if you&apos;d rather not get the email. Your changes still appear
                in the app.
              </p>
            </div>
            <Switch
              id="email_daily_toggle"
              checked={emailDaily}
              onCheckedChange={(next) => setPendingToggle(next)}
              disabled={emailPending}
              aria-label="Daily email"
            />
          </div>

          {emailState.status === "error" && emailState.message ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {emailState.message}
            </p>
          ) : null}
          {emailState.status === "saved" && emailState.message ? (
            <p
              role="status"
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
            >
              {emailState.message}
            </p>
          ) : null}

          <Button type="submit" variant="outline" disabled={emailPending}>
            {emailPending ? "Saving..." : "Save preference"}
          </Button>
        </form>

        <form action={testFormAction} className="space-y-3 pt-2">
          <Button type="submit" variant="outline" disabled={testPending}>
            {testPending ? "Sending..." : "Send me a test email now"}
          </Button>
          {testState.status === "error" && testState.message ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {testState.message}
            </p>
          ) : null}
          {testState.status === "sent" ? (
            <p
              role="status"
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
            >
              {testState.message ?? "Sent — check your inbox."}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
