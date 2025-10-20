from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from typing import List
from datetime import datetime
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.service.auth_handler import create_access_token, verify_token, get_current_user
from app.model.auth_model import AuthModel 
from config.database import get_async_session_login
from app.schemas.auth_schemas import AuthRequest, TokenResponse, UserResponse, AddUserRequest, UserUpdateRequest

router = APIRouter(tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(request: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_async_session_login)):
    result = await db.execute(select(AuthModel).where(AuthModel.username == request.username))
    user = result.scalars().first()

    if not user or not bcrypt.checkpw(request.password.encode(), user.password.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token, expire = create_access_token({"sub": user.user_id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
        "expires_at": expire
    }


@router.get("/verify-token/{access_token}")
async def verify_user_token(access_token: str):
    verify_token(access_token=access_token)
    return {"message": "Token is valid"}


@router.post("/add-user", response_model=UserResponse)
async def add_user(request: AddUserRequest, db: AsyncSession = Depends(get_async_session_login), user=Depends(verify_token)):
    existing_user = await db.execute(
        select(AuthModel).where(AuthModel.username == request.username)
    )
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    hashed_password = bcrypt.hashpw(
        request.password.encode(), bcrypt.gensalt()
    ).decode()

    new_user = AuthModel(
        user_id=None,
        username=request.username,
        password=hashed_password,
        role=request.role
    ) 
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user

@router.get("/users")
async def get_users(db: AsyncSession = Depends(get_async_session_login), user=Depends(verify_token)):
    try:
        result = await db.execute(select(AuthModel))
        users = result.scalars().all()
        return [{"user_id": u.user_id, "username": u.username, "role": u.role} for u in users]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

@router.put("/edit-users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: UserUpdateRequest,   
    db: AsyncSession = Depends(get_async_session_login),
    users=Depends(verify_token)
):
    result = await db.execute(select(AuthModel).where(AuthModel.user_id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if request.username:
        user.username = request.username

    if request.password:
        hashed_password = bcrypt.hashpw(
            request.password.encode(), bcrypt.gensalt()
        ).decode()
        user.password = hashed_password

    if request.role:
        user.role = request.role

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/delete-user/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_async_session_login), users=Depends(verify_token)):
    result = await db.execute(select(AuthModel).where(AuthModel.user_id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await db.delete(user)
    await db.commit()

    return {"message": f"User {user.username} deleted successfully"}

@router.get("/me")
async def read_users_me(current_user: AuthModel = Depends(get_current_user), user=Depends(verify_token)):
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "role": current_user.role
    }


