"""
M1 worker: polls one job at a time, downloads the video, runs Whisper,
writes TXT back to job_sessions.subtitle_txt_content.

Started by distributor.py (one Popen per pending job). Reads JOB_ID from env.
Reads OPENAI_API_KEY / SUPABASE_URL / SUPABASE_SECRET_KEY from AWS Secrets
Manager -- the EC2's IAM instance profile grants `secretsmanager:GetSecretValue`
on exactly those three secret names, so no credentials ever live on disk.
"""

import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import boto3
from openai import OpenAI
from supabase import create_client


def _get_secret(client, name: str) -> str:
    """Fetch one Secrets Manager secret by name (returns the SecretString)."""
    return client.get_secret_value(SecretId=name)["SecretString"]


def _load_secrets() -> dict[str, str]:
    """Load the three secrets, preferring env vars over AWS Secrets Manager.

    M4 / Fargate: the Lambda distributor injects all three via
    RunTask containerOverrides[].environment, and the worker task role is
    intentionally minimal (no secretsmanager:GetSecretValue), so env comes first.
    M1 / EC2: no env vars are set, so we fall back to Secrets Manager via the
    instance profile. The same image therefore runs unchanged in both.
    """
    keys = ("OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY")
    if all(os.environ.get(k) for k in keys):
        return {k: os.environ[k] for k in keys}
    sm = boto3.client("secretsmanager")
    return {
        "OPENAI_API_KEY": _get_secret(sm, "openai-api-key"),
        "SUPABASE_URL": _get_secret(sm, "supabase-url"),
        "SUPABASE_SECRET_KEY": _get_secret(sm, "supabase-secret-key"),
    }


_secrets = _load_secrets()
db = create_client(_secrets["SUPABASE_URL"], _secrets["SUPABASE_SECRET_KEY"])
openai_client = OpenAI(api_key=_secrets["OPENAI_API_KEY"])

# OpenAI Whisper has a 25 MB file-size limit. 10 minutes of 64 kbps mono mp3 ~= 4.8 MB,
# safely under the limit. Long videos get split into 600-second chunks.
CHUNK_SECONDS = 600


def get_job(job_id: str) -> dict:
    return db.table("jobs").select("*").eq("id", job_id).single().execute().data


def update_job(job_id: str, **fields) -> None:
    db.table("jobs").update({**fields, "updated_at": "now()"}).eq("id", job_id).execute()


def update_session(session_id: str, **fields) -> None:
    db.table("job_sessions").update(fields).eq("id", session_id).execute()


def download_video(url: str, dest_dir: Path) -> Path:
    """yt-dlp for URLs; pass through for local file paths."""
    if url.startswith(("http://", "https://")):
        out_template = str(dest_dir / "video.%(ext)s")
        subprocess.run(["yt-dlp", "-o", out_template, url], check=True)
        return next(dest_dir.glob("video.*"))
    return Path(url).expanduser().resolve()


def to_mp3(video_path: Path, dest_dir: Path) -> Path:
    """Convert any video/audio container to 64 kbps mono 16 kHz mp3 (Whisper-friendly)."""
    mp3 = dest_dir / "audio.mp3"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(video_path),
            "-vn", "-ac", "1",
            "-ar", "16000", "-ab", "64k",
            "-acodec", "libmp3lame",
            str(mp3),
        ],
        check=True,
        capture_output=True,
    )
    return mp3


def get_duration_seconds(audio_path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(out.stdout.strip())


def split_chunks(mp3_path: Path, dest_dir: Path) -> list[Path]:
    """Split into CHUNK_SECONDS-second chunks (re-encode to keep sizes predictable)."""
    duration = get_duration_seconds(mp3_path)
    n_chunks = max(1, math.ceil(duration / CHUNK_SECONDS))
    chunks = []
    for i in range(n_chunks):
        chunk = dest_dir / f"chunk_{i:03d}.mp3"
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(mp3_path),
                "-ss", str(i * CHUNK_SECONDS),
                "-t", str(CHUNK_SECONDS),
                "-acodec", "libmp3lame",
                "-ab", "64k",
                str(chunk),
            ],
            check=True,
            capture_output=True,
        )
        chunks.append(chunk)
    return chunks


def transcribe_chunk(chunk_path: Path, language: str) -> str:
    with open(chunk_path, "rb") as f:
        return openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="text",
            language=language,
        )



