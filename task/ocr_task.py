from pathlib import Path
from typing import Dict, List

from app.service.ocr_service import perform_ocr_on_file
from app.service.pdf_service import extract_pdf_auto
from config.celery import make_celery

celery = make_celery()


@celery.task(name="ocr_task")
def ocr_file_task(file_path_str: str) -> List[Dict]:
    file_path = Path(file_path_str)
    return perform_ocr_on_file(file_path)


@celery.task(name="pdf_task")
def ocr_pdf_task(file_path_str: str) -> int:
    file_path = Path(file_path_str)
    return extract_pdf_auto(file_path)
