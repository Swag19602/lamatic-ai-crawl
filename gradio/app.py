from config import WEAVIATE_API_KEY,WEAVIATE_URL,OPENAI_API_KEY,GEMINI_API_KEY,HUGGING_FACE
import gradio as gr
from weaviate import Client as WeaviateClient
from weaviate.auth import AuthApiKey
from openai import OpenAI
import google.generativeai as genai

# Set your OpenAI API key
openai = OpenAI(api_key=OPENAI_API_KEY)

# Access your API key as an environment variable.
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Weaviate client
client = WeaviateClient(
    url=WEAVIATE_URL,
    auth_client_secret=AuthApiKey(api_key=WEAVIATE_API_KEY),
    additional_headers={
        "X-HuggingFace-Api-Key": HUGGING_FACE
    }
)
# Function to query Weaviate
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

# Function to query OpenAI with data from Weaviate
def ask_chatgpt(data, query):
    prompt = f"Based on the following data: {data}, answer the following question: {query}"
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Comportati come se fossi un SEO copywriter professionista."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=100,
            top_p=1,
            frequency_penalty=0.0,
            presence_penalty=0.0,
            stop=['\n']
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error querying ChatGPT: {e}")
        return f"Error querying ChatGPT: {e}"

def ask_google_gemini(data,query):
    prompt = f"Based on the following data: {data}, answer the following question: {query}"
    # Choose a model that's appropriate for your use case.
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt, stream=True)
    # Store the response in the specified format
    formatted_response = ""
    for chunk in response:
        formatted_response += chunk.text 
    
    return formatted_response

# Function to handle the chat
def api_calling(query, class_name):
    weaviate_data = query_weaviate(query, class_name)
    print(weaviate_data,'data')
    if "Error" in weaviate_data:
        return weaviate_data
    # return ask_chatgpt(weaviate_data, query)
    return ask_google_gemini(weaviate_data,query)

def message_and_history(input, history, class_name):
    history = history or []
    s = list(sum(history[-10:], ()))  # Use only the last 10 messages
    s.append(input)
    inp = ' '.join(s)
    output = api_calling(inp, class_name)
    history.append((input, output))
    return history, history

# Function to get class_name from request
def get_class_name_from_request(request: gr.Request):
    query_params = request.query_params
    class_name = query_params.get('className', 'default_class')  # Provide a default value if className is not present
    return class_name

# Define Gradio interface
block = gr.Blocks(theme=gr.themes.Monochrome())
with block:
    gr.Markdown("<h1><center>ChatBot with Gradio and OpenAI & Google Gemini</center></h1>")
    state = gr.State()
    chatbot = gr.Chatbot()
    message = gr.Textbox(placeholder="Enter your query here...")

    # Update to handle class_name properly
    def submit_fn(input, history, request: gr.Request):
        class_name = get_class_name_from_request(request)
        return message_and_history(input, history, class_name)
    
    submit = gr.Button("SEND")
    submit.click(submit_fn, inputs=[message, state], outputs=[chatbot, state])

if __name__ == "__main__":
    block.launch(server_name="0.0.0.0", server_port=7860)

