"""
Voice Call Handler Router
WebSocket endpoint for real-time voice communication with Deepgram STT/TTS and Claude AI.
"""

import logging
import json
import uuid
from typing import Dict, Optional
from fastapi import APIRouter, Depends, status
from fastapi.websockets import WebSocket
from sqlalchemy.orm import Session

from app.services.voice import DeepgramSTT, DeepgramTTS, CallHandler
from app.services.ai import ClaudeClient
from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])

# Global state for managing calls
active_calls: Dict[str, CallHandler] = {}

# Initialize clients
stt_client = DeepgramSTT()
tts_client = DeepgramTTS()
claude_client = ClaudeClient()


@router.websocket("/ws/call/{call_id}")
async def websocket_voice_call(websocket: WebSocket, call_id: str):
    """
    WebSocket endpoint for voice calls.

    Protocol:
    Client -> Server (binary): audio chunk
    Client -> Server (JSON): {"action": "end_call" | "get_state"}
    Server -> Client (JSON): {"type": "transcript_update" | "audio_response" | "error", "data": {...}}
    Server -> Client (binary): TTS audio response
    """
    await websocket.accept()
    logger.info(f"WebSocket connection established: {call_id}")

    if call_id not in active_calls:
        user_id = str(uuid.uuid4())
        call_handler = CallHandler(call_id, user_id)
        call_handler.start_call()
        active_calls[call_id] = call_handler
    else:
        call_handler = active_calls[call_id]

    try:
        while True:
            data = await websocket.receive()

            if "bytes" in data:
                audio_bytes = data["bytes"]
                logger.info(f"Received audio chunk: {len(audio_bytes)} bytes")
                await process_audio_chunk(websocket, call_handler, audio_bytes)
            elif "text" in data:
                logger.info(f"Received text message: {data['text'][:100]}")
                text_data = json.loads(data["text"])
                await handle_control_message(websocket, call_handler, text_data)
            else:
                logger.warning(f"Received unknown data type: {list(data.keys())}")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "data": {"message": str(e)}})
        except:
            pass
    finally:
        call_handler.end_call()
        active_calls.pop(call_id, None)
        logger.info(f"Call ended: {call_id}")


async def process_audio_chunk(
    websocket: WebSocket,
    call_handler: CallHandler,
    audio_bytes: bytes,
) -> None:
    """
    Process incoming audio: STT -> Claude -> TTS -> send back.
    """
    try:
        # Step 1: Transcribe with Deepgram
        logger.info(f"STT: sending {len(audio_bytes)} bytes to Deepgram...")
        stt_result = await stt_client.transcribe(audio_bytes)
        user_message = stt_result.get("text", "").strip()
        logger.info(f"STT result: '{user_message}' (confidence: {stt_result.get('confidence', 'N/A')})")

        if not user_message:
            await websocket.send_json({
                "type": "transcript_update",
                "data": {
                    "message": {"role": "user", "text": "[No speech detected]"},
                    "transcript": call_handler.get_transcript(),
                    "lead_score": call_handler.lead_score,
                },
            })
            return

        # Add user message
        call_handler.add_message("user", user_message)

        # Step 2: Get Claude AI response (async - doesn't block event loop)
        conversation_history = [
            {"role": msg.role, "text": msg.text}
            for msg in call_handler.messages[:-1]
        ]
        ai_response = await claude_client.get_response_async(user_message, conversation_history)
        call_handler.add_message("assistant", ai_response)

        # Step 3: Synthesize speech with Deepgram TTS
        response_audio = await tts_client.synthesize(ai_response)

        # Step 4: Score lead
        lead_score = calculate_lead_score(call_handler)
        call_handler.update_lead_score(
            raw_score=lead_score["raw_score"],
            matched_rules=lead_score["matched_rules"],
            final_score=lead_score["final_score"],
        )

        # Step 5: Send transcript update
        await websocket.send_json({
            "type": "transcript_update",
            "data": {
                "user_message": user_message,
                "assistant_message": ai_response,
                "transcript": call_handler.get_transcript(),
                "lead_score": call_handler.lead_score,
            },
        })

        # Send TTS audio as binary
        if response_audio:
            await websocket.send_bytes(response_audio)

        logger.info(f"Processed chunk (score: {lead_score['final_score']}/100)")

    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        await websocket.send_json({
            "type": "error",
            "data": {"message": f"Processing error: {str(e)}"},
        })


async def handle_control_message(
    websocket: WebSocket,
    call_handler: CallHandler,
    text_data: dict,
) -> None:
    """Handle control messages from client."""
    action = text_data.get("action")

    if action == "get_state":
        await websocket.send_json({"type": "state", "data": call_handler.get_state()})
    elif action == "end_call":
        await websocket.send_json({"type": "call_ended", "data": call_handler.get_state()})
    else:
        await websocket.send_json({
            "type": "error",
            "data": {"message": f"Unknown action: {action}"},
        })


def calculate_lead_score(call_handler: CallHandler) -> dict:
    """Simple keyword-based lead scoring."""
    transcript = call_handler.get_full_context().lower()

    hot_keywords = ["budget", "approved", "ready", "asap", "urgent", "decision maker", "timeline"]
    warm_keywords = ["interested", "sounds good", "maybe", "consider", "makes sense"]
    cold_keywords = ["no", "not interested", "never", "probably not"]

    score = 0
    matched_rules = []

    for kw in hot_keywords:
        if kw in transcript:
            score += 15
            matched_rules.append(f"hot_{kw}")
    for kw in warm_keywords:
        if kw in transcript:
            score += 8
            matched_rules.append(f"warm_{kw}")
    for kw in cold_keywords:
        if kw in transcript:
            score = max(0, score - 10)
            matched_rules.append(f"cold_{kw}")

    if len(call_handler.messages) >= 4:
        score += 10
        matched_rules.append("engagement_4plus")
    if len(call_handler.messages) >= 8:
        score += 10
        matched_rules.append("engagement_8plus")

    final_score = min(100, max(0, score))
    return {"raw_score": score, "final_score": final_score, "matched_rules": matched_rules}


@router.get("/calls/{call_id}")
async def get_call_state(call_id: str):
    if call_id not in active_calls:
        return {"error": "Call not found"}
    return {"data": active_calls[call_id].get_state()}


@router.get("/calls")
async def list_active_calls():
    return {
        "active_calls": len(active_calls),
        "calls": [
            {"call_id": cid, "duration": c.get_duration(), "messages": len(c.messages), "score": c.lead_score.get("final_score", 0)}
            for cid, c in active_calls.items()
        ],
    }


@router.get("/health")
async def voice_health():
    return {
        "status": "healthy",
        "stt": stt_client.get_model_info(),
        "tts": tts_client.get_config(),
        "claude": claude_client.get_config(),
        "active_calls": len(active_calls),
    }
