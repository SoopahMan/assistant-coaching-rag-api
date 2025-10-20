import random
import shutil
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.helper.file_validator import sanitize_filename
from config.config import ARCHIVE_DIR, UPLOAD_DIR


def save_temp_file(upload_file: UploadFile) -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    random_number = random.randint(1000, 9999)

    if not upload_file.filename:
        raise HTTPException(status_code=400, detail=f"File type not found")

    original_name = sanitize_filename(upload_file.filename)
    unique_name = f"{timestamp}_{random_number}_{original_name}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)

    return file_path


def archive_file(file_path: Path) -> Path:
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)

    archived_file_path = ARCHIVE_DIR / file_path.name

    shutil.move(str(file_path), ARCHIVE_DIR)

    return archived_file_path


def delete_temp_file(file_path: Path) -> None:
    temp_file_path = UPLOAD_DIR / file_path.name
    try:
        if temp_file_path.exists():
            temp_file_path.unlink()
    except Exception as e:
        print(f"Gagal menghapus file {temp_file_path}: {e}")
