from os import environ
import google.generativeai as genai
api_key='AIzaSyAUwgaznaRgaq7Ml7wlPlBx9VKuGjZpv4Q'
# Access your API key as an environment variable.
genai.configure(api_key=api_key)
# Choose a model that's appropriate for your use case.
model = genai.GenerativeModel('gemini-1.5-flash')

prompt = "Write a story about a magic backpack."

response = model.generate_content(prompt, stream=True)

for chunk in response:
  print(chunk.text)
  print("_"*80)