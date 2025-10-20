from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile, Depends
from fastapi.responses import JSONResponse

from app.helper.file_validator import validate_file_type
from app.response.task_response import OcrTaskResponse
from task.ocr_task import ocr_file_task
from utils.file_manager import save_temp_file
from utils.response import WebResponse
from app.service.auth_handler import verify_token


router = APIRouter(tags=["Upload File"])


@router.post(
    "/upload",
    response_class=JSONResponse,
    response_model=WebResponse[List[OcrTaskResponse]],
    summary="Upload multiple file",
    description="Upload multiple file for OCR processing",
)
async def upload_file(files: List[UploadFile] = File(...), user=Depends(verify_token)):
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
            task = ocr_file_task.delay(str(temp_path))  # type: ignore
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
