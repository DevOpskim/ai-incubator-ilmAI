from app.config import get_settings
from app.services.providers.base import BaseLLMProvider


def get_chat_provider() -> BaseLLMProvider:
    settings = get_settings()
    provider_name = settings.llm_provider.lower()

    if provider_name == "openai":
        from app.services.providers.openai_provider import OpenAIProvider
        return OpenAIProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )
    elif provider_name == "groq":
        from app.services.providers.groq_provider import GroqProvider
        return GroqProvider(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
        )
    elif provider_name == "deepseek":
        from app.services.providers.deepseek_provider import DeepSeekProvider
        return DeepSeekProvider(
            api_key=settings.deepseek_api_key,
            model=settings.deepseek_model,
        )
    elif provider_name == "openrouter":
        from app.services.providers.openrouter_provider import OpenRouterProvider
        return OpenRouterProvider(
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
        )
    else:
        raise ValueError(f"Unknown LLM provider: {provider_name}")
