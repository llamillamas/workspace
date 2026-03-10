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
        """
        Initialize Claude client.
        
        Args:
            api_key: Optional Anthropic API key. If not provided, uses mock mode.
                    Can also be set via ANTHROPIC_API_KEY environment variable.
        """
        self.api_key = api_key or os.getenv("CLAUDE_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-sonnet-4-6-20250514"  # Latest Claude Sonnet 4.6
        self.use_mock = not self.api_key
        
        if self.use_mock:
            logger.info("Claude API key not found. Using mock mode for responses.")
        else:
            logger.info("Claude API key configured. Using real API for responses.")
    
    def get_response(self, user_message: str, conversation_history: Optional[List[dict]] = None) -> str:
        """
        Get AI response to user message.
        Automatically uses real API or mock based on configuration.
        
        Args:
            user_message: Latest user message
            conversation_history: List of previous messages {role, text}
        
        Returns:
            AI response text
        
        Raises:
            RuntimeError: If API call fails and fallback to mock is disabled
        """
        if self.use_mock:
            return self._get_mock_response(user_message, conversation_history or [])
        else:
            return self._get_real_response(user_message, conversation_history or [])
    
    def _get_real_response(self, user_message: str, conversation_history: List[dict]) -> str:
        """
        Get response from actual Claude API.
        
        This is a skeleton for integration with Anthropic API.
        In production, would use official Python SDK.
        """
        if not self.api_key:
            logger.warning("API key missing, falling back to mock")
            return self._get_mock_response(user_message, conversation_history)
        
        try:
            # Build conversation for Claude
            messages = []
            
            # Add conversation history
            for msg in conversation_history:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("text", "")
                })
            
            # Add current user message
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Prepare request to Claude API
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "max_tokens": 80,  # Very short for fast voice responses
                "system": SYSTEM_PROMPT,
                "messages": messages
            }
            
            # Make request (using httpx for async compatibility)
            # Note: In production would use official Anthropic SDK
            response = httpx.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            response.raise_for_status()
            
            # Extract response text
            result = response.json()
            if result.get("content") and len(result["content"]) > 0:
                response_text = result["content"][0].get("text", "")
                if response_text:
                    logger.debug(f"Claude response received: {response_text[:50]}...")
                    return response_text.strip()
            
            logger.warning("Empty response from Claude API, using mock")
            return self._get_mock_response(user_message, conversation_history)
        
        except httpx.RequestError as e:
            logger.error(f"Claude API request failed: {e}")
            logger.info("Falling back to mock responses")
            return self._get_mock_response(user_message, conversation_history)
        
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return self._get_mock_response(user_message, conversation_history)
    
    def _get_mock_response(self, user_message: str, conversation_history: List[dict]) -> str:
        """
        Generate intelligent mock response based on conversation context.
        
        This provides realistic lead qualification responses without API keys,
        enabling fully offline operation during development/demos.
        """
        try:
            response = get_mock_response_by_keywords(user_message, conversation_history)
            logger.debug(f"Mock response generated: {response[:50]}...")
            return response
        except Exception as e:
            logger.error(f"Mock response generation failed: {e}")
            return "That's interesting. Can you tell me more?"
    
    def get_config(self) -> dict:
        """Get client configuration info."""
        return {
            "model": self.model,
            "mode": "real" if not self.use_mock else "mock",
            "has_api_key": bool(self.api_key),
            "api_url": self.api_url if not self.use_mock else "N/A"
        }
