from pathlib import Path
from typing import Dict, List

import camelot
import pdfplumber

from app.model.document import Document
from app.model.document_page import DocumentPage
from app.model.document_table import DocumentTable
from config.database import SessionLocal
from utils.file_manager import archive_file, delete_temp_file

from .document_service import save_to_document


def is_text_based(pdf_path: Path) -> bool:
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text and text.strip():
                    return True
    except Exception:
        pass

    return False


def extract_text_pdf(pdf_path: Path) -> List[Dict]:
    results = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text and text.strip():
                results.append((i + 1, text.strip(), "text"))

    return results


def extract_tables(pdf_path: Path) -> List[Dict]:
    results = []
    try:
        tables = camelot.read_pdf(str(pdf_path), pages="all", flavor="lattice")  # type: ignore
        for idx, table in enumerate(tables):
            df = table.df
            table_json = df.to_dict(orient="records")
            results.append((table.page, idx + 1, table_json))
    except Exception as e:
        print(f"[WARN] gagal ekstrak tabel: {e}")
    return results


def extract_text_ocr(pdf_path: Path) -> List[Dict]:
    """Placeholder untuk OCR extraction (future)."""
    return []


def extract_tables_ocr(pdf_path: Path) -> List[Dict]:
    """Placeholder untuk ekstraksi tabel dari hasil OCR (future)."""
    return []


def extract_pdf_auto(pdf_path: Path) -> int:
    session = SessionLocal()

    try:
        doc = Document(filename=pdf_path.name)
        session.add(doc)
        session.flush()

        if is_text_based(pdf_path):
            text_pages = extract_text_pdf(pdf_path)
            page_objs = [
                DocumentPage(
                    document_id=doc.id,
                    page_number=pg,
                    page_text=txt,
                    source=src,
                )
                for pg, txt, src in text_pages
            ]
            session.bulk_save_objects(page_objs)

            tables = extract_tables(pdf_path)
            table_objs = [
                DocumentTable(
                    document_id=doc.id,
                    page_number=pg,
                    table_number=tidx,
                    table_data=data,
                )
                for pg, tidx, data in tables
            ]
            if table_objs:
                session.bulk_save_objects(table_objs)
        else:
            print("[INFO] PDF image-based, OCR belum diimplementasi")
            text_pages = extract_text_ocr(pdf_path)
            tables = extract_tables_ocr(pdf_path)

        session.commit()
        save_to_document(doc.id, text_pages, tables)
        archive_file(pdf_path)
        return doc.id

    except Exception as e:
        session.rollback()
        delete_temp_file(pdf_path)
        raise e
    finally:
        session.close()
