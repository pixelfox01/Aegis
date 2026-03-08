from abc import ABC, abstractmethod
from app.settings import get_settings
from google import genai
from pydantic import BaseModel, Field
from enum import Enum

import json

settings = get_settings()

PROMPT = """You are a privacy policy analyst helping users understand what they're agreeing to.

Analyze the privacy policy below and answer each question accurately based ONLY on the document content.

For each question, provide:
1. A clear 1-3 sentence answer in plain language
2. A concern level (low/medium/high) indicating privacy risk
3. A relevant quote from the policy if applicable

Rules:
- If not specified in policy, state "Not specified in this policy"
- Use plain language for non-technical users
- Mark vague language as medium/high concern
- Highlight data sharing with third parties as high concern
- Quote specific sections for important claims

Privacy Policy:
{agreement_text}

Questions:
{questions}
"""


class ConcernLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PrivacyAnswer(BaseModel):
    answer: str = Field(
        description="Clear, concise answer to the question based on the policy"
    )
    concern_level: ConcernLevel = Field(
        description="Privacy concern level: low, medium, or high"
    )
    quote: str | None = Field(
        default=None, description="Relevant quote from policy if applicable"
    )


class LLMResponse(BaseModel):
    answers: list[PrivacyAnswer] = Field(
        description="Answers in same order as questions"
    )


class LLMProvider(ABC):
    @abstractmethod
    def generate_summaries(self, agreement_text: str, questions: list[str]):
        pass


class GeminiProvider(LLMProvider):
    def __init__(self):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required when using gemini provider")
        self.client = genai.Client(api_key=settings.gemini_api_key)

    def generate_summaries(self, agreement_text: str, questions: list[str]):
        questions_formatted = "\n".join(
            [f"{i + 1}. {q}" for i, q in enumerate(questions)]
        )

        prompt = PROMPT.format(
            agreement_text=agreement_text, questions=questions_formatted
        )

        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": LLMResponse.model_json_schema(),
            },
        )

        result = json.loads(response.text)
        return result["answers"]


def get_llm_provider():
    provider_name = settings.llm_provider.lower()

    if provider_name == "gemini":
        return GeminiProvider()
    else:
        raise ValueError(
            f"Unknown LLM provider: {provider_name}." "Supported: 'gemini'"
        )
