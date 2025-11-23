from typing import List, Optional

from pydantic import BaseModel


class AskResponse(BaseModel):
    answer: list[str]
    documents: list[str]


class DocumentSource(BaseModel):
    filename: str
    page_number: Optional[int] = None
    chunk_id: Optional[int] = None
    score: Optional[float] = None


class AskQueryResponse(BaseModel):
    answer: List[str]
    documents: List[object]
