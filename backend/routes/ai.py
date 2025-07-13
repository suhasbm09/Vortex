from fastapi import APIRouter
from models.ai import AIRequest, AIResponse
from services.openrouter_client import call_openrouter

router = APIRouter()

@router.post("/ai/verify-content", response_model=AIResponse)
async def verify_post(payload: AIRequest):
    result = await call_openrouter(payload.text)
    return AIResponse(**result) 