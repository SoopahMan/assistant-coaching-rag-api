from sqlalchemy import BigInteger, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.helper.timestamp_mixin import TimestampMixin
from config.base import Base


class DocumentPage(TimestampMixin, Base):
    __tablename__ = "document_pages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE")
    )
    page_number: Mapped[int] = mapped_column(BigInteger)
    page_text: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(Text)
    document: Mapped["Document"] = relationship(back_populates="pages")  # type: ignore

    def __repr__(self) -> str:
        return f"DocumentPage(id={self.id!r}, document_id={self.document_id!r}, page_number={self.page_number!r})"
