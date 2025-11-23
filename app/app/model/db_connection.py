from sqlalchemy.orm import Mapped, mapped_column, declarative_base
from sqlalchemy import String, Integer, BigInteger, DateTime, Boolean
from datetime import datetime

from app.helper.timestamp_mixin import TimestampMixin
from config.base import Base

class DB_Connection(TimestampMixin, Base):
    __tablename__ = "database_connect"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    db_type: Mapped[str] = mapped_column(String(50), nullable=False)   
    host: Mapped[str] = mapped_column(String(255), nullable=True)
    port: Mapped[int] = mapped_column(Integer, nullable=True)
    username: Mapped[str] = mapped_column(String(100), nullable=True)
    password: Mapped[str] = mapped_column(String(255), nullable=True)  
    database: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False) 

    def __repr__(self) -> str:
        return f"DB_Connection(id={self.id!r}, db_type={self.db_type!r}, host={self.host!r}, database={self.database!r})"

