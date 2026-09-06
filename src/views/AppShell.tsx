"use client";

import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppShell({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <span className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Mic className="size-4.5" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              Video Speed Reader
            </span>
          </span>
          <Button size="sm" variant="outline" className="rounded-full" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="hero-glow flex-1">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="blob-card max-w-xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Hi {email}</h1>
            <p className="mt-4 text-muted-foreground">
              Your dashboard is coming soon. Upload functionality will be added in the next
              milestone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
