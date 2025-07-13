from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional
from datetime import datetime
import re

class UserCreate(BaseModel):
    wallet_address: str = Field(..., min_length=32, max_length=44, example="Hwvd...ABC123")
    username: str = Field(..., min_length=3, max_length=30, example="suhasbm")
    display_name: str = Field(..., min_length=1, max_length=50, example="Suhas BM")
    profile_image: Optional[str] = Field(None, max_length=1000000)  # ~1MB base64 limit
    bio: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=200)
    twitter: Optional[str] = Field(None, max_length=50)
    instagram: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    created_at: str = Field(..., example="2025-01-08T12:00:00Z")

    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        if not re.match(r'^[A-Za-z0-9]{32,44}$', v):
            raise ValueError('Invalid wallet address format')
        return v

    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', v):
            raise ValueError('Username must be 3-30 characters, alphanumeric and underscore only')
        return v

    @validator('display_name')
    def validate_display_name(cls, v):
        if not v.strip():
            raise ValueError('Display name cannot be empty')
        return v.strip()

    @validator('website')
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

    @validator('twitter')
    def validate_twitter(cls, v):
        if v and not v.startswith('@'):
            v = '@' + v
        return v

    @validator('instagram')
    def validate_instagram(cls, v):
        if v and not v.startswith('@'):
            v = '@' + v
        return v

class UserProfileUpdate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=50, example="Suhas BM")
    profile_image: Optional[str] = Field(None, max_length=1000000)
    bio: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=200)
    twitter: Optional[str] = Field(None, max_length=50)
    instagram: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None

    @validator('display_name')
    def validate_display_name(cls, v):
        if not v.strip():
            raise ValueError('Display name cannot be empty')
        return v.strip()

    @validator('website')
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

    @validator('twitter')
    def validate_twitter(cls, v):
        if v and not v.startswith('@'):
            v = '@' + v
        return v

    @validator('instagram')
    def validate_instagram(cls, v):
        if v and not v.startswith('@'):
            v = '@' + v
        return v

class UserOut(BaseModel):
    wallet_address: str
    username: str
    display_name: str
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    twitter: Optional[str] = None
    instagram: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    created_at: str
    updated_at: str
    is_deleted: bool = False
    profile_completed: bool = True

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserOut] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class UserListResponse(BaseModel):
    success: bool
    users: list[UserOut]
    total: int
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
