import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI(title="Whisper FastAPI (OpenAI-compatible transcription)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_ID = os.getenv("WHISPER_MODEL", "small.en")
MODEL_DIR = Path(os.getenv("WHISPER_MODEL_DIR", "/models"))
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

MODEL_DIR.mkdir(parents=True, exist_ok=True)

model: Optional[WhisperModel] = None


def load_model() -> WhisperModel:
    global model
    if model is None:
        model = WhisperModel(
            MODEL_ID,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
            cache_directory=str(MODEL_DIR),
        )
    return model


@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_ID}


@app.post("/v1/audio/transcriptions")
async def transcribe(file: UploadFile = File(...), model: str = MODEL_ID):
    try:
        whisper_model = load_model()
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Model load failed: {exc}")

    suffix = Path(file.filename or "audio").suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    segments, info = whisper_model.transcribe(tmp_path)
    text = " ".join(segment.text.strip() for segment in segments).strip()

    Path(tmp_path).unlink(missing_ok=True)

    return {
        "text": text,
        "model": model,
        "language": getattr(info, "language", None) or "unknown",
        "segments": [
          {
            "text": segment.text,
            "start": segment.start,
            "end": segment.end,
          }
          for segment in segments
        ],
    }


@app.get("/")
async def root():
    return {"service": "whisper", "model": MODEL_ID}
