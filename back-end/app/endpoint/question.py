import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from haystack import Document

from app.request.ask_request import AskRequest
from app.response.ask_response import AskQueryResponse, AskResponse
from app.service.rag_service import embedder, rag_pipeline
from app.service.auth_handler import verify_token


load_dotenv()

router = APIRouter(tags=["Question"])


@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest, user=Depends(verify_token)):
    try:
        question_doc = Document(content=request.question)
        embedding_result = embedder.run(documents=[question_doc])
        query_embedding = embedding_result["documents"][0].embedding
        # Jalankan RAG pipeline
        result = rag_pipeline.run(
            data={
                # "text_embedder": {"text": request.question},
                "retriever": {"query_embedding": query_embedding},
                "prompt_builder": {"question": request.question},
            }
        )

        # Ambil jawaban dari LLM
        answer = result.get("llm", {}).get("replies", ["No answer found"])[0]
        docs = result.get("retriever", {}).get("documents", [])

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
