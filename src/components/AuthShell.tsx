import { Link } from "react-router-dom";
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
    <div className="hero-glow flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto w-full max-w-6xl px-5 py-4">
        <Link to="/" className="text-base font-semibold tracking-tight">
          Video Speed Reader
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-7">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  );
}
