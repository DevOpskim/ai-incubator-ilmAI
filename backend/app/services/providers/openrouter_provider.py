from openai import OpenAI

from app.services.providers.base import BaseLLMProvider


class OpenRouterProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "openai/gpt-4o"):
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        self.model = model

    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
