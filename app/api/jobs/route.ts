import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // 1. Authenticate the caller via the cookie session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    video_source_url?: string;
    topic?: string | null;
    language?: string;
  };

  if (!body.video_source_url) {
    return NextResponse.json({ error: "video_source_url required" }, { status: 400 });
  }

  // Fast floor check: block the obvious "no credits at all" case at submit so
  // the user gets instant feedback. The precise video-duration-vs-balance
  // comparison happens on the worker, which is the only place the duration is
  // actually known.
  const { data: creditProfile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!creditProfile || Number(creditProfile.credits_balance) < 1) {
    return NextResponse.json(
      { error: "insufficient credits — please buy more at /credits" },
      { status: 402 },
    );
  }

  // 2. Insert with the Supabase Secret key. The caller is already authenticated
  //    above; the secret key bypasses RLS so the job + session rows go in
  //    without policy ping-pong. user_id is taken from the verified session --
  //    never from the request body.
  const admin = createAdminClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SECRET_KEY"]!,
  );

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .insert({
      user_id: user.id,
      video_source_url: body.video_source_url,
      topic: body.topic ?? null,
      language: body.language ?? "zh",
      status: "pending",
    })
    .select()
    .single();

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  const { data: session, error: sessErr } = await admin
    .from("job_sessions")
    .insert({ job_id: job.id, session_number: 1 })
    .select()
    .single();

  if (sessErr) {
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  await admin.from("jobs").update({ current_session_id: session.id }).eq("id", job.id);

  return NextResponse.json({ job_id: job.id });
}
