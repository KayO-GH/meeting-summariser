import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

 # TODO: #1 Set up the client using the API key from Google AI Studio
 # use genai.Client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# TODO: #2 Include the prompt that sets the persona of the model and its task
SYSTEM_PROMPT = """
You are a note-taking assistant.  Extract key points and action items from this meeting transcript.
Return as: Summary - Key Points - Action Items

"""

def summarise(transcript: str) -> str:
  # TODO: #3 get the response from calling the model, passing the transcript and prompt
  # use the client.models.generate_content
  # Return response.text
  response = client.models.generate_content(
    model="gemma-4-31b-it",
    contents=transcript,
    config={"system_instruction": SYSTEM_PROMPT}
  )
  
  return response.text