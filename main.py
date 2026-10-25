import os
import json
import time
import logging
import asyncio
from pathlib import Path
from datetime import datetime

import requests
from dotenv import load_dotenv
from groq import Groq
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from app.booking_router import router as booking_router
from app.schedule_router import router as schedule_router


# -------------------- APPLICATION --------------------

app = FastAPI(title="AI Voice Assistant")

app.include_router(booking_router)
app.include_router(schedule_router)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


# -------------------- LOGGING --------------------

# Vercel par filesystem read-only hota hai.
# Isliye Vercel par sirf console logging use hogi.
if os.getenv("VERCEL"):
    LOG_FILE = None
else:
    LOG_DIR = BASE_DIR / "logs"
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    LOG_FILE = LOG_DIR / f"{datetime.now():%Y-%m-%d_%H-%M-%S}.log"


logger = logging.getLogger("voice_bot")
logger.setLevel(logging.INFO)
logger.propagate = False

for handler in logger.handlers[:]:
    logger.removeHandler(handler)
    handler.close()

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Log file sirf local machine par create hogi.
if LOG_FILE is not None:
    file_handler = logging.FileHandler(
        LOG_FILE,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)


def log_event(event_name: str, **details):
    logger.info(
        "%s %s",
        event_name,
        json.dumps(details, ensure_ascii=False, default=str)
    )


def log_timing_summary(data: dict):
    """Log timing details for voice bot methods."""

    method = data.get("method", "Unknown")
    user_input = data.get("user_input", "")
    ai_response = data.get("ai_response", "")
    timings = data.get("timings", {})

    def seconds(key):
        try:
            return float(timings.get(key, 0) or 0)
        except (TypeError, ValueError):
            return 0.0

    total = seconds("total_latency_seconds")

    if total == 0:
        total = seconds("total_time_seconds")

    lines = [
        "",
        "=" * 50,
        "TIMING SUMMARY",
        f"Method: {method}",
        "",
        f"User Input: {user_input}",
        f"AI Response: {ai_response}",
        "",
    ]

    if method == "Speech-to-Text":
        lines.extend([
            f"Recording Time: {seconds('recording_time_seconds'):.2f} seconds",
            f"Transcription Time: {seconds('transcription_time_seconds'):.2f} seconds",
        ])

        if seconds("ai_response_time_seconds") > 0:
            lines.append(
                f"AI Response Time: "
                f"{seconds('ai_response_time_seconds'):.2f} seconds"
            )

    elif method == "Speech-to-Speech":
        lines.extend([
            f"Recording Time: {seconds('recording_time_seconds'):.2f} seconds",
            f"Transcription Time: {seconds('transcription_time_seconds'):.2f} seconds",
            f"AI Response Time: {seconds('ai_response_time_seconds'):.2f} seconds",
            f"Voice Generation Time: {seconds('voice_generation_time_seconds'):.2f} seconds",
            f"Audio Download Time: {seconds('audio_download_time_seconds'):.3f} seconds",
        ])

    elif method == "Text-to-Speech":
        lines.extend([
            f"AI Response Time: {seconds('ai_response_time_seconds'):.2f} seconds",
            f"Voice Generation Time: {seconds('voice_generation_time_seconds'):.2f} seconds",
            f"Audio Download Time: {seconds('audio_download_time_seconds'):.3f} seconds",
        ])

    else:
        lines.append(
            f"AI Response Time: {seconds('ai_response_time_seconds'):.2f} seconds"
        )

    if method in ("Text-to-Speech", "Speech-to-Speech"):
        lines.append(
            f"Audio Duration: {seconds('audio_duration_seconds'):.2f} seconds"
        )

    lines.extend([
        "",
        f"TOTAL LATENCY: {total:.2f} seconds",
        "=" * 50,
        "",
    ])

    logger.info("\n".join(lines))


log_event(
    "APPLICATION STARTED",
    log_file=str(LOG_FILE) if LOG_FILE else "Vercel console"
)


# -------------------- STATIC FILES --------------------

app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static"
)


# -------------------- API CLIENTS --------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

GROQ_MODEL = "openai/gpt-oss-120b"

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# -------------------- REQUEST MODELS --------------------

class ChatRequest(BaseModel):
    message: str


class TTSRequest(BaseModel):
    message: str


# -------------------- HOME --------------------

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {}
    )


# -------------------- HEALTH CHECK --------------------

@app.get("/health")
async def health():
    return {"status": "ok"}


# -------------------- TIMING LOG --------------------

@app.post("/api/metadata-log")
async def metadata_log(request: Request):
    try:
        data = await request.json()
        log_timing_summary(data)

        return {"status": "ok"}

    except Exception as exc:
        logger.exception("Could not process timing summary")

        raise HTTPException(
            status_code=400,
            detail="Could not process timing summary"
        ) from exc


# -------------------- TEXT TO TEXT --------------------