def probe_duration_minutes_cheap(video_url: str) -> int | None:
    """ceil(minutes) WITHOUT downloading, or None if the source hides duration.

    yt-dlp prints the literal string "NA" for sources with no manifest (direct
    CloudFront/S3 .mp4 URLs, some Internet Archive items). float("NA") raises,
    so treat NA as "don't know yet" and let the caller ffprobe after download.
    """
    if not video_url.startswith(("http://", "https://")):
        return None
    try:
        out = subprocess.run(
            ["yt-dlp", "--print", "duration", "--no-warnings", video_url],
            check=True, capture_output=True, text=True, timeout=30,
        ).stdout.strip()
    except (subprocess.SubprocessError, OSError):
        return None
    if not out or out.upper() == "NA":
        return None
    try:
        # Minimum 1 credit: a 20-second clip still costs one, and ceil() stops
        # anyone farming just-under-60s submissions for free.
        return max(1, math.ceil(float(out) / 60))
    except ValueError:
        return None


def get_balance(user_id: str) -> float:
    row = (
        db.table("profiles").select("credits_balance")
        .eq("id", user_id).single().execute().data
    )
    return float(row["credits_balance"]) if row else 0.0


def mark_insufficient(job: dict, minutes: int, balance: float) -> None:
    """Refuse the job without calling Whisper -- costs the platform nothing."""
    update_job(job["id"], status="insufficient_credits")
    db.table("credit_transactions").insert({
        "user_id": job["user_id"],
        "amount": 0,
        "type": "deduction",
        "description": f"Insufficient credits: video is {minutes} min, you have {int(balance)}",
        "job_id": job["id"],
    }).execute()
    print(f"[{job['id']}] insufficient credits -- {minutes} min vs {int(balance)} cr", flush=True)


def deduct_credits(job: dict, minutes: int) -> None:
    """Ledger row first (source of truth), then the derived balance."""
    db.table("credit_transactions").insert({
        "user_id": job["user_id"],
        "amount": -minutes,
        "type": "deduction",
        "description": f"Transcribed {minutes} min video",
        "job_id": job["id"],
    }).execute()
    row = (
        db.table("profiles").select("credits_balance")
        .eq("id", job["user_id"]).single().execute().data
    )
    new_balance = max(0.0, float(row["credits_balance"]) - minutes)
    db.table("profiles").update({"credits_balance": new_balance}).eq("id", job["user_id"]).execute()


def run_job(job_id: str) -> None:
    job = get_job(job_id)
    session_id = job["current_session_id"]

    # Claim the job before any external work. Everything below can fail; once
    # status leaves 'pending' the distributor will not spawn a second worker.
    update_job(job_id, status="downloading")
    print(f"[{job_id}] downloading {job['video_source_url']}", flush=True)

    balance = get_balance(job["user_id"])
    minutes = probe_duration_minutes_cheap(job["video_source_url"])

    # Cheap gate: the manifest gave us the duration, so refuse before spending
    # a byte of bandwidth or a cent of Whisper.
    if minutes is not None and minutes > balance:
        mark_insufficient(job, minutes, balance)
        return

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        video = download_video(job["video_source_url"], tmp_path)
        mp3 = to_mp3(video, tmp_path)

        # Fallback gate: no manifest, so we paid for the download -- but the
        # file is local now and ffprobe always knows. Still no Whisper call,
        # which is where the real money is.
        if minutes is None:
            minutes = max(1, math.ceil(get_duration_seconds(mp3) / 60))
            if minutes > balance:
                mark_insufficient(job, minutes, balance)
                return

        update_job(job_id, status="transcribe")
        chunks = split_chunks(mp3, tmp_path)
        print(f"[{job_id}] transcribing {len(chunks)} chunk(s)", flush=True)

        full_text = "\n\n".join(
            transcribe_chunk(c, job["language"]) for c in chunks
        )

        update_session(session_id, subtitle_txt_content=full_text)
        deduct_credits(job, minutes)
        update_job(job_id, status="done")

    print(f"[{job_id}] done -- {len(full_text)} chars, -{minutes} cr", flush=True)


def main() -> None:
    job_id = os.environ["JOB_ID"]
    try:
        run_job(job_id)
    except Exception as exc:
        # Without this the job freezes at 'downloading' forever: the distributor
        # only polls for 'pending', so a crashed job is never retried and never
        # reported. A dead yt-dlp (YouTube bot-check, 404, private video) used to
        # land exactly here.
        print(f"[{job_id}] FAILED -- {exc}", file=sys.stderr, flush=True)
        try:
            update_job(job_id, status="error")
        except Exception as inner:
            print(f"[{job_id}] could not mark error: {inner}", file=sys.stderr, flush=True)
        raise


if __name__ == "__main__":
    main()
