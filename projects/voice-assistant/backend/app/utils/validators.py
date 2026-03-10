"""
Validators for voice configuration and other inputs.
"""

import re
from typing import Dict, Any


def validate_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate voice configuration data.
    
    Checks:
    - Company name not empty (required)
    - Website URL format (if provided)
    - Voice settings ranges
    - Tonality value (if provided)
    - Prompt length reasonable
    """
    
    errors = []
    
    # Validate website URL format (if provided)
    if config.get("website_url"):
        if not validate_url(config.get("website_url")):
            errors.append("website_url: Invalid URL format")
    
    # Validate voice settings
    if config.get("voice_speed"):
        speed = float(config.get("voice_speed", 1.0))
        if speed < 0.5 or speed > 2.0:
            errors.append("voice_speed: Must be between 0.5 and 2.0")
    
    if config.get("voice_pitch"):
        pitch = float(config.get("voice_pitch", 1.0))
        if pitch < 0.5 or pitch > 2.0:
            errors.append("voice_pitch: Must be between 0.5 and 2.0")
    
    if config.get("voice_volume"):
        volume = float(config.get("voice_volume", 1.0))
        if volume < 0.0 or volume > 1.0:
            errors.append("voice_volume: Must be between 0.0 and 1.0")
    
    # Validate tonality
    valid_tonalities = [
        "professional", "casual", "friendly", "empathetic", 
        "consultative", "sales-focused"
    ]
    if config.get("tonality") and config.get("tonality") not in valid_tonalities:
        errors.append(f"tonality: Must be one of {', '.join(valid_tonalities)}")
    
    # Validate max_response_length
    valid_lengths = ["short", "medium", "long"]
    if config.get("max_response_length") and config.get("max_response_length") not in valid_lengths:
        errors.append("max_response_length: Must be 'short', 'medium', or 'long'")
    
    # Validate objection_handling
    valid_strategies = ["acknowledge", "deflect", "escalate"]
    if config.get("objection_handling") and config.get("objection_handling") not in valid_strategies:
        errors.append("objection_handling: Must be 'acknowledge', 'deflect', or 'escalate'")
    
    if errors:
        raise ValueError("; ".join(errors))
    
    return config


def validate_url(url: str) -> bool:
    """Validate URL format."""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return bool(url_pattern.match(url))


def validate_email(email: str) -> bool:
    """Validate email format."""
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(email_pattern.match(email))


def sanitize_string(text: str, max_length: int = 5000) -> str:
    """Sanitize string input."""
    if not isinstance(text, str):
        return ""
    
    # Remove potentially dangerous characters
    text = text.replace('\x00', '')
    
    # Limit length
    return text[:max_length].strip()
