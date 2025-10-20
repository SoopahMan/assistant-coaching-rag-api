from typing import Any, Generic, Optional, TypeVar

from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

T = TypeVar("T")


class WebResponse(BaseModel, Generic[T]):
    status: bool
    message: str
    payload: Optional[T]


class PaginationResponse(BaseModel, Generic[T]):
    page: int
    size: int
    total_pages: int
    total_items: int
    items: list[T]


def web_response(message: str = "Success", data: Optional[Any] = None) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=WebResponse(status=True, message=message, payload=data).model_dump(),
    )


def web_error(
    message: str = "Internal Server Error",
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=WebResponse(status=False, message=message, payload=None).model_dump(),
    )
