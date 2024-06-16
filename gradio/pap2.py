from os import environ
from dotenv import load_dotenv
import gradio as gr
from weaviate import Client as WeaviateClient
from weaviate.auth import AuthApiKey
from openai import OpenAI
import google.generativeai as genai
from transformers import pipeline
# Load environment variables from .env file
load_dotenv()
# Get the API keys from environment variables
WEAVIATE_API_KEY = environ.get("WEAVECLIENT_KEY")
WEAVIATE_URL = environ.get("WEAVECLIENT_URL")
HUGGING_FACE = environ.get("HUGGING_FACE")

# WebPage_1718541048200
# Initialize Weaviate client
client = WeaviateClient(
    url="https://lamatic-g39ejbn0.weaviate.network",
    auth_client_secret=AuthApiKey(api_key=WEAVIATE_API_KEY),
    additional_headers={
        "X-HuggingFace-Api-Key": HUGGING_FACE
    }
)
feature_extractor = pipeline('feature-extraction', model='sentence-transformers/all-MiniLM-L6-v2')
def query_weaviate(query, class_name):
    try:
        response = client.query.get(class_name, ["url content"]) \
        .with_near_text({"concepts": [query], "certainty": 0.6}) \
        .with_limit(5) \
        .do()
        return response['data']['Get'][class_name]
    except Exception as e:
        print(f"Error querying Weaviate: {e}")
        return f"Error querying Weaviate: {e}"

# query = "stackoverflow" 
query = "parrot"
class_name="WebPage_1718554776219"
weaviate_data = query_weaviate(query, class_name)
print(weaviate_data,'weaviate data')