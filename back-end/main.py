import logging
import sys

from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.endpoint import auth, document, ocr, question, task
from utils.response import WebResponse

# logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

app = FastAPI(
    title="OCR API",
    description="OCR API Documentation",
    swagger_ui_parameters={"docExpansion": "none"},
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
        "clientId": "swagger-ui"
    }
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=WebResponse(
            status=False, message=str(exc.detail), payload=None
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=WebResponse(
            status=False, message="Validation failed", payload=exc.errors()
        ).model_dump(),
    )


origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(ocr.router)
app.include_router(task.router)
app.include_router(document.router)
app.include_router(question.router)
app.include_router(auth.router)
