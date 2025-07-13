from pydantic import BaseModel

class AIRequest(BaseModel):
    text: str

class AIResponse(BaseModel):
    trust_score: int
    trust_tag: str
    explanation: str 