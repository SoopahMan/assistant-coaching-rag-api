from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from config.dynamic_db import set_dynamic_session, get_dynamic_session
from app.schemas.connection_schemas import ConnectionCreate, ConnectionResponse
from app.model.db_connection import DB_Connection as ConnectionModel
from config.database import get_async_session_login


router = APIRouter(prefix="/db", tags=["Database"])


class DBConnectRequest(BaseModel):
    db_type: str
    host: str | None = None
    port: int | None = None
    username: str | None = None
    password: str | None = None
    database: str

@router.post("/connect")
async def connect_db(req: DBConnectRequest, db: AsyncSession = Depends(get_async_session_login)):  # get_db = session utama app
    try:
        if req.db_type == "postgres":
            db_url = f"postgresql+asyncpg://{req.username}:{req.password}@{req.host}:{req.port}/{req.database}"
        elif req.db_type == "mysql":
            db_url = f"mysql+aiomysql://{req.username}:{req.password}@{req.host}:{req.port}/{req.database}"
        elif req.db_type == "sqlite":
            db_url = f"sqlite+aiosqlite:///{req.database}"  
        else:
            raise HTTPException(status_code=400, detail="Unsupported database type")

        # Test koneksi
        session_maker = set_dynamic_session(db_url)
        async with session_maker() as session:
            await session.execute(text("SELECT 1"))

        # Simpan ke tabel connections
        conn = ConnectionModel(
            db_type=req.db_type,
            host=req.host,
            port=req.port,
            username=req.username,
            password=req.password,
            database=req.database,
            is_active=True,
        )
        db.add(conn)
        await db.commit()

        return {"status": True, "message": "Database connected & saved", "payload": {"id": conn.id}}

    except Exception as e:
        return {"status": False, "message": f"Connection failed: {str(e)}", "payload": None}



@router.get("/tables")
async def list_tables(db: AsyncSession = Depends(get_dynamic_session)):
    try:
        result = await db.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        return {"status": True, "message": "Success", "payload": tables}
    except Exception as e:
        return {"status": False, "message": f"Failed to fetch tables: {str(e)}", "payload": None}



@router.get("/query")
async def query_table(table: str, db: AsyncSession = Depends(get_dynamic_session)):
    try:
        result = await db.execute(text(f'SELECT * FROM "{table}" LIMIT 50'))
        rows = [dict(row) for row in result.mappings().all()]
        return {"status": True, "message": "Success", "payload": rows}
    except Exception as e:
        return {"status": False, "message": f"Failed to query table: {str(e)}", "payload": None}
    

@router.get("/connections")
async def list_connections(db: AsyncSession = Depends(get_async_session_login)):
    try:
        result = await db.execute(select(ConnectionModel))
        connections = result.scalars().all()
        payload = [
            {
                "id": conn.id,
                "db_type": conn.db_type,
                "host": conn.host,
                "port": conn.port,
                "database": conn.database,
                "username": conn.username,
                "active": conn.is_active,
            }
            for conn in connections
        ]
        return {"status": True, "message": "Success", "payload": payload}
    except Exception as e:
        return {"status": False, "message": f"Failed to fetch connections: {str(e)}", "payload": None}
    

@router.post("/connections/{connection_id}/activate")
async def activate_connection(connection_id: int, db: AsyncSession = Depends(get_async_session_login)):
    try:
        # Nonaktifkan semua
        await db.execute(
            update(ConnectionModel).values(is_active=False)
        )

        # Aktifkan yang dipilih
        await db.execute(
            update(ConnectionModel)
            .where(ConnectionModel.id == connection_id)
            .values(is_active=True)
        )
        await db.commit()

        return {"status": True, "message": f"Connection {connection_id} activated", "payload": {"id": connection_id}}
    except Exception as e:
        return {"status": False, "message": f"Failed to activate connection: {str(e)}", "payload": None}


@router.get("/connections/active")
async def get_active_connection(db: AsyncSession = Depends(get_async_session_login)):
    try:
        result = await db.execute(
            select(ConnectionModel).where(ConnectionModel.is_active == True)
        )
        conn = result.scalar_one_or_none()
        if not conn:
            return {
                "status": False,
                "message": "No active connection",
                "payload": None,
            }

        payload = {
            "id": conn.id,
            "db_type": conn.db_type,
            "host": conn.host,
            "port": conn.port,
            "database": conn.database,
            "username": conn.username,
            "active": conn.is_active,
        }

        return {
            "status": True,
            "message": "Active connection found",
            "payload": payload,
        }
    except Exception as e:
        return {
            "status": False,
            "message": f"Failed to fetch active connection: {str(e)}",
            "payload": None,
        }

