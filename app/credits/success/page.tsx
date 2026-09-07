import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { RefreshBalanceButton } from "@/views/RefreshBalanceButton";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Purchase complete — Video Speed Reader",
  description: "Your credit purchase went through.",
};

export const dynamic = "force-dynamic";

// This page does NOT grant credits. The webhook is the only thing that writes to
// the ledger. If a user closed the tab between paying and being redirected here,
// they would still be credited -- which is exactly why the split exists.
export default async function CreditsSuccessPage() {
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

  const { data: latest } = await supabase
    .from("credit_transactions")
    .select("amount, created_at")
    .eq("user_id", user.id)
    .eq("type", "purchase")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const balance = profile ? Number(profile.credits_balance) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader current="/credits" />

      <main className="hero-glow flex-1">
        <div className="mx-auto flex max-w-2xl flex-col px-5 py-20">
          <section className="blob-card border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Purchase complete
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Your credits are on their way — Stripe webhooks usually arrive within a few
              seconds.
            </p>

            <div className="mx-auto mt-8 w-full max-w-xs rounded-2xl border border-border px-6 py-7">
              <p className="text-xs tracking-widest text-muted-foreground uppercase">
                Current balance
              </p>
              <p className="font-display mt-2 text-5xl font-semibold">{balance}</p>
              <p className="mt-1 text-sm text-muted-foreground">credits</p>
            </div>

            {latest ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Latest purchase:{" "}
                <span className="font-medium text-foreground">+{latest.amount} credits</span> ·{" "}
                {new Date(latest.created_at).toLocaleString()}
              </p>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                No purchase recorded yet — hit refresh in a moment.
              </p>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <RefreshBalanceButton />
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/upload">Back to transcriptions</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
