import io
from pathlib import Path
from typing import Dict, List

import fitz
import pytesseract
from PIL import Image
from sqlalchemy import insert
import numpy as np
import cv2

from app.model.ocr_document import OCRDocument
from app.service.rag_service import save_documents
from config.database import SessionLocal
from utils.file_manager import archive_file


def perform_ocr_on_file(file_path: Path) -> List[Dict]:
    content_type = detect_content_type(file_path)

    try:
        with file_path.open("rb") as f:
            content = f.read()

        archive_file(file_path)

        extracted_content = extract_content(content, content_type, file_path.name)

        # insert to db (pg)
        insert_data(extracted_content)

        # insert to vector db
        save_documents(extracted_content)

        return extracted_content

    except Exception as e:
        raise RuntimeError(f"OCR processing failed for {file_path.name}: {e}")


# def extract_content(content: bytes, content_type: str) -> str:
#     if content_type == "application/pdf":
#         return extract_content_from_pdf(content)
#     elif content_type.startswith("image/"):
#         return extract_content_from_image(content)
#     else:
#         raise ValueError(f"Unsupported content type: {content_type}")


def extract_content(content: bytes, content_type: str, filename: str) -> List[Dict]:
    if content_type == "application/pdf":
        return extract_content_from_pdf(content, filename)
    elif content_type.startswith("image/"):
        return []
    else:
        raise ValueError(f"Unsupported content type: {content_type}")


# def extract_content_from_pdf(pdf_bytes: bytes) -> str:
#     try:x
#         doc = fitz.open(stream=pdf_bytes, filetype="pdf")
#         content = ""
#         for page in doc:
#             pix = page.get_pixmap()  # type: ignore
#             img_data = pix.tobytes("png")
#             image = Image.open(io.BytesIO(img_data))
#             content += pytesseract.image_to_string(image) + "\n"
#         return content.strip()
#     except Exception as e:
#         raise RuntimeError(f"Failed to extract content from PDF: {e}")


def extract_content_from_pdf(pdf_bytes: bytes, filename: str) -> List[Dict]:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        results = []
        for i, page in enumerate(doc):  # type: ignore
            pix = page.get_pixmap()
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))
            image_cv = np.array(image)
            res = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
            content = pytesseract.image_to_string(res)

            results.append(
                {"filename": filename, "page_number": i + 1, "content": content.strip()}
            )

        return results
    except Exception as e:
        raise RuntimeError(f"Failed to extract content from PDF: {e}")


def extract_content_from_image(image_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image_cv = np.array(image)
        res = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
        return pytesseract.image_to_string(res).strip()
    except Exception as e:
        raise RuntimeError(f"Failed to extract content from image: {e}")


def detect_content_type(file_path: Path) -> str:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        return "application/pdf"
    elif suffix in {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"}:
        return f"image/{suffix.lstrip('.')}"
    else:
        return "application/octet-stream"


def insert_data(data: List[Dict]):
    if not data:
        print("No data to insert.")
        return

    with SessionLocal() as session:
        stmt = insert(OCRDocument).values(data)
        session.execute(stmt)
        session.commit()
        print("OCR data inserted successfully.")
