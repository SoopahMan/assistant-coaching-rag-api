from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.helper.timestamp_mixin import TimestampMixin
from config.base import Base


class OCRDocument(TimestampMixin, Base):
    __tablename__ = "ocr_documents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    page_number: Mapped[int] = mapped_column(BigInteger)
    content: Mapped[str] = mapped_column(Text)

    def __repr__(self) -> str:
        return f"OCRDocument(id={self.id!r}, name={self.filename!r})"
