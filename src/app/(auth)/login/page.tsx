import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Move 43-74",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Move 43-74</h1>
        <p className="text-sm text-muted-foreground">
          A private hub for the move. Magic-link sign-in only.
        </p>
      </header>
      <LoginForm initialError={error ?? null} />
    </div>
  );
}
