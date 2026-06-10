from fastapi import APIRouter
from config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    provider = settings.LLM_PROVIDER
    has_key = False
    
    if provider == "gemini":
        has_key = bool(settings.GEMINI_API_KEY)
    elif provider == "openai":
        has_key = bool(settings.OPENAI_API_KEY)
        
    return {
        "status": "healthy",
        "llm_provider": provider,
        "api_key_configured": has_key,
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
        "env": settings.ENV
    }
