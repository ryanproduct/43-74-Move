"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, type LoginState } from "@/app/(auth)/actions";

const initialState: LoginState = { status: "idle" };

type Props = {
  initialError?: string | null;
};

export function LoginForm({ initialError }: Props) {
  const [state, formAction, pending] = useActionState(requestMagicLink, initialState);

  // Prefer a server-action error; fall back to a URL-supplied one (callback failure)
  const errorMessage =
    state.status === "error"
      ? state.message
      : initialError === "expired"
        ? "That magic link has expired or already been used. Request a fresh one below."
        : initialError
          ? "Something went wrong with that sign-in attempt. Try again."
          : null;

  if (state.status === "sent") {
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-lg font-semibold tracking-tight">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a magic link to <span className="font-medium text-foreground">{state.email}</span>.
          Open it on this device to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          defaultValue={state.email ?? ""}
          disabled={pending}
        />
      </div>
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending..." : "Send magic link"}
      </Button>
    </form>
  );
}
