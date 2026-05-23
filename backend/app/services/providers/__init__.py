from app.config import get_settings
from app.services.providers.base import BaseLLMProvider

_PROVIDER_REGISTRY: dict[str, tuple[type[BaseLLMProvider], str, str]] = {}


def _register_providers():
    if _PROVIDER_REGISTRY:
        return
    settings = get_settings()

    from app.services.providers.openai_provider import OpenAIProvider
    _PROVIDER_REGISTRY["openai"] = (OpenAIProvider, settings.openai_api_key, settings.openai_model)

    from app.services.providers.groq_provider import GroqProvider
    _PROVIDER_REGISTRY["groq"] = (GroqProvider, settings.groq_api_key, settings.groq_model)

    from app.services.providers.deepseek_provider import DeepSeekProvider
    _PROVIDER_REGISTRY["deepseek"] = (DeepSeekProvider, settings.deepseek_api_key, settings.deepseek_model)

    from app.services.providers.openrouter_provider import OpenRouterProvider
    _PROVIDER_REGISTRY["openrouter"] = (OpenRouterProvider, settings.openrouter_api_key, settings.openrouter_model)

    from app.services.providers.anthropic_provider import AnthropicProvider
    _PROVIDER_REGISTRY["anthropic"] = (AnthropicProvider, settings.anthropic_api_key, settings.anthropic_model)


def create_provider(name: str, model: str | None = None) -> BaseLLMProvider:
    _register_providers()
    name = name.lower()
    if name not in _PROVIDER_REGISTRY:
        raise ValueError(f"Unknown LLM provider: {name}")
    cls, api_key, default_model = _PROVIDER_REGISTRY[name]
    if not api_key:
        raise ValueError(f"API key not configured for provider: {name}")
    return cls(api_key=api_key, model=model or default_model)


def get_chat_provider() -> BaseLLMProvider:
    settings = get_settings()
    return create_provider(settings.llm_provider)
