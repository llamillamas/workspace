"""
Claude AI Client - Provides contextual responses for lead qualification.
Supports both real Claude API (with API key) and intelligent mocking (offline mode).
"""

import logging
import os
from typing import Optional, List
import httpx

from .prompts import SYSTEM_PROMPT, get_mock_response_by_keywords, format_conversation_for_claude

logger = logging.getLogger(__name__)


class ClaudeClient:
    """
    Client for Claude AI responses.
    Falls back to intelligent mocking when API key is not available.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("CLAUDE_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-sonnet-4-5-20250929"  # Claude Sonnet 4.5
        self.use_mock = not self.api_key

        if self.use_mock:
            logger.info("Claude API key not found. Using mock mode for responses.")
        else:
            logger.info("Claude API key configured. Using real API for responses.")

    def get_response(self, user_message: str, conversation_history: Optional[List[dict]] = None) -> str:
        """Sync wrapper - use get_response_async in async contexts."""
        if self.use_mock:
            return self._get_mock_response(user_message, conversation_history or [])

        # Sync fallback for non-async callers
        try:
            messages = self._build_messages(user_message, conversation_history or [])
            response = httpx.post(
                self.api_url,
                json=self._build_payload(messages),
                headers=self._build_headers(),
                timeout=10
            )
            response.raise_for_status()
            return self._extract_response(response.json(), user_message, conversation_history or [])
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return self._get_mock_response(user_message, conversation_history or [])

    async def get_response_async(self, user_message: str, conversation_history: Optional[List[dict]] = None) -> str:
        """Async API call - does not block the event loop."""
        if self.use_mock:
            return self._get_mock_response(user_message, conversation_history or [])

        if not self.api_key:
            return self._get_mock_response(user_message, conversation_history or [])

        try:
            messages = self._build_messages(user_message, conversation_history or [])

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    json=self._build_payload(messages),
                    headers=self._build_headers(),
                    timeout=10
                )

            response.raise_for_status()
            return self._extract_response(response.json(), user_message, conversation_history or [])

        except httpx.HTTPStatusError as e:
            logger.error(f"Claude API HTTP error {e.response.status_code}: {e.response.text[:200]}")
            return self._get_mock_response(user_message, conversation_history or [])

        except httpx.RequestError as e:
            logger.error(f"Claude API request failed: {e}")
            return self._get_mock_response(user_message, conversation_history or [])

        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return self._get_mock_response(user_message, conversation_history or [])

    def _build_messages(self, user_message: str, conversation_history: List[dict]) -> list:
        messages = []
        for msg in conversation_history:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("text", "")
            })
        messages.append({"role": "user", "content": user_message})
        return messages

    def _build_headers(self) -> dict:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

    def _build_payload(self, messages: list) -> dict:
        return {
            "model": self.model,
            "max_tokens": 80,
            "system": SYSTEM_PROMPT,
            "messages": messages
        }

    def _extract_response(self, result: dict, user_message: str, conversation_history: List[dict]) -> str:
        if result.get("content") and len(result["content"]) > 0:
            response_text = result["content"][0].get("text", "")
            if response_text:
                logger.info(f"Claude response: {response_text[:80]}")
                return response_text.strip()

        logger.warning("Empty response from Claude API, using mock")
        return self._get_mock_response(user_message, conversation_history)

    def _get_mock_response(self, user_message: str, conversation_history: List[dict]) -> str:
        try:
            response = get_mock_response_by_keywords(user_message, conversation_history)
            logger.debug(f"Mock response generated: {response[:50]}...")
            return response
        except Exception as e:
            logger.error(f"Mock response generation failed: {e}")
            return "That's interesting. Can you tell me more?"

    def get_config(self) -> dict:
        return {
            "model": self.model,
            "mode": "real" if not self.use_mock else "mock",
            "has_api_key": bool(self.api_key),
            "api_url": self.api_url if not self.use_mock else "N/A"
        }
