from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.rag import get_rag_context
from src.chain import ask_assistant

router = APIRouter()

class ChatHistoryMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: List[ChatHistoryMessage] = []
    profile: Optional[Dict[str, Any]] = None

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    POST /api/chat
    Performs RAG search and runs assistant chain
    """
    try:
        query = request.message
        farmer_id = request.profile.get("id") if request.profile else None

        # 1. Retrieve RAG context snippets
        context = get_rag_context(query, farmer_id)

        # 2. Convert messages history into dictionaries
        history_list = [{"role": m.role, "content": m.content} for m in request.history]

        # 3. Run LLM chain
        result = await ask_assistant(query, history_list, context, request.profile)

        # 4. Attach metadata for debugging/UI sources
        result["context_retrieved"] = True
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate assistant response: {str(e)}"
        )
