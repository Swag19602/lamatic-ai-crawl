from dotenv import load_dotenv
from os import environ


# Load environment variables from .env file
load_dotenv()
# Get the API keys from environment variables
WEAVIATE_API_KEY = environ.get("WEAVECLIENT_KEY")
WEAVIATE_URL = environ.get("WEAVECLIENT_URL")
OPENAI_API_KEY = environ.get('OPENAI_API')
GEMINI_API_KEY=environ.get('GEMINI_API_KEY')
HUGGING_FACE = environ.get("HUGGING_FACE")