FROM python:3.12-slim

# ffmpeg/ffprobe are shelled out to by worker.py (transcode + chunk before Whisper).
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY worker.py .

# JOB_ID + SUPABASE_URL + SUPABASE_SECRET_KEY + OPENAI_API_KEY arrive as env
# from the Lambda distributor's RunTask containerOverrides.
CMD ["python", "worker.py"]
