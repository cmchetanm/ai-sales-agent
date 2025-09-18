from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    session_id: str
    account_id: int
    user_id: Optional[int] = None
    messages: List[Message] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    session_id: str

