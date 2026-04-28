from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ai import summarise

app = FastAPI(title="VoiceToText")
app.mount("/static", StaticFiles(directory="static"), name="static")

HTML = Path("templates/index.html").read_text()


@app.get("/", response_class=HTMLResponse)
async def index():
  return HTMLResponse(content=HTML)


class SummariseRequest(BaseModel):
  email: str | None = None
  transcript: str


@app.post("/summarise")
async def summarise_transcript(body: SummariseRequest):
  if not body.transcript.strip():
    raise HTTPException(status_code=400, detail="Transcript is empty.")

  summary = summarise(body.transcript)

  return {"summary": summary}
