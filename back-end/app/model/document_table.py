from sqlalchemy import JSON, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.helper.timestamp_mixin import TimestampMixin
from config.base import Base


class DocumentTable(TimestampMixin, Base):
    __tablename__ = "document_tables"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE")
    )
    page_number: Mapped[int] = mapped_column(BigInteger)
    table_number: Mapped[int] = mapped_column(BigInteger)
    table_data: Mapped[dict] = mapped_column(JSON)
    document: Mapped["Document"] = relationship(back_populates="tables")  # type: ignore

    def __repr__(self) -> str:
        return f"DocumentTable(id={self.id!r}, document_id={self.document_id!r}, page_number={self.page_number!r} table_number={self.table_number!r})"
