import Link from "next/link";
import { Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// Shared header. M0/M1 left an inline <header> in each page; this replaces them
// so the credits balance has exactly one place to live. Re-renders on every
// server navigation, which is enough -- /credits also refreshes after checkout.
export async function AppHeader({ dashboardLink = true }: { dashboardLink?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .single();
    balance = profile ? Number(profile.credits_balance) : null;
  }

  return (
    <header className="border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
        <Link href="/app" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Mic className="size-4.5" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Video Speed Reader
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {balance !== null ? (
            <Link
              href="/credits"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40"
            >
              <span className="text-muted-foreground">Credits</span>
              <span className="font-mono font-semibold text-foreground">{balance}</span>
            </Link>
          ) : null}
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/credits">Buy more</Link>
          </Button>
          {dashboardLink ? (
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/app">Dashboard</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
