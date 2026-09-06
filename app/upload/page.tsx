import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadForm } from "@/views/UploadForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Upload — Video Speed Reader",
  description: "Submit a video URL and get a transcript back.",
};

// Job rows change as the worker advances them, so never serve a cached page.
export const dynamic = "force-dynamic";

type JobRow = {
  id: string;
  created_at: string;
  video_source_url: string;
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  downloading: "bg-muted text-muted-foreground",
  transcribe: "bg-teal/20 text-foreground",
  done: "bg-primary/15 text-primary",
};

function relativeTime(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function truncate(value: string, max = 50): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // RLS already scopes this to the caller; the explicit filter documents intent.
  const { data } = await supabase
    .from("jobs")
    .select("id, created_at, video_source_url, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const jobs = (data ?? []) as JobRow[];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
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
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/app">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="hero-glow flex-1">
        <div className="mx-auto max-w-5xl space-y-8 px-5 py-14">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Your transcripts</h1>
            <p className="mt-2 text-muted-foreground">
              Submit a video URL and the worker will transcribe it in the background.
            </p>
          </div>

          <section className="blob-card border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            {jobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transcriptions yet. Submit your first video below.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                      <th className="pb-3 font-medium">Created</th>
                      <th className="pb-3 font-medium">URL</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 whitespace-nowrap text-muted-foreground">
                          {relativeTime(job.created_at)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs break-all">
                            {truncate(job.video_source_url)}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              STATUS_STYLES[job.status] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {job.status === "done" ? (
                            <a
                              href={`/api/jobs/${job.id}/transcript`}
                              download={`transcript-${job.id.slice(0, 8)}.txt`}
                              className="inline-flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Download className="size-3.5" />
                              .txt
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="blob-card max-w-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-display mb-4 text-xl font-semibold tracking-tight">
              New transcription
            </h2>
            <UploadForm />
          </section>
        </div>
      </main>
    </div>
  );
}
