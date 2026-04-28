import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

 # TODO: #1 Set up the client using the API key from Google AI Studio
 # use genai.Client
client = None

# TODO: #2 Include the prompt that sets the persona of the model and its task
SYSTEM_PROMPT = """
"""

def summarise(transcript: str) -> str:
  # TODO: #3 get the response from calling the model, passing the transcript and prompt
  # use the client.models.generate_content
  # Return response.text
  return ""