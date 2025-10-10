import os
import json
import time
from typing import List, Dict, Optional

import httpx
from fastapi import APIRouter, Request, HTTPException

from .i18n import normalize_locale, t
from .schemas import ChatRequest, ChatResponse


# Initialize OpenAI chat model (required; no non-AI mode)
USE_OPENAI = bool(os.getenv("OPENAI_API_KEY"))
llm = None
if USE_OPENAI:
    try:
        from langchain_openai import ChatOpenAI
        from langchain.tools import StructuredTool
        from pydantic import BaseModel, Field
        from langchain.schema import HumanMessage, SystemMessage, AIMessage
        from langchain_core.messages import ToolMessage

        llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), temperature=0.2)
    except Exception:
        llm = None


router = APIRouter(prefix="/chat", tags=["chat"])


def system_prompt(locale: str) -> str:
    base = t('system_prompt', locale)
    suffix = (
        " You have tools: db_preview_leads, discover_leads, chat_notify, profile_update, close_chat. "
        "When the user provides targeting (role, location, keywords), call db_preview_leads(limit=5) first. "
        "If preview is empty or they want more, call discover_leads. "
        "After tools, call chat_notify with 3–5 bullets (name — company — email) and end with a concise assistant message."
    )
    return f"{base} {suffix}"


# Internal API utilities -------------------------------------------------------

def _candidate_tokens() -> List[str]:
    primary = os.getenv("INTERNAL_API_TOKEN")
    env = (os.getenv("PYTHON_ENV") or os.getenv("APP_ENV") or os.getenv("RAILS_ENV") or "").lower()
    dev_default_allowed = (not env) or env != "production"
    out: List[str] = []
    if primary:
        out.append(primary)
    if dev_default_allowed:
        out.append("dev-internal-token")
    # de-dupe
    seen = set()
    uniq: List[str] = []
    for c in out:
        if c and c not in seen:
            seen.add(c)
            uniq.append(c)
    return uniq or [""]


def _backend_bases() -> List[str]:
    candidates = [
        os.getenv("BACKEND_INTERNAL_URL"),
        os.getenv("BACKEND_URL"),
        "http://backend:3000",
        "http://localhost:3000",
    ]
    seen = set()
    bases: List[str] = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            bases.append(c)
    return bases


def _post_internal(path: str, payload: Dict) -> tuple[bool, int]:
    tokens = _candidate_tokens()
    if not any(tokens):
        return (False, 0)
    for base in _backend_bases():
        for token in tokens:
            try:
                with httpx.Client(timeout=5.0) as c:
                    url = f"{base}{path}"
                    r = c.post(url, headers={"X-Internal-Token": token}, json=payload)
                    if 200 <= r.status_code < 400:
                        return (True, r.status_code)
                    if r.status_code == 403:
                        continue
            except Exception:
                continue
    return (False, 403 if any(tokens) else -1)


def _post_internal_json(path: str, payload: Dict) -> tuple[bool, int, Dict]:
    tokens = _candidate_tokens()
    if not any(tokens):
        return (False, 0, {})
    for base in _backend_bases():
        for token in tokens:
            try:
                with httpx.Client(timeout=5.0) as c:
                    url = f"{base}{path}"
                    r = c.post(url, headers={"X-Internal-Token": token}, json=payload)
                    if 200 <= r.status_code < 400:
                        try:
                            return (True, r.status_code, r.json())
                        except Exception:
                            return (True, r.status_code, {})
                    if r.status_code == 403:
                        continue
            except Exception:
                continue
    return (False, 403 if any(tokens) else -1, {})


# Discovery de-duplication to avoid spamming ----------------------------------
_RECENT_DISCOVERY: dict[str, float] = {}
_DISCOVERY_TTL_SECONDS = 120.0


def _discovery_key(account_id: int, session_id: str, filters: Dict[str, str]) -> str:
    role = (filters.get('role') or '').lower()
    loc = (filters.get('location') or '').lower()
    kw = (filters.get('keywords') or '').lower()
    return f"{account_id}:{session_id}:{role}:{loc}:{kw}"


def _queue_discovery_once(account_id: int, session_id: str, filters: Dict[str, str]) -> tuple[bool, bool, int, Dict]:
    now = time.time()
    key = _discovery_key(account_id, session_id, filters)
    ts = _RECENT_DISCOVERY.get(key)
    if ts and (now - ts) < _DISCOVERY_TTL_SECONDS:
        return (False, True, 200, {})
    # In dev, run sync for snappier UX
    sync = (os.getenv("PYTHON_ENV") or os.getenv("APP_ENV") or os.getenv("RAILS_ENV") or "").lower() != "production"
    ok, status, body = _post_internal_json(
        "/api/v1/internal/discover_leads",
        {"account_id": account_id, "filters": filters, "sync": sync},
    )
    if ok:
        _RECENT_DISCOVERY[key] = now
    return (ok, False, status, body or {})


# Tools exposed to the LLM -----------------------------------------------------

