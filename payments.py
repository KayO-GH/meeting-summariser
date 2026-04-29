import os
import json
import hashlib
import time
import requests
from pathlib import Path

CREDITS_FILE = Path("credits.json")
FREE_CREDITS = 2
TOPUP_CREDITS = 5
TOPUP_AMOUNT_GHS = 10.0
PAYSTACK_BASE = "https://api.paystack.co"


def _headers() -> dict:
  return {
    "Authorization": f"Bearer {os.environ['PAYSTACK_SECRET_KEY']}",
    "Content-Type": "application/json",
  }


def load_credits() -> dict:
  if CREDITS_FILE.exists():
    return json.loads(CREDITS_FILE.read_text())
  return {}


def save_credits(data: dict):
  CREDITS_FILE.write_text(json.dumps(data, indent=2))

def get_credits(email: str) -> int:
  data = load_credits()
  if email not in data:
    data[email] = FREE_CREDITS
    save_credits(data)
  return data[email]


def deduct_credit(email: str):
  data = load_credits()
  data[email] = max(0, data.get(email, 0) - 1)
  save_credits(data)


def make_reference(email: str) -> str:
  h = hashlib.md5(email.encode()).hexdigest()[:8]
  return f"vtt-{h}-{int(time.time())}"


def initialize_payment(email: str) -> dict:
  reference = make_reference(email)
  resp = requests.post(
    f"{PAYSTACK_BASE}/transaction/initialize",
    headers=_headers(),
    json={
      "email": email,
      "amount": int(TOPUP_AMOUNT_GHS * 100),
      "currency": "GHS",
      "reference": reference,
    },
  )
  return resp.json()["data"]


def verify(email: str, reference: str) -> tuple[bool, str]:
  resp = requests.get(
    f"{PAYSTACK_BASE}/transaction/verify/{reference}",
    headers=_headers(),
  )
  data = resp.json().get("data", {})

  return top_up(email, data)
  

def top_up(email: str, data: dict) -> tuple[bool, str]:
  if data.get("status") == "success":
    amount_ghs = data.get("amount", 0) / 100
    if amount_ghs < TOPUP_AMOUNT_GHS:
      return False, "Payment amount was insufficient."
    add_credits(email, TOPUP_CREDITS)
    return True, f"Payment confirmed. {TOPUP_CREDITS} credits added to your account."
  return False, "Payment not confirmed. Check your reference and try again."

def add_credits(email: str, amount: int = TOPUP_CREDITS):
  data = load_credits()
  data[email] = data.get(email, 0) + amount
  save_credits(data)
