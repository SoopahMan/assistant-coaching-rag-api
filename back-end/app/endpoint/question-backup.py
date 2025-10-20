import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from haystack import Document

from app.request.ask_request import AskRequest
from app.response.ask_response import AskResponse
from app.service.rag_service import embedder, rag_pipeline

load_dotenv()

router = APIRouter(tags=["Question"])
openai_api_key = os.getenv("OPENAI_API_KEY")


@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    try:
        question_doc = Document(content=request.question)
        embedding_result = embedder.run(documents=[question_doc])
        query_embedding = embedding_result["documents"][0].embedding

        result = rag_pipeline.run(
            data={
                "retriever": {"query_embedding": query_embedding},
                "prompt_builder": {"question": request.question},
            }
        )

        answer = result.get("llm", {}).get("replies", ["No answer found"])[0]
        docs = result.get("prompt_builder", {}).get("documents", [])

        return AskResponse(
            answer=[answer],
            documents=[doc.content for doc in docs],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
