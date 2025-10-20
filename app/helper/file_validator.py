import mimetypes
import re

from config.config import ALLOWED_MIME_TYPES


def validate_file_type(filename: str) -> bool:
    mimetype, _ = mimetypes.guess_type(filename)
    return mimetype in ALLOWED_MIME_TYPES


def sanitize_filename(filename: str) -> str:
    filename = filename.replace(" ", "_")
    filename = re.sub(r"[^\w\-_.]", "", filename)
    return filename
