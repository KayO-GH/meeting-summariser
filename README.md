# Meeting Summariser

Meeting Summariser is a voice-to-text web app that uses AI to turn spoken meeting transcripts into clean, structured summaries, with key points and action items. It is one of the demo project for the **3-day in-person developer workshop in Ghana**, where participants learnt how to automate prompts in model provide's UI into a functional AI-powered web app using Python and Google Gemma 4.

---

## Features

- 🎙 In-browser speech recording using the Web Speech API
- 🤖 AI summarisation powered by Google Gemma (via `gemma-4-31b-it`)
- 💳 Paystack payment integration for credit top-ups
- ⚡ FastAPI backend with a lightweight HTML/JS frontend

---

## Prerequisites

- [uv](https://docs.astral.sh/uv/) — Python package and project manager
- A [Google AI Studio](https://aistudio.google.com/) API key
- A [Paystack](https://paystack.com/) secret key (for the payments feature)

---

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/PaystackOSS/meeting-summariser.git
   cd meeting-summariser
   ```

2. **Install dependencies**

   ```bash
   uv sync
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
   ```

4. **Start the development server**

   ```bash
   uv run fastapi dev
   ```

   The app will be available at `http://localhost:8000`.

---

## Workshop Structure

This project is used over two days of hands-on sessions:

### Day 1 — AI Summarisation (`ai.py`)

Participants focus on the `ai.py` file. The goal is to understand how to interact with the Google Gemma API using the `google-genai` SDK. Work includes:

- Writing and refining the system prompt to produce well-structured summaries
- Implementing the `summarise(transcript)` function that sends the transcript to the model and returns a formatted response with a summary, key points, and action items

### Day 2 — Payments with Paystack (`payments.py`)

Participants focus on the `payments.py` file. The goal is to integrate Paystack to gate access to the summarisation feature using a credits system. Work includes:

- Implementing `initialize_payment(email)` to create a Paystack transaction and return a checkout URL
- Implementing `verify(email, reference)` to confirm a transaction and top up the user's credits upon successful payment

---

## Project Structure

```
meeting-summariser/
├── main.py              # FastAPI app and route definitions
├── ai.py                # Google Gemma integration and summarise function
├── payments.py          # Paystack payment initialisation and verification
├── credits.json         # Local store for user credits
├── templates/
│   └── index.html       # Frontend HTML
├── static/
│   ├── app.js           # Frontend JavaScript
│   └── style.css        # Styles
└── pyproject.toml       # Project dependencies
```