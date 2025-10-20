from pydantic import BaseModel


class OcrTaskResponse(BaseModel):
    filename: str | None
    task_id: str | None
    status: str
    ready: bool
    successful: bool
