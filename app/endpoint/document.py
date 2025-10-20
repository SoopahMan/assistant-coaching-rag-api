import os
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import delete, select

from app.helper.file_validator import validate_file_type
from app.model.document import Document
from app.response.document_response import DocumentResponse
from app.response.task_response import OcrTaskResponse
from app.service.rag_service import document_store
from config.config import ARCHIVE_DIR
from config.database import get_async_session
from task.ocr_task import ocr_pdf_task
from utils.file_manager import save_temp_file
from utils.response import WebResponse
from app.service.auth_handler import verify_token


router = APIRouter(tags=["Documents"])


@router.post(
    "/document/upload",
    response_class=JSONResponse,
    response_model=WebResponse[List[OcrTaskResponse]],
    summary="Upload multiple file",
    description="Upload multiple file for extracting",
)
async def upload_file(files: List[UploadFile], user=Depends(verify_token)):
    results = []
    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail=f"File not found")

        if not file.content_type:
            raise HTTPException(status_code=400, detail=f"File type not found")
        if not validate_file_type(file.filename):
            raise HTTPException(
                status_code=400, detail=f"Unsupported file type: {file.filename}"
            )

        try:
            temp_path = save_temp_file(file)
            task = ocr_pdf_task.delay(str(temp_path))  # type: ignore
            res = OcrTaskResponse(
                filename=file.filename,
                task_id=task.id,
                status=task.state,
                ready=task.ready(),
                successful=task.successful(),
            )
            results.append(res)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to process {file.filename}: {str(e)}"
            )

    return WebResponse(status=True, message="Upload success", payload=results)


@router.get(
    "/document",
    response_model=WebResponse[List[DocumentResponse]],
    summary="Get all documents",
    description="Retrieve all documents",
)
async def getListDocument(user=Depends(verify_token)):
    stmt = select(Document.id, Document.filename).order_by(Document.created_at)
    async with get_async_session() as session:
        result = await session.execute(stmt)
        rows = result.all()
        data = [DocumentResponse(id=id, filename=filename) for id, filename in rows]

    return WebResponse(status=True, message="Get success", payload=data)


@router.delete(
    "/document/{id}",
    response_model=WebResponse,
    summary="Delete document by ID",
    description="Delete document by ID",
)
async def deleteDocument(id: int, user=Depends(verify_token)):
    stmt = select(Document).where(Document.id == id)
    stmt_delete = delete(Document).where(Document.id == id)

    async with get_async_session() as session:
        try:
            result = await session.execute(stmt)
            data = result.scalar_one_or_none()

            if not data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Document not found",
                )

            docs_filtered = await document_store.filter_documents_async(
                filters={
                    "field": "meta.document_id",
                    "operator": "==",
                    "value": data.id,
                }
            )

            doc_ids = [doc.id for doc in docs_filtered]

            if doc_ids:
                await document_store.delete_documents_async(document_ids=doc_ids)

            file_path = ARCHIVE_DIR / data.filename
            if file_path.exists():
                try:
                    os.remove(file_path)
                except Exception as e:
                    await session.rollback()
                    return WebResponse(
                        status=False,
                        message=f"Failed to delete file from archive: {str(e)}",
                        payload=None,
                    )

            await session.execute(stmt_delete)
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise

    return WebResponse(
        status=True,
        message=f"Document deleted successfully",
        payload=None,
    )