@app.post("/api/chat")
async def chat(payload: ChatRequest):
    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    if not groq_client:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is missing from environment variables"
        )

    started = time.perf_counter()

    log_event(
        "AI RESPONSE STARTED",
        user_input=message
    )

    try:
        completion = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a friendly, concise AI voice assistant. "
                        "Answer in simple, natural conversational English. "
                        "For normal questions, use 1 to 3 short sentences "
                        "and aim for 40 words or fewer. "
                        "Answer directly. Avoid unnecessary details, "
                        "headings, bullet points, markdown formatting, "
                        "and long lists. Make responses sound natural "
                        "when spoken aloud. Give longer answers only "
                        "when the user asks for details."
                    )
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            temperature=0.5,
            max_completion_tokens=300
        )

        reply = completion.choices[0].message.content or ""
        elapsed = time.perf_counter() - started

        log_event(
            "AI RESPONSE COMPLETE",
            server_processing_time_seconds=round(elapsed, 4)
        )

        return {
            "reply": reply,
            "backend_seconds": round(elapsed, 4)
        }

    except Exception as exc:
        logger.exception("AI response failed")

        raise HTTPException(
            status_code=502,
            detail="AI response failed. Check Vercel runtime logs."
        ) from exc


# -------------------- TEXT TO SPEECH --------------------

@app.post("/api/tts")
async def text_to_speech(payload: TTSRequest):
    text = payload.message.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text is required."
        )

    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")

    if not api_key or not voice_id:
        raise HTTPException(
            status_code=500,
            detail="ElevenLabs API key or voice ID is missing."
        )

    url = (
        "https://api.elevenlabs.io/v1/text-to-speech/"
        f"{voice_id}/stream"
    )

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    body = {
        "text": text,
        "model_id": "eleven_flash_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    started = time.perf_counter()

    try:
        result = await asyncio.to_thread(
            requests.post,
            url,
            headers=headers,
            json=body,
            stream=True,
            timeout=(15, 90)
        )

    except requests.RequestException as exc:
        logger.exception("ElevenLabs streaming request failed")

        raise HTTPException(
            status_code=502,
            detail="Could not connect to ElevenLabs."
        ) from exc

    first_response_seconds = time.perf_counter() - started

    if not result.ok:
        status_code = result.status_code
        error_text = result.text[:1000]
        result.close()

        logger.error(
            "ElevenLabs returned %s: %s",
            status_code,
            error_text
        )

        raise HTTPException(
            status_code=502,
            detail=f"ElevenLabs TTS failed: {error_text}"
        )

    logger.info(
        "TTS stream started | first_response=%.2fs",
        first_response_seconds
    )

    def audio_stream():
        try:
            for chunk in result.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk

        except requests.RequestException:
            logger.exception("Error while streaming TTS audio")
            raise

        finally:
            result.close()
            logger.info("TTS audio stream closed")

    return StreamingResponse(
        audio_stream(),
        media_type="audio/mpeg",
        headers={
            "X-TTS-Backend-Seconds": f"{first_response_seconds:.4f}",
            "Cache-Control": "no-cache, no-store",
            "X-Accel-Buffering": "no"
        }
    )


# -------------------- SPEECH TO TEXT --------------------

@app.post("/api/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ELEVENLABS_API_KEY is missing from environment variables"
        )

    started = time.perf_counter()

    log_event("SPEECH TRANSCRIPTION STARTED")

    try:
        audio_bytes = await audio.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="Audio file is empty"
            )

        url = "https://api.elevenlabs.io/v1/speech-to-text"

        headers = {
            "xi-api-key": ELEVENLABS_API_KEY
        }

        files = {
            "file": (
                audio.filename or "recording.webm",
                audio_bytes,
                audio.content_type or "audio/webm"
            )
        }

        data = {
            "model_id": "scribe_v1"
        }

        result = await asyncio.to_thread(
            requests.post,
            url,
            headers=headers,
            files=files,
            data=data,
            timeout=(10, 90)
        )

        if not result.ok:
            log_event(
                "SPEECH TRANSCRIPTION FAILED",
                status_code=result.status_code,
                error=result.text[:500]
            )

            raise HTTPException(
                status_code=502,
                detail="Speech transcription failed. Check ElevenLabs settings."
            )

        transcript = result.json().get("text", "").strip()
        elapsed = time.perf_counter() - started

        log_event(
            "SPEECH TRANSCRIPTION COMPLETE",
            server_processing_time_seconds=round(elapsed, 4),
            transcript_length=len(transcript)
        )

        return {
            "text": transcript,
            "backend_seconds": round(elapsed, 4)
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Speech transcription failed")

        raise HTTPException(
            status_code=502,
            detail="Speech transcription request failed"
        ) from exc

    finally:
        await audio.close()


# -------------------- GLOBAL EXCEPTION HANDLER --------------------

@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception):
    logger.exception(
        "Unexpected server error on %s %s",
        request.method,
        request.url.path
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Unexpected server error. Check Vercel runtime logs."
        }
    )
