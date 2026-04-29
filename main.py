from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from pydantic import BaseModel

from ai import summarise
from payments import (
  get_credits,
  deduct_credit,
  initialize_payment,
  verify,
)

load_dotenv()

app = FastAPI(title="VoiceToText")
app.mount("/static", StaticFiles(directory="static"), name="static")

HTML = Path("templates/index.html").read_text()


@app.get("/", response_class=HTMLResponse)
async def index():
  return HTMLResponse(content=HTML)


@app.get("/credits")
async def credits(email: str):
  if not email:
    raise HTTPException(status_code=400, detail="Email is required.")
  return {"email": email, "credits": get_credits(email)}


class SummariseRequest(BaseModel):
  email: str
  transcript: str


@app.post("/summarise")
async def summarise_transcript(body: SummariseRequest):
  if not body.transcript.strip():
    raise HTTPException(status_code=400, detail="Transcript is empty.")

  remaining = get_credits(body.email)
  if remaining <= 0:
    raise HTTPException(status_code=402, detail="No credits remaining. Please top up.")

  summary = summarise(body.transcript)
  deduct_credit(body.email)
  return {"summary": summary}


class PaymentInitRequest(BaseModel):
  email: str


@app.post("/payment/initialize")
async def payment_initialize(body: PaymentInitRequest):
  try:
    data = initialize_payment(body.email)
    return {"authorization_url": data["authorization_url"], "reference": data["reference"]}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


class PaymentVerifyRequest(BaseModel):
  email: str
  reference: str


@app.post("/payment/verify")
async def payment_verify(body: PaymentVerifyRequest):
  success, message = verify(body.email, body.reference)
  credits = get_credits(body.email)
  return {"success": success, "message": message, "credits": credits}