def _make_tools(account_id: int, session_id: str, locale: str):
    if llm is None:
        return []
    from langchain.tools import StructuredTool
    from pydantic import BaseModel, Field

    class Filters(BaseModel):
        keywords: Optional[str] = Field(default=None)
        role: Optional[str] = Field(default=None)
        location: Optional[str] = Field(default=None)

    class PreviewInput(Filters):
        limit: int = Field(default=5, ge=1, le=10)

    class DiscoverInput(Filters):
        pass

    class NotifyInput(BaseModel):
        content: str

    class ProfileInput(BaseModel):
        free_text: str

    def _format_bullets(rows: list[dict], limit: int = 5) -> str:
        bullets = []
        for r in (rows or [])[:limit]:
            name = ((str(r.get('first_name') or '') + ' ' + str(r.get('last_name') or '')).strip()) or '(No name)'
            line = f"- {name} — {r.get('company') or ''} — {r.get('email') or ''}"
            bullets.append(line)
        return "\n".join(bullets)

    def tool_db_preview(filters: PreviewInput) -> dict:
        ok, status, data = _post_internal_json(
            "/api/v1/internal/db_preview_leads",
            {"account_id": account_id, "filters": filters.model_dump(exclude_none=True), "limit": filters.limit},
        )
        if ok and isinstance(data, dict):
            return {"status": "ok", "total": data.get("total", 0), "results": data.get("results", [])}
        return {"status": "error", "code": status}

    def tool_discover(inp: DiscoverInput) -> dict:
        filters = inp.model_dump(exclude_none=True)
        queued, duplicate, queued_status, body = _queue_discovery_once(account_id, session_id, filters)
        out = {"queued": queued, "duplicate": duplicate, "status": queued_status}
        if isinstance(body, dict) and body.get("sample"):
            out["sample"] = body.get("sample")
        return out

    def tool_chat_notify(inp: NotifyInput) -> dict:
        ok, status = _post_internal(
            "/api/v1/internal/chat_notify",
            {"account_id": account_id, "chat_session_id": session_id, "content": inp.content},
        )
        return {"status": "ok" if ok else "error", "code": status}

    def tool_close_chat() -> dict:
        ok, status = _post_internal(
            "/api/v1/internal/close_chat",
            {"account_id": account_id, "chat_session_id": session_id},
        )
        return {"status": "ok" if ok else "error", "code": status}

    def tool_profile_update(inp: ProfileInput) -> dict:
        ok, status = _post_internal(
            "/api/v1/internal/profile_update",
            {"account_id": account_id, "profile": {"questionnaire": {"free_text": inp.free_text}}},
        )
        return {"status": "ok" if ok else "error", "code": status}

    return [
        StructuredTool.from_function(
            name="db_preview_leads",
            description="Preview leads from the user's database.",
            func=tool_db_preview,
            args_schema=PreviewInput,
        ),
        StructuredTool.from_function(
            name="discover_leads",
            description="Discover more leads via external providers (Apollo/HubSpot/Salesforce).",
            func=tool_discover,
            args_schema=DiscoverInput,
        ),
        StructuredTool.from_function(
            name="chat_notify",
            description="Post a message into the chat (use to share bullet lists).",
            func=tool_chat_notify,
            args_schema=NotifyInput,
        ),
        StructuredTool.from_function(
            name="close_chat",
            description="Mark the chat session as completed when user is satisfied.",
            func=tool_close_chat,
        ),
        StructuredTool.from_function(
            name="profile_update",
            description="Save user preferences in profile questionnaire.free_text.",
            func=tool_profile_update,
            args_schema=ProfileInput,
        ),
    ]


def _ai_orchestrate_reply(req: ChatRequest, locale: str) -> str:
    if llm is None:
        raise HTTPException(status_code=503, detail={"error": "llm_unavailable"})

    # Build messages with clear system guidance
    from langchain.schema import HumanMessage, SystemMessage, AIMessage
    from langchain_core.messages import ToolMessage

    msgs = [SystemMessage(content=system_prompt(locale))]
    for m in req.messages:
        if m.role == 'user':
            msgs.append(HumanMessage(content=m.content))
        elif m.role == 'assistant':
            msgs.append(AIMessage(content=m.content))
        else:
            # ignore other roles
            pass

    tools = _make_tools(req.account_id, req.session_id, locale)
    try:
        model = llm.bind_tools(tools)
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "llm_bind_failed", "message": str(e)[:200]})

    # Store last user free text as profile context
    try:
        last_user = next((m.content for m in req.messages[::-1] if m.role == 'user'), "")
        if last_user:
            _post_internal(
                "/api/v1/internal/profile_update",
                {"account_id": req.account_id, "profile": {"questionnaire": {"free_text": last_user}}},
            )
    except Exception:
        pass

    # Agent loop (no heuristic fallbacks)
    for _ in range(6):
        try:
            res = model.invoke(msgs)
        except Exception as e:
            raise HTTPException(status_code=503, detail={"error": "llm_invoke_failed", "message": str(e)[:200]})
        if not getattr(res, "tool_calls", None):
            return getattr(res, "content", "")
        # Append assistant with tool_calls
        msgs.append(res)
        # Execute tools
        for call in res.tool_calls:
            # Tool call structure differs by SDK version; support dict/obj
            name = call.get("name") if isinstance(call, dict) else getattr(call, "name", None)
            args = call.get("args") if isinstance(call, dict) else getattr(call, "args", {})
            call_id = call.get("id") if isinstance(call, dict) else getattr(call, "id", name or "tool")
            tool = next((t for t in tools if getattr(t, "name", None) == name), None)
            if not tool:
                msgs.append(ToolMessage(content=json.dumps({"error": "unknown_tool", "name": name}), tool_call_id=call_id))
                continue
            try:
                result = tool.invoke(args or {})
            except Exception as e:
                result = {"status": "error", "message": str(e)}
            try:
                payload = json.dumps(result)
            except Exception:
                payload = json.dumps({"status": "error", "message": "unserializable tool result"})
            msgs.append(ToolMessage(content=payload[:4000], tool_call_id=call_id))
    # If we reach here, model failed to conclude
    raise HTTPException(status_code=503, detail={"error": "llm_no_conclusion"})


@router.post("/messages", response_model=ChatResponse)
async def chat_messages(req: ChatRequest, request: Request) -> ChatResponse:
    locale = normalize_locale(request.headers.get('accept-language'))
    reply = _ai_orchestrate_reply(req, locale)
    return ChatResponse(reply=reply, session_id=req.session_id)

