from celery.result import AsyncResult
from fastapi import APIRouter, Depends

from app.response.task_response import OcrTaskResponse
from config.celery import make_celery
from utils.response import WebResponse
from app.service.auth_handler import verify_token

router = APIRouter(tags=["Task"])
celery = make_celery()


@router.get(
    "/task/{task_id}",
    response_model=WebResponse[OcrTaskResponse],
    summary="Cek status task by ID",
    description="Monitoring status task by ID",
)
async def get_task_status(task_id: str, user=Depends(verify_token)):
    res = AsyncResult(task_id, app=celery)

    response = OcrTaskResponse(
        filename=None,
        task_id=res.task_id,
        status=res.status,
        ready=res.ready(),
        successful=res.successful(),
    )

    return WebResponse(status=True, message="Get success", payload=response)
