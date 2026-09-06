import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Auth -- same cookie-session pattern as POST /api/jobs.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Look up the job AND re-impose ownership in the same query.
  //    The secret key bypasses RLS, so without the explicit user_id filter any
  //    signed-in user could download anyone's transcript by guessing a uuid.
  const admin = createAdminClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SECRET_KEY"]!,
  );

  const { data: job } = await admin
    .from("jobs")
    .select("id, user_id, status, current_session_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (job.status !== "done" || !job.current_session_id) {
    return NextResponse.json({ error: "not ready" }, { status: 409 });
  }

  // 3. Pull the transcript text from the job's current session.
  const { data: session } = await admin
    .from("job_sessions")
    .select("subtitle_txt_content")
    .eq("id", job.current_session_id)
    .single();

  const txt = session?.subtitle_txt_content;
  if (!txt) {
    return NextResponse.json({ error: "transcript missing" }, { status: 500 });
  }

  // 4. Stream it back as a file download.
  return new NextResponse(txt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="transcript-${id.slice(0, 8)}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
