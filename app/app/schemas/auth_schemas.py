from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AuthRequest(BaseModel):
    username: str
    password: str

class AddUserRequest(BaseModel):
    username: str
    password: str = Field(..., min_length=8, description="Password minimal 8 karakter")
    role: str

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    expires_at: datetime

class UserResponse(BaseModel):
    user_id: int
    username: str
    role: str

class Config:
    orm_mode = True

class UserOut(BaseModel):
    username: str
    role: str

