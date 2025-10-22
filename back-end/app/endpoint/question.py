import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from haystack import Document
from sqlalchemy.orm import Session

from app.request.ask_request import AskRequest
from app.response.ask_response import AskQueryResponse, AskResponse
from app.service.rag_service import embedder, rag_pipeline
from app.service.auth_handler import verify_token
from app.service.memory_pipeline import ConversationMemory
from config.database import SessionLocal
from app.model.chat_session import ChatSession
from app.model.chat_message import ChatMessage



load_dotenv()

router = APIRouter(tags=["Question"])

memory = ConversationMemory()


@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest, user=Depends(verify_token)):
    db: Session = SessionLocal()
    try:
        user_id = user["sub"]
        question_text = request.question

        # 🔹 1. Ambil atau buat session aktif user
        chat_session = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
            .first()
        )
        if not chat_session:
            chat_session = ChatSession(user_id=user_id, title="Percakapan Baru")
            db.add(chat_session)
            db.commit()
            db.refresh(chat_session)

        # 🔹 2. Simpan pertanyaan user
        user_message = ChatMessage(
            session_id=chat_session.id, role="user", message=question_text
        )
        db.add(user_message)
        db.commit()

   
        question_doc = Document(content=question_text)
        embedding_result = embedder.run(documents=[question_doc])
        query_embedding = embedding_result["documents"][0].embedding
        # Jalankan RAG pipeline
        result = rag_pipeline.run(
            data={
                # "text_embedder": {"text": request.question},
                "retriever": {"query_embedding": query_embedding},
                "prompt_builder": {"question": question_text},
            }
        )

        # Ambil jawaban dari LLM
        answer = result.get("llm", {}).get("replies", ["No answer found"])[0]
        docs = result.get("retriever", {}).get("documents", [])

        # 🔹 4. Simpan jawaban asisten
        assistant_message = ChatMessage(
            session_id=chat_session.id, role="assistant", message=answer
        )
        db.add(assistant_message)
        db.commit()


        # Buat daftar sumber unik
        sources = []
        for doc in docs:
            filename = doc.meta.get("filename")
            page = doc.meta.get("page_number")
            src_text = f"{filename} (page {page})" if filename else "Unknown source"
            if src_text not in sources:
                sources.append(src_text)

        print(f"Sources found: {sources}")

        # Gabungkan jawaban + sumber
        sources_text = "\nSources:\n" + "\n".join(f"- {src}" for src in sources)
        answer_with_sources = (
            f"{answer.strip()}\n\n{sources_text}" if sources else answer
        )

        return AskQueryResponse(
            answer=[answer_with_sources],
            documents=[
                {
                    "content": doc.content,
                    "source": doc.meta.get("filename"),
                    "page_number": doc.meta.get("page_number"),
                }
                for doc in docs
            ],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
