import os
from fastapi import APIRouter
from .schemas import ChatRequest, ChatResponse
from typing import List, Dict
import httpx

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


def _extract_filters(text: str) -> Dict[str, str]:
    t = text.lower()
    role = 'cto' if 'cto' in t or 'engineering' in t else ('marketing' if 'marketing' in t else '')
    location = 'us' if 'us' in t or 'united states' in t else ('india' if 'india' in t else '')
    keywords = ''
    return {"role": role, "location": location, "keywords": keywords}


def _post_internal(path: str, payload: Dict) -> bool:
    base = os.getenv("BACKEND_INTERNAL_URL", "http://backend:3000")
    token = os.getenv("INTERNAL_API_TOKEN", "")
    if not token:
        return False
    try:
        with httpx.Client(timeout=5.0) as c:
            r = c.post(f"{base}{path}", headers={"X-Internal-Token": token}, json=payload)
            return r.status_code < 400
    except Exception:
        return False


@router.post("/messages", response_model=ChatResponse)
async def chat_messages(req: ChatRequest) -> ChatResponse:
    context = [{"role": "system", "content": SYSTEM_PROMPT}] + [m.model_dump() for m in req.messages]
    reply = _generate_reply(context)
    # Heuristic tool use: if user provided targeting details, persist and trigger fetch
    last_user = next((m.content for m in req.messages[::-1] if m.role == 'user'), "")
    if last_user:
        filters = _extract_filters(last_user)
        # Save profile free text
        _post_internal(
            "/api/v1/internal/profile_update",
            {"account_id": req.account_id, "profile": {"questionnaire": {"free_text": last_user}}},
        )
        if any(filters.values()):
            _post_internal(
                "/api/v1/internal/apollo_fetch",
                {"account_id": req.account_id, "filters": filters},
            )
            reply = (
                "Thanks — I saved your preferences and started fetching leads. "
                "You can refine industry, roles, or geography to improve results."
            )
    return ChatResponse(reply=reply, session_id=req.session_id)
