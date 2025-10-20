from contextlib import asynccontextmanager
from fastapi import Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.model.db_connection import DB_Connection as ConnectionModel
from config.database import get_async_session_login

dynamic_engines = {}
dynamic_sessions = {}

async def get_active_db_url(db: AsyncSession):
    """Ambil db_url dari koneksi yang aktif di tabel connections"""
    result = await db.execute(select(ConnectionModel).where(ConnectionModel.is_active == True))
    conn = result.scalar_one_or_none()
    if not conn:
        return None

    if conn.db_type == "postgres":
        return f"postgresql+asyncpg://{conn.username}:{conn.password}@{conn.host}:{conn.port}/{conn.database}"
    elif conn.db_type == "mysql":
        return f"mysql+aiomysql://{conn.username}:{conn.password}@{conn.host}:{conn.port}/{conn.database}"
    elif conn.db_type == "sqlite":
        return f"sqlite+aiosqlite:///{conn.database}"
    return None


def set_dynamic_session(db_url: str):
    global CURRENT_DB_URL
    CURRENT_DB_URL = db_url  # simpan sebagai current
    if db_url not in dynamic_sessions:
        engine = create_async_engine(db_url, echo=False, future=True)
        session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        dynamic_engines[db_url] = engine
        dynamic_sessions[db_url] = session_maker
    return dynamic_sessions[db_url]


async def get_dynamic_session(app_db: AsyncSession = Depends(get_async_session_login)):
    """Return AsyncSession untuk database yang aktif"""
    db_url = await get_active_db_url(app_db)
    if not db_url:
        raise RuntimeError("No active database connection. Activate one first.")

    session_maker = set_dynamic_session(db_url)
    async with session_maker() as session:
        yield session

