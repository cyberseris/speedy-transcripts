import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Whisper language codes -> something a chat model reliably understands.
const LANGUAGE_NAMES: Record<string, string> = {
  zh: "Traditional Chinese (繁體中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  "zh-CN": "Simplified Chinese (简体中文)",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
};

// Whisper's 25 MB cap keeps transcripts well under this, but a pathological
// input shouldn't blow up the context window or the bill.
const MAX_TRANSCRIPT_CHARS = 40000;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Same ownership pattern as the transcript route: the service key bypasses
  // RLS, so the user_id filter is what stops uuid-guessing.
  const admin = createServiceClient();

  const { data: job } = await admin
    .from("jobs")
    .select("id, user_id, status, language, current_session_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (job.status !== "done" || !job.current_session_id) {
    return NextResponse.json({ error: "transcript not ready" }, { status: 409 });
  }

  const { data: session } = await admin
    .from("job_sessions")
    .select("id, subtitle_txt_content, summary_text")
    .eq("id", job.current_session_id)
    .single();

  // Cached: return immediately and spend nothing.
  if (session?.summary_text) {
    return NextResponse.json({ summary: session.summary_text, cached: true });
  }

  const transcript = session?.subtitle_txt_content;
  if (!transcript) {
    return NextResponse.json({ error: "transcript missing" }, { status: 409 });
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set on this deployment" },
      { status: 500 },
    );
  }

  const language = LANGUAGE_NAMES[job.language] ?? job.language ?? "English";
  // Overridable so a retired model name can be fixed with an env change.
  const model = process.env["OPENAI_SUMMARY_MODEL"] ?? "gpt-4o-mini";

  let summary: string | undefined;
  try {
    const completion = await new OpenAI({ apiKey }).chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            `You summarise video transcripts. Write the summary in ${language}, ` +
            `regardless of the transcript's own language.\n\n` +
            `Reply in exactly this shape, with no preamble and no markdown headings:\n\n` +
            `TL;DR: <one sentence>\n\nKey takeaways:\n- <point>\n- <point>\n\n` +
            `Give between 3 and 6 bullets. Keep each bullet to one line.`,
        },
        { role: "user", content: transcript.slice(0, MAX_TRANSCRIPT_CHARS) },
      ],
    });
    summary = completion.choices[0]?.message?.content?.trim();
  } catch (err) {
    // Return the real reason rather than a bare 500 -- a generic "failed" here
    // costs an hour of log-reading, as the Stripe Managed Payments rollout showed.
    console.error("summary generation failed", err);
    const message = err instanceof Error ? err.message : "summary generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!summary) {
    return NextResponse.json({ error: "the model returned an empty summary" }, { status: 502 });
  }

  const { error: saveErr } = await admin
    .from("job_sessions")
    .update({ summary_text: summary, summary_generated_at: new Date().toISOString() })
    .eq("id", job.current_session_id);

  // A failed cache write shouldn't lose work the user already paid for in
  // latency -- hand back the summary and let the next click regenerate.
  if (saveErr) console.error("summary cache write failed", saveErr);

  return NextResponse.json({ summary, cached: false });
}
