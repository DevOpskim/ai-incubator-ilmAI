from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    @abstractmethod
    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        ...
