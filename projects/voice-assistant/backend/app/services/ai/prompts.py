"""
Prompt templates for Claude AI responses.
Structured for lead qualification conversations with natural fallback mocking.
"""

SYSTEM_PROMPT = """You are a friendly voice assistant on a live phone call. CRITICAL RULES:

- Reply in 1 SHORT sentence only. Maximum 15 words.
- Sound natural and conversational, like a real person talking.
- Ask one question at a time to keep the conversation flowing.
- Your goal: qualify the lead by learning their needs, budget, and timeline.
- Be warm but concise. No filler words. No bullet points. No lists.
- Never say "Great question" or similar cliches.

Examples of good responses:
- "What problem are you trying to solve?"
- "Sounds like timing is important - when do you need this by?"
- "Who else would be involved in this decision?"
- "Makes sense. What's your budget range for this?"
"""


def get_mock_response_by_keywords(user_message: str, conversation_history: list) -> str:
    """
    Generate contextual mock responses based on keywords in user message.
    This is used when no API key is available.
    
    Args:
        user_message: Latest user message
        conversation_history: List of previous messages
    
    Returns:
        Natural conversational response
    """
    message_lower = user_message.lower()
    
    # Helper to detect keyword presence
    def has_keyword(keywords):
        return any(kw in message_lower for kw in keywords)
    
    # Extract conversation stage from history
    message_count = len(conversation_history)
    
    # Stage 1: Opening/Introduction (messages 0-1)
    if message_count <= 1:
        if has_keyword(['hi', 'hello', 'hey', 'start', 'ready']):
            return "Great! I'm excited to learn about what you're working on. What brings you in today?"
        return "Thanks for joining! What's on your mind?"
    
    # Stage 2: Problem/Need Discovery (messages 2-4)
    if message_count <= 4:
        if has_keyword(['problem', 'issue', 'challenge', 'pain', 'struggle', 'difficult']):
            return "That's a really common challenge. How is that affecting your team right now?"
        if has_keyword(['looking', 'need', 'want', 'interested', 'consider']):
            return "Perfect, we definitely help with that. Can you tell me more about what success would look like for you?"
        if has_keyword(['company', 'team', 'organization', 'size', 'people']):
            return "Got it. How are you currently handling this today?"
        return "I see. Walk me through that a bit more—what's the impact?"
    
    # Stage 3: Budget/Timeline (messages 5-7)
    if message_count <= 7:
        if has_keyword(['price', 'cost', 'budget', 'expensive', 'afford', 'money']):
            return "Budget is definitely important. When are you looking to make a decision on this?"
        if has_keyword(['soon', 'asap', 'urgent', 'month', 'week', 'quarter', 'year']):
            return "That timeline makes sense. Who else on your team would need to sign off on this?"
        if has_keyword(['timeline', 'when', 'when ready', 'eventually']):
            return "No pressure. What's driving the timeline on your end?"
        return "That's helpful context. Have you evaluated other solutions?"
    
    # Stage 4: Decision/Next Steps (messages 8+)
    if message_count > 7:
        if has_keyword(['yes', 'interested', 'sounds good', 'let\'s', 'okay', 'sure']):
            return "Awesome! I'd love to set up a quick demo. Would next week work better, or do you prefer this week?"
        if has_keyword(['no', 'not', 'don\'t', 'cannot', 'won\'t', 'not interested']):
            return "No problem. If anything changes or you want to revisit this, I'm just a message away."
        if has_keyword(['demo', 'trial', 'see it', 'show me', 'walk through']):
            return "Perfect, let me get you set up. Can I grab your email to send over access?"
        if has_keyword(['thanks', 'appreciate', 'helpful', 'great']):
            return "Happy to help! Anything else on your mind?"
        return "Got it. What would be the best way to move forward?"
    
    # Default response
    return "That makes sense. Tell me more about that?"


def get_response_templates() -> dict:
    """
    Get all response templates for different scenarios.
    Useful for understanding the conversation flow.
    """
    return {
        "opening": [
            "What brings you in today?",
            "Tell me a bit about what you're working on.",
            "What's on your mind?"
        ],
        "discovery": [
            "How is that affecting you right now?",
            "Can you walk me through that?",
            "What's the impact of that?"
        ],
        "qualification": [
            "When are you looking to move forward?",
            "Who else would be involved in this decision?",
            "What does success look like for you?"
        ],
        "closing": [
            "Should we set up a time to walk through this in more detail?",
            "Would a demo be helpful?",
            "What's the best way to stay in touch?"
        ]
    }


def format_conversation_for_claude(messages: list) -> str:
    """
    Format conversation history for passing to Claude API.
    
    Args:
        messages: List of {role: "user"|"assistant", text: "..."}
    
    Returns:
        Formatted conversation string
    """
    lines = []
    for msg in messages:
        role = "User" if msg.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {msg.get('text', '')}")
    
    return "\n".join(lines)
