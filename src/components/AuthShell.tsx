import Link from "next/link";
import { Mic } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="hero-glow relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-24 size-72 rounded-full bg-sun/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-20 size-80 rounded-full bg-teal/25 blur-3xl"
      />

      <header className="relative mx-auto w-full max-w-6xl px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Mic className="size-4.5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Video Speed Reader
          </span>
        </Link>
      </header>
      <main className="relative flex flex-1 items-center justify-center px-5 py-10">
        <div className="blob-card w-full max-w-sm border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  );
}
