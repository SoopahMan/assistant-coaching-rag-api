from typing import List

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.helper.timestamp_mixin import TimestampMixin
from config.base import Base


class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    pages: Mapped[List["DocumentPage"]] = relationship(back_populates="document")  # type: ignore
    tables: Mapped[List["DocumentTable"]] = relationship(back_populates="document")  # type: ignore

    def __repr__(self) -> str:
        return f"Document(id={self.id!r}, filename={self.filename!r})"
