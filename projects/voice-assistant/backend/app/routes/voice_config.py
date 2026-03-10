"""
Voice Configuration API Routes
-------------------------------
Endpoints for managing voice assistant configuration, prompts, and knowledge base.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Body
from sqlalchemy.orm import Session
from typing import Any, Optional, List

from app.core.database import get_db
from app.utils.dependencies import get_current_user
from app.services.config.voice_config_manager import VoiceConfigManager
from app.services.config.knowledge_base_manager import KnowledgeBaseManager
from app.models import VoiceAssistantConfig, VoiceAssistantPrompt, VoiceAssistantKnowledgeBase

router = APIRouter(prefix="/api/voice-config", tags=["voice-config"])


# === CONFIG ENDPOINTS ===

@router.get("/")
@router.get("")
async def get_config(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's voice assistant configuration."""
    manager = VoiceConfigManager(db)
    config = manager.get_config(user.id)

    if not config:
        # Auto-create default config for new users
        config = manager.create_config(user.id, {})

    return manager.get_config_dict(config)


@router.post("/")
@router.post("")
async def create_or_update_config(
    config_data: dict = Body(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update user's voice assistant configuration."""
    manager = VoiceConfigManager(db)

    existing = manager.get_config(user.id)
    if existing:
        config = manager.update_config(user.id, config_data)
    else:
        config = manager.create_config(user.id, config_data)

    return manager.get_config_dict(config)


@router.put("/{field}")
async def update_config_field(
    field: str,
    value: Any,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a specific configuration field."""
    manager = VoiceConfigManager(db)
    
    try:
        config = manager.update_field(user.id, field, value)
        return manager.get_config_dict(config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# === VOICE OPTIONS ENDPOINTS ===

@router.get("/voice-options")
async def get_voice_options(
    engine: Optional[str] = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get available voices for a specific engine."""
    manager = VoiceConfigManager(db)
    voices = manager.get_voice_options(engine)
    
    return {
        "engine": engine or "pyttsx3",
        "voices": voices,
    }


@router.get("/tonalities")
async def get_tonalities(
    user=Depends(get_current_user),
):
    """Get available tonality options."""
    manager = VoiceConfigManager(None)  # No DB needed for this
    tonalities = manager.get_tonalities()
    
    return {
        "tonalities": tonalities,
    }


# === PROMPT ENDPOINTS ===

@router.get("/prompts")
async def get_prompts(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current prompts for user's configuration."""
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    prompts = db.query(VoiceAssistantPrompt).filter(
        VoiceAssistantPrompt.config_id == config.id
    ).first()
    
    if not prompts:
        raise HTTPException(status_code=404, detail="Prompts not found")
    
    return {
        "system_prompt": prompts.system_prompt,
        "qualification_prompt": prompts.qualification_prompt,
        "objection_prompt": prompts.objection_prompt,
        "default_responses": prompts.default_responses,
    }


@router.post("/prompts")
async def update_prompts(
    prompt_data: dict,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update prompts for user's configuration."""
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    prompts = db.query(VoiceAssistantPrompt).filter(
        VoiceAssistantPrompt.config_id == config.id
    ).first()
    
    if not prompts:
        raise HTTPException(status_code=404, detail="Prompts not found")
    
    # Update prompt fields
    if "system_prompt" in prompt_data:
        prompts.system_prompt = prompt_data["system_prompt"]
    if "qualification_prompt" in prompt_data:
        prompts.qualification_prompt = prompt_data["qualification_prompt"]
    if "objection_prompt" in prompt_data:
        prompts.objection_prompt = prompt_data["objection_prompt"]
    if "default_responses" in prompt_data:
        prompts.default_responses = prompt_data["default_responses"]
    
    db.commit()
    db.refresh(prompts)
    
    return {
        "system_prompt": prompts.system_prompt,
        "qualification_prompt": prompts.qualification_prompt,
        "objection_prompt": prompts.objection_prompt,
        "default_responses": prompts.default_responses,
    }


@router.post("/test-response")
async def test_response(
    question: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Test AI response with current configuration."""
    from app.services.ai.claude_client import ClaudeClient
    
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Get system prompt
    manager = VoiceConfigManager(db)
    system_prompt = manager.generate_system_prompt(config)
    
    # Generate response
    client = ClaudeClient()
    try:
        response = await client.call_claude(
            message=question,
            system_prompt=system_prompt,
            user_id=user.id,
        )
        
        return {
            "question": question,
            "response": response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")


@router.get("/voice-test")
async def test_voice(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Test voice synthesis with current voice settings."""
    from app.services.voice.tts_client import TTSClient
    
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Test sentence
    test_text = "Hello! This is a test of your voice settings. How does this sound?"
    
    # Generate audio
    tts = TTSClient()
    try:
        audio_url = await tts.synthesize(
            text=test_text,
            voice_engine=config.voice_engine,
            voice_name=config.voice_name,
            speed=float(config.voice_speed),
            pitch=float(config.voice_pitch),
            volume=float(config.voice_volume),
        )
        
        return {
            "text": test_text,
            "audio_url": audio_url,
            "voice_name": config.voice_name,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")


# === KNOWLEDGE BASE ENDPOINTS ===

@router.post("/knowledge-base/upload")
async def upload_knowledge_base(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a file to the knowledge base."""
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload file
        kb_manager = KnowledgeBaseManager(db)
        kb_item = kb_manager.upload_file(
            config_id=config.id,
            file_content=content,
            filename=file.filename,
            file_type="document",
        )
        
        return {
            "id": kb_item.id,
            "title": kb_item.content_title,
            "type": kb_item.content_type,
            "created_at": kb_item.created_at.isoformat(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@router.post("/knowledge-base/url")
async def add_knowledge_base_url(
    url: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a website URL to the knowledge base."""
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    try:
        kb_manager = KnowledgeBaseManager(db)
        kb_item = kb_manager.add_url(config_id=config.id, url=url)
        
        return {
            "id": kb_item.id,
            "title": kb_item.content_title,
            "type": kb_item.content_type,
            "url": kb_item.content_url,
            "created_at": kb_item.created_at.isoformat(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding URL: {str(e)}")


@router.get("/knowledge-base")
async def list_knowledge_base(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all knowledge base items for user."""
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    kb_manager = KnowledgeBaseManager(db)
    kb_items = kb_manager.get_knowledge_base(config.id)
    stats = kb_manager.get_kb_stats(config.id)
    
    return {
        "items": [
            {
                "id": item.id,
                "title": item.content_title,
                "type": item.content_type,
                "url": item.content_url,
                "created_at": item.created_at.isoformat(),
            }
            for item in kb_items
        ],
        "stats": stats,
    }


@router.delete("/knowledge-base/{kb_id}")
async def delete_knowledge_base_item(
    kb_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a knowledge base item."""
    # Verify ownership (KB item belongs to user's config)
    kb_item = db.query(VoiceAssistantKnowledgeBase).filter(
        VoiceAssistantKnowledgeBase.id == kb_id
    ).first()
    
    if not kb_item:
        raise HTTPException(status_code=404, detail="Knowledge base item not found")
    
    # Verify config belongs to user
    config = db.query(VoiceAssistantConfig).filter(
        VoiceAssistantConfig.id == kb_item.config_id,
        VoiceAssistantConfig.user_id == user.id,
    ).first()
    
    if not config:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    kb_manager = KnowledgeBaseManager(db)
    if kb_manager.delete_kb_item(kb_id):
        return {"status": "deleted"}
    else:
        raise HTTPException(status_code=404, detail="Knowledge base item not found")
