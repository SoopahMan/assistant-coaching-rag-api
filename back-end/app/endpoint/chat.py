from fastapi import APIRouter, Depends
from app.service.memory_pipeline import ConversationMemory
from app.service.auth_handler import verify_token

router = APIRouter(tags=["Chat Sessions"])

@router.post("/chat/new")
def create_chat(title: str = None, user=Depends(verify_token)):
    memory = ConversationMemory()
    session_id = memory.create_session(user["sub"], title)
    return {"session_id": session_id, "message": "New chat created"}

@router.get("/chat/list")
def list_chats(user=Depends(verify_token)):
    memory = ConversationMemory()
    sessions = memory.get_user_sessions(user["sub"])
    return [
        {"id": s.id, "title": s.title or f"Chat {s.id}", "created_at": s.created_at}
        for s in sessions
    ]

@router.get("/chat/{session_id}")
def get_chat(session_id: int, user=Depends(verify_token)):
    memory = ConversationMemory()
    context = memory.get_context(session_id, limit=50)
    return {"messages": context}

@router.delete("/chat/{session_id}")
def delete_chat(session_id: int, user=Depends(verify_token)):
    memory = ConversationMemory()
    memory.delete_session(session_id)
    return {"message": "Chat deleted"}
