import Link from "next/link";
import { Mic } from "lucide-react";

import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/upload", label: "Transcriptions" },
  { href: "/credits", label: "Credits" },
];

// Shared app chrome. M0/M1 left an inline <header> in each page; this is the one
// place the nav and the credit balance live now.
export async function AppHeader({ current }: { current?: string }) {
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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/app" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Mic className="size-4.5" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Video Speed Reader
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-4 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current === item.href ? "page" : undefined}
                className={
                  current === item.href
                    ? "font-medium text-foreground"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {balance !== null ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-mono font-semibold text-foreground">{balance}</span>
              <Link href="/credits" className="font-medium text-primary hover:underline">
                Buy more
              </Link>
            </span>
          ) : null}

          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
