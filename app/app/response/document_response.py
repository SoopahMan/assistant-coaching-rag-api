from pydantic import BaseModel


class OcrDocumentResponse(BaseModel):
    filename: str
    page_count: int


class DocumentResponse(BaseModel):
    id: int
    filename: str
