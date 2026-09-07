-- Cached AI summary of the transcript. Generated on demand by
-- POST /api/jobs/[id]/summary, then served from here at no further cost.
ALTER TABLE public.job_sessions
  ADD COLUMN IF NOT EXISTS summary_text text,
  ADD COLUMN IF NOT EXISTS summary_generated_at timestamptz;
