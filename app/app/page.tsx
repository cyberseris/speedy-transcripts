import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/views/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — Video Speed Reader",
  description: "Your Video Speed Reader dashboard.",
};

// Auth is now enforced server-side (M0 did it client-side in RequireAuth).
// The session comes from the cookie that middleware.ts keeps fresh.
export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      email={user.email ?? ""}
      credits={profile ? Number(profile.credits_balance) : null}
    />
  );
}
