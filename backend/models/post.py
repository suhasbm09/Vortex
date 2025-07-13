from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import re

class PostCreate(BaseModel):
    post_id: str = Field(..., min_length=1, max_length=100)
    wallet_address: str = Field(..., min_length=32, max_length=44)
    display_name: str = Field(..., min_length=1, max_length=50)
    text: Optional[str] = Field("", max_length=10000)  # 10KB text limit
    image_url: Optional[str] = Field("", max_length=1000000)  # ~1MB base64 limit
    timestamp: str = Field(..., example="2025-01-08T12:00:00Z")
    post_hash: str = Field(..., min_length=1, max_length=100)
    action_type: int = Field(..., ge=0, le=2)  # 0=create, 1=edit, 2=delete
    solana_tx_hash: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = Field(default_factory=list, max_items=10)
    location: Optional[str] = Field(None, max_length=100)
    ai_verified: Optional[bool] = Field(None, description="Whether the post has been verified by AI")
    ai_trust_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI trust score (0-1)")
    ai_explanation: Optional[str] = Field(None, max_length=1000, description="AI explanation for verification")

    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        if not re.match(r'^[A-Za-z0-9]{32,44}$', v):
            raise ValueError('Invalid wallet address format')
        return v

    @validator('text', 'image_url')
    def validate_content(cls, v, values):
        if 'text' in values and 'image_url' in values:
            if not values['text'].strip() and not values['image_url'].strip():
                raise ValueError('Post must have text, image, or both')
        return v

    @validator('action_type')
    def validate_action_type(cls, v):
        if v not in [0, 1, 2]:
            raise ValueError('Action type must be 0 (create), 1 (edit), or 2 (delete)')
        return v

    @validator('tags')
    def validate_tags(cls, v):
        if v:
            for tag in v:
                if not re.match(r'^[a-zA-Z0-9_]{1,20}$', tag):
                    raise ValueError('Tags must be 1-20 characters, alphanumeric and underscore only')
        return v

class PostUpdate(BaseModel):
    text: Optional[str] = Field(None, max_length=10000)
    image_url: Optional[str] = Field(None, max_length=1000000)
    tags: Optional[List[str]] = Field(None, max_items=10)
    location: Optional[str] = Field(None, max_length=100)

    @validator('text', 'image_url')
    def validate_content(cls, v, values):
        if 'text' in values and 'image_url' in values:
            if not values.get('text', '').strip() and not values.get('image_url', '').strip():
                raise ValueError('Post must have text, image, or both')
        return v

    @validator('tags')
    def validate_tags(cls, v):
        if v:
            for tag in v:
                if not re.match(r'^[a-zA-Z0-9_]{1,20}$', tag):
                    raise ValueError('Tags must be 1-20 characters, alphanumeric and underscore only')
        return v

class CommentCreate(BaseModel):
    post_id: str = Field(..., min_length=1, max_length=100)
    wallet_address: str = Field(..., min_length=32, max_length=44)
    display_name: str = Field(..., min_length=1, max_length=50)
    text: str = Field(..., min_length=1, max_length=1000)
    parent_comment_id: Optional[str] = Field(None, max_length=100)

    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        if not re.match(r'^[A-Za-z0-9]{32,44}$', v):
            raise ValueError('Invalid wallet address format')
        return v

    @validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError('Comment text cannot be empty')
        return v.strip()

class PostOut(BaseModel):
    post_id: str
    wallet_address: str
    display_name: str
    text: str
    image_url: Optional[str] = ""
    timestamp: str
    created_at: str
    updated_at: str
    is_deleted: bool
    likes: int = Field(0, ge=0)
    comments: int = Field(0, ge=0)
    solana_tx_hash: Optional[str] = None
    post_hash: str
    action_type: int
    tags: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    user_liked: bool = False  # For frontend to track if current user liked

    class Config:
        from_attributes = True

class CommentOut(BaseModel):
    comment_id: str
    post_id: str
    wallet_address: str
    display_name: str
    text: str
    created_at: str
    updated_at: str
    is_deleted: bool = False
    likes: int = Field(0, ge=0)
    parent_comment_id: Optional[str] = None
    replies: List['CommentOut'] = Field(default_factory=list)
    user_liked: bool = False

    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    success: bool
    message: str
    post: Optional[PostOut] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class PostListResponse(BaseModel):
    success: bool
    posts: List[PostOut]
    total: int
    has_more: bool
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class CommentResponse(BaseModel):
    success: bool
    message: str
    comment: Optional[CommentOut] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class CommentListResponse(BaseModel):
    success: bool
    comments: List[CommentOut]
    total: int
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
