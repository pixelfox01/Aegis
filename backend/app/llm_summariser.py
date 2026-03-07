import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("BACKBOARD_API_KEY")
BASE_URL = "https://app.backboard.io/api"
HEADERS = {"X-API-Key": API_KEY}

response = requests.post(
    f"{BASE_URL}/assistants",
    json={
        "name": "Privacy Agreements Analyzer",
        "system_prompt": "You are a helpful assistant that will receive long documents that users regularly have to agree to, such as Privacy Policies, or Terms & Conditions, and you will help analyze, summarize, and understand them."
    },
    headers=HEADERS,
)

assistant = response.json()
assistant_id = assistant['assistant_id']

response = requests.post(
    f"{BASE_URL}/assistants/{assistant_id}/threads",
    headers=HEADERS,
)
thread = response.json()

thread_id = thread["thread_id"]

response = requests.post(
    f"{BASE_URL}/threads/{thread_id}/messages",
    headers={"X-API-Key": API_KEY},
    data={
        "content": "What is the capital of France?",
        "stream": "false",
        "memory": "off"
    },
)
result = response.json()
print(f"Assistant: {result['content']}")
