"""
M4 Lambda distributor -- replaces M1's always-on distributor.py.

EventBridge fires this every minute. One pass only (M4 scope):
  spawn a Fargate task for each pending job that has not been spawned yet.

Idempotency lives in the DB, not in memory: job_sessions.fargate_task_arn is
written immediately after ecs:RunTask, and jobs whose session already carries
an ARN are skipped on later ticks. (M1 kept this in a process-local set, which
a stateless Lambda cannot do.)

Stuck-job recovery and storage cleanup are deliberately out of scope for M4.
"""

import os

import boto3
from supabase import create_client

_SECRET_IDS = {
    "SUPABASE_URL": "supabase-url",
    "SUPABASE_SECRET_KEY": "supabase-secret-key",
    "OPENAI_API_KEY": "openai-api-key",
}


def _load_secrets() -> dict[str, str]:
    """Env vars win; otherwise pull from Secrets Manager at cold start.

    Keeping the three credentials out of the Lambda's plaintext configuration
    means only the execution role can reach them. They are still forwarded to
    the Fargate task as env (worker.py is env-first), so the worker task role
    stays minimal.
    """
    if all(os.environ.get(k) for k in _SECRET_IDS):
        return {k: os.environ[k] for k in _SECRET_IDS}
    sm = boto3.client("secretsmanager")
    return {
        k: sm.get_secret_value(SecretId=v)["SecretString"]
        for k, v in _SECRET_IDS.items()
    }


_secrets = _load_secrets()
SUPABASE_URL = _secrets["SUPABASE_URL"]
SUPABASE_SECRET_KEY = _secrets["SUPABASE_SECRET_KEY"]
OPENAI_API_KEY = _secrets["OPENAI_API_KEY"]

ECS_CLUSTER = os.environ["ECS_CLUSTER"]
TASK_DEFINITION = os.environ["TASK_DEFINITION"]
SUBNETS = [s.strip() for s in os.environ["SUBNETS"].split(",") if s.strip()]
CONTAINER_NAME = os.environ.get("CONTAINER_NAME", "worker")

db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
ecs = boto3.client("ecs")


def _ensure_session(job_id: str) -> str:
    """Return the job's current session id, creating AND LINKING one if absent.

    The link-back (jobs.current_session_id) is the easy-to-miss half: without it
    the Fargate task launches but worker.py dies on its first update_session().
    """
    job = (
        db.table("jobs").select("current_session_id").eq("id", job_id).single().execute().data
    )
    if job and job.get("current_session_id"):
        return job["current_session_id"]

    row = (
        db.table("job_sessions")
        .insert({"job_id": job_id, "session_number": 1})
        .execute()
        .data[0]
    )
    db.table("jobs").update({"current_session_id": row["id"]}).eq("id", job_id).execute()
    return row["id"]


def _already_spawned(session_id: str) -> bool:
    row = (
        db.table("job_sessions")
        .select("fargate_task_arn")
        .eq("id", session_id)
        .single()
        .execute()
        .data
    )
    return bool(row and row.get("fargate_task_arn"))


def _run_task(job_id: str) -> str:
    resp = ecs.run_task(
        cluster=ECS_CLUSTER,
        taskDefinition=TASK_DEFINITION,
        launchType="FARGATE",
        count=1,
        networkConfiguration={
            "awsvpcConfiguration": {
                "subnets": SUBNETS,
                "assignPublicIp": "ENABLED",
            }
        },
        overrides={
            "containerOverrides": [
                {
                    "name": CONTAINER_NAME,
                    "environment": [
                        {"name": "JOB_ID", "value": job_id},
                        {"name": "SUPABASE_URL", "value": SUPABASE_URL},
                        {"name": "SUPABASE_SECRET_KEY", "value": SUPABASE_SECRET_KEY},
                        {"name": "OPENAI_API_KEY", "value": OPENAI_API_KEY},
                    ],
                }
            ]
        },
    )
    failures = resp.get("failures") or []
    if failures:
        raise RuntimeError(f"RunTask failed for job {job_id}: {failures}")
    return resp["tasks"][0]["taskArn"]


def handler(event, context):
    pending = db.table("jobs").select("id").eq("status", "pending").execute().data or []
    spawned, skipped = [], []

    for row in pending:
        job_id = row["id"]
        try:
            session_id = _ensure_session(job_id)
            if _already_spawned(session_id):
                skipped.append(job_id)
                continue

            task_arn = _run_task(job_id)
            db.table("job_sessions").update({"fargate_task_arn": task_arn}).eq(
                "id", session_id
            ).execute()
            spawned.append({"job_id": job_id, "task_arn": task_arn})
            print(f"spawned {task_arn} for job {job_id}", flush=True)
        except Exception as exc:  # keep one bad job from killing the whole tick
            print(f"ERROR job {job_id}: {exc}", flush=True)

    result = {"pending": len(pending), "spawned": len(spawned), "skipped": len(skipped)}
    print(f"tick: {result}", flush=True)
    return result
