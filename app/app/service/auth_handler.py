import os
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, BigInteger

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config.database import get_async_session_login, SessionLocal
from app.model.auth_model import AuthModel 
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")



load_dotenv()
jwt_secret_key = os.getenv("JWT_SECRET_KEY", "")
jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
jwt_access_token = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60))


security = HTTPBearer()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()

    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])  

    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=jwt_access_token))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, jwt_secret_key, algorithm=jwt_algorithm)
    return encoded_jwt, expire

  
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_session_login),
):
    try:
        payload = jwt.decode(token, jwt_secret_key, algorithms=[jwt_algorithm])
        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user_id missing",
            )

        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user_id format in token",
            )

        # query user
        result = await db.execute(
            select(AuthModel).where(AuthModel.user_id == user_id)
        )
        user = result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def require_role(required: str):
    def _dep(user: AuthModel = Depends(get_current_user)):
        if user.role != required:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return _dep

def verify_token(access_token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(access_token, jwt_secret_key, algorithms=[jwt_algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=403, detail="Token is invalid or expired")
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Token is invalid or expired")

def add_user(user: AuthModel, db: Session = Depends(SessionLocal)):
    existing_user = db.query(AuthModel).filter(AuthModel.username == user.username)
    if existing_user.first():
        raise HTTPException(status_code=400 , detail="Username already exists")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

