import os
from fastapi import APIRouter
from .schemas import ChatRequest, ChatResponse
from typing import List, Dict

USE_OPENAI = bool(os.getenv("OPENAI_API_KEY"))
llm = None
if USE_OPENAI:
    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), temperature=0.2)
    except Exception as e:
        # Fallback if openai not configured properly
        llm = None

router = APIRouter(prefix="/chat", tags=["chat"])


SYSTEM_PROMPT = (
    "You are an AI sales prospecting assistant. "
    "Help the user find leads by asking concise, targeted questions about their ideal customer profile (industry, role, geography, company size, keywords). "
    "When enough information is available, acknowledge and proceed. Keep responses under 120 words."
)


def _generate_reply(messages: List[Dict]) -> str:
    if llm is not None:
        # Map to LangChain messages
        from langchain.schema import HumanMessage, SystemMessage, AIMessage

        def to_lc(m: Dict):
            if m["role"] == "system":
                return SystemMessage(content=m["content"])
            if m["role"] == "assistant":
                return AIMessage(content=m["content"])
            return HumanMessage(content=m["content"])

        lc_messages = [to_lc(m) for m in messages]
        try:
            result = llm.invoke(lc_messages)
            return getattr(result, "content", "Let’s continue. What roles and locations should I target?")
        except Exception:
            pass
    # If OpenAI is configured, you could swap in LangChain/OpenAI here.
    # To keep this service portable, reply with a lightweight heuristic.
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    if not last_user:
        return "Hi! What industry, roles, and locations should I target for your leads?"
    # Very simple branching to simulate helpfulness
    lower = last_user.lower()
    if any(k in lower for k in ["industry", "role", "location", "geo", "size", "company"]):
        return "Great, noted. Any specific keywords or technologies I should filter for?"
    return "Got it. Could you share industry, target roles, and geography to start?"


@router.post("/messages", response_model=ChatResponse)
async def chat_messages(req: ChatRequest) -> ChatResponse:
    context = [{"role": "system", "content": SYSTEM_PROMPT}] + [m.model_dump() for m in req.messages]
    reply = _generate_reply(context)
    return ChatResponse(reply=reply, session_id=req.session_id)
