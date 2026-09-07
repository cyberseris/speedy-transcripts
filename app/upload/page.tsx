import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { JobsTable, type JobRow } from "@/views/JobsTable";
import { UploadForm } from "@/views/UploadForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Transcriptions — Video Speed Reader",
  description: "Submit a video URL and get a transcript back.",
};

// Job rows change as the worker advances them, so never serve a cached page.
export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // RLS already scopes this to the caller; the explicit filter documents intent.
  // job_sessions is joined only to learn whether a cached summary exists -- the
  // text itself stays out of the list payload.
  const { data } = await supabase
    .from("jobs")
    .select("id, created_at, video_source_url, status, job_sessions(summary_text)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  type RawJob = {
    id: string;
    created_at: string;
    video_source_url: string;
    status: string;
    job_sessions?: { summary_text: string | null }[] | null;
  };

  const jobs: JobRow[] = ((data ?? []) as RawJob[]).map((row: RawJob) => ({
    id: row.id,
    created_at: row.created_at,
    video_source_url: row.video_source_url,
    status: row.status,
    has_summary: Boolean(row.job_sessions?.some((s) => s.summary_text)),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader current="/upload" />

      <main className="hero-glow flex-1">
        <div className="mx-auto max-w-5xl space-y-8 px-5 py-14">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Transcriptions</h1>
            <p className="mt-2 text-muted-foreground">Signed in as {user.email}</p>
          </div>

          <section className="blob-card border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-display mb-4 text-lg font-semibold tracking-tight">Recent jobs</h2>
            <JobsTable jobs={jobs} />
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
