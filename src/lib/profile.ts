import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_color: string;
};

/**
 * Look up the current user's profile row. Returns null when there is no
 * authenticated user or the profile row hasn't been provisioned yet.
 */
export async function getCurrentProfile(): Promise<{
  email: string;
  profile: Profile | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_color")
    .eq("id", user.id)
    .maybeSingle();

  return { email: user.email, profile: (profile as Profile | null) ?? null };
}
