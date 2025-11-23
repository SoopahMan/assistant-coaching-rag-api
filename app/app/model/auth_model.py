from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.helper.timestamp_mixin import TimestampMixin
from config.base import Base


class AuthModel(TimestampMixin, Base):
    __tablename__ = "auth_users"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(String(255))
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(Text)

    # 🔹 Relasi ke ChatSession
    chat_sessions = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"AuthModel(user_id={self.user_id!r}, username={self.username!r})"
