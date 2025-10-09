import os
from fastapi import APIRouter, Request, HTTPException
from .schemas import ChatRequest, ChatResponse
from typing import List, Dict, Optional
import httpx
from .i18n import normalize_locale, t
import time
import json
from dataclasses import dataclass
import random

USE_OPENAI = bool(os.getenv("OPENAI_API_KEY"))
LLM_STRICT = (os.getenv("LLM_STRICT", "").lower() == "true")
llm = None
if USE_OPENAI:
    try:
        from langchain_openai import ChatOpenAI
        from langchain.tools import StructuredTool
        from pydantic import BaseModel, Field
        from langchain.schema import HumanMessage, SystemMessage, AIMessage
        from langchain_core.messages import ToolMessage

        llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), temperature=0.2)
    except Exception as e:
        # Fallback if openai not configured properly
        llm = None

router = APIRouter(prefix="/chat", tags=["chat"])


def system_prompt(locale: str) -> str:
    return t('system_prompt', locale)


def _varied(key: str, locale: str, alts: List[str] | None = None) -> str:
    base = t(key, locale)
    options = [base]
    if alts:
        options.extend([a for a in alts if a and a not in options])
    return random.choice(options)


def _generate_reply(messages: List[Dict], locale: str) -> str:
    if llm is not None:
        # If OpenAI is configured but we didn't pass account/session context,
        # do a simple non-tool call generation.
        try:
            from langchain.schema import HumanMessage, SystemMessage, AIMessage

            def to_lc(m: Dict):
                if m["role"] == "system":
                    return SystemMessage(content=m["content"])
                if m["role"] == "assistant":
                    return AIMessage(content=m["content"])
                return HumanMessage(content=m["content"])

            lc_messages = [to_lc(m) for m in messages]
            result = llm.invoke(lc_messages)
            return getattr(result, "content", t('ask_missing', locale))
        except Exception:
            # fall back to heuristic
            pass
    # If OpenAI is configured, you could swap in LangChain/OpenAI here.
    # To keep this service portable, reply with a lightweight heuristic.
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    if not last_user:
        # Slight phrasing variety so it feels less robotic in fallback
        starts = [
            t('ask_start', locale),
            t('ask_missing', locale),
        ]
        return random.choice(starts)

    # Lightweight conversational fallback: acknowledge targets if we can infer them,
    # then ask for keywords. Otherwise, ask for missing details with slight variety.
    lower = last_user.lower()
    filters = _extract_filters(last_user)
    if any(filters.values()):
        prefaces = ["Got it —", "Noted —", "Great —"]
        parts: list[str] = []
        role = filters.get("role") or ""
        loc = filters.get("location") or ""
        if role:
            parts.append(role.upper())
        if loc:
            parts.append(loc)
        target = ", ".join(parts)
        # Keep the second sentence localized
        if target:
            return f"{random.choice(prefaces)} targeting {target}. " + t('ask_keywords', locale)
        return t('ask_keywords', locale)

    # If the user mentions typical targeting hints, keep the conversation moving
    if any(k in lower for k in ["industry", "role", "location", "geo", "size", "company"]):
        return t('ask_keywords', locale)

    # Default prompt (slight variety) when we cannot infer targets
    missing = [
        t('ask_missing', locale),
        t('ask_industry', locale),
    ]
    return random.choice(missing)


def _extract_filters(text: str) -> Dict[str, str]:
    t = text.lower()
    role = 'cto' if 'cto' in t or 'engineering' in t else ('marketing' if 'marketing' in t else '')
    # Normalize to full country names for vendor compatibility
    if 'united states' in t or ' us' in t or 'usa' in t:
        location = 'United States'
    elif 'india' in t:
        location = 'India'
    elif 'united kingdom' in t or ' uk' in t:
        location = 'United Kingdom'
    else:
        location = ''
    keywords = ''
    return {"role": role, "location": location, "keywords": keywords}


def _extract_filters_from_messages(messages: List[Dict]) -> Dict[str, str]:
    """Heuristically infer filters from the full user history.

    Looks across the conversation for role/location/industry hints so that
    short confirmations like "ok" or "go ahead" still trigger discovery.
    """
    role = ''
    location = ''
    kw: list[str] = []
    for m in messages:
        if m.get('role') != 'user':
            continue
        text = (m.get('content') or '').lower()
        if not role and ('cto' in text or 'chief technology officer' in text or 'head of engineering' in text):
            role = 'cto'
        if not location and any(token in text for token in [' us', 'united states', 'usa', ' in us', ' across the us']):
            location = 'us'
        if any(word in text for word in ['it', 'software', 'saas', 'tech industry', 'technology']):
            kw.extend(['it', 'software', 'saas'])
    keywords = ' '.join(sorted(set(kw)))
    return {"role": role, "location": location, "keywords": keywords}


# Simple in-memory de-duplication for discovery requests per session/filters
_RECENT_DISCOVERY: dict[str, float] = {}
_DISCOVERY_TTL_SECONDS = 120.0

# Conversation lightweight state (phase 1)
_SESSION_STATE: dict[str, dict] = {}


def _get_state(session_id: str) -> dict:
    st = _SESSION_STATE.get(session_id)
    if not st:
        st = {"step": "collecting", "discover_ts": 0.0, "last_filters": {}, "await_kind": None, "phase": "collecting", "db_empty_ts": 0.0}
        _SESSION_STATE[session_id] = st
    return st


def _discovery_key(account_id: int, session_id: str, filters: Dict[str, str]) -> str:
    role = (filters.get('role') or '').lower()
    loc = (filters.get('location') or '').lower()
    kw = (filters.get('keywords') or '').lower()
    return f"{account_id}:{session_id}:{role}:{loc}:{kw}"


def _queue_discovery_once(account_id: int, session_id: str, filters: Dict[str, str]) -> tuple[bool, bool, int, Dict]:
    """Queue discover_leads, with a short TTL to prevent loops.

    Returns (queued, duplicate, status_code).
    duplicate=True means a recent identical request was suppressed.
    """
    now = time.time()
    key = _discovery_key(account_id, session_id, filters)
    ts = _RECENT_DISCOVERY.get(key)
    if ts and (now - ts) < _DISCOVERY_TTL_SECONDS:
        return (False, True, 200, {})
    # In non-production, optionally run discovery synchronously to make UX snappier
    sync = (os.getenv("PYTHON_ENV") or os.getenv("APP_ENV") or os.getenv("RAILS_ENV") or "").lower() != "production"
    ok, status, body = _post_internal_json(
        "/api/v1/internal/discover_leads",
        {"account_id": account_id, "filters": filters, "sync": sync},
    )
    if ok:
        _RECENT_DISCOVERY[key] = now
    return (ok, False, status, body or {})


def _candidate_tokens() -> List[str]:
    """Return possible tokens to try for internal auth.

    Order: explicit env token (if set), then dev default.
    """
    primary = os.getenv("INTERNAL_API_TOKEN")
    env = (os.getenv("PYTHON_ENV") or os.getenv("APP_ENV") or os.getenv("RAILS_ENV") or "").lower()
    dev_default_allowed = (not env) or env != "production"
    candidates = []
    if primary:
        candidates.append(primary)
    if dev_default_allowed:
        candidates.append("dev-internal-token")
    # de-duplicate while preserving order
    out = []
    seen = set()
    for c in candidates:
        if c and c not in seen:
            out.append(c)
            seen.add(c)
    return out or [""]


def _backend_bases() -> List[str]:
    # Order of preference; de-duplicate while preserving order
    candidates = [
        os.getenv("BACKEND_INTERNAL_URL"),
        os.getenv("BACKEND_URL"),
        "http://backend:3000",
        "http://localhost:3000",
    ]
    seen = set()
    bases = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            bases.append(c)
    return bases


def _post_internal(path: str, payload: Dict) -> tuple[bool, int]:
    """Post to backend internal API.

    Returns (ok, status_code). status_code is 0 if token missing, -1 on network error.
    """
    tokens = _candidate_tokens()
    if not any(tokens):
        return (False, 0)
    debug = os.getenv("LLM_DEBUG_INTERNAL")
    for base in _backend_bases():
        for token in tokens:
            try:
                with httpx.Client(timeout=5.0) as c:
                    url = f"{base}{path}"
                    r = c.post(url, headers={"X-Internal-Token": token}, json=payload)
                    if debug:
                        print(f"LLM internal POST {url} -> {r.status_code}")
                    if 200 <= r.status_code < 400:
                        return (True, r.status_code)
                    if r.status_code == 403:
                        # try next token; if none left, surface 403
                        continue
                    # for other codes (404/5xx), try next base
            except Exception as e:
                if debug:
                    print(f"LLM internal POST {base}{path} error: {e}")
                # network error — try next base
                continue
        # if we exhausted tokens for this base and hit at least one 403, report 403
        # otherwise continue to next base
    # If we reached here, either bases unreachable or tokens invalid
    # Prefer 403 if we had at least one token candidate
    return (False, 403 if any(tokens) else -1)
    return (False, -1)


def _post_internal_json(path: str, payload: Dict) -> tuple[bool, int, Dict]:
    tokens = _candidate_tokens()
    if not any(tokens):
        return (False, 0, {})
    debug = os.getenv("LLM_DEBUG_INTERNAL")
    for base in _backend_bases():
        for token in tokens:
            try:
                with httpx.Client(timeout=5.0) as c:
                    url = f"{base}{path}"
                    r = c.post(url, headers={"X-Internal-Token": token}, json=payload)
                    if debug:
                        print(f"LLM internal POST {url} -> {r.status_code}")
                    if 200 <= r.status_code < 400:
                        data = {}
                        try:
                            data = r.json()
                        except Exception:
                            data = {}
                        return (True, r.status_code, data)
                    if r.status_code == 403:
                        continue
            except Exception as e:
                if debug:
                    print(f"LLM internal POST {base}{path} error: {e}")
                continue
    return (False, 403 if any(tokens) else -1, {})


def _make_tools(account_id: int, session_id: str, locale: str):
    """Define tool functions that call backend internal endpoints.

    These are exposed to the LLM (when available) so it can orchestrate actions.
    """
    if llm is None:
        return []

    from langchain.tools import StructuredTool
    from pydantic import BaseModel, Field

    class Filters(BaseModel):
        keywords: Optional[str] = Field(default=None, description="Keyword string, e.g., 'saas ai'")
        role: Optional[str] = Field(default=None, description="Target job title, e.g., 'CTO'")
        location: Optional[str] = Field(default=None, description="Preferred location or country, e.g., 'United States'")

    class PreviewInput(Filters):
        limit: int = Field(default=5, ge=1, le=10, description="Max rows to preview from DB (1-10)")

    class DiscoverInput(Filters):
        pass

    class NotifyInput(BaseModel):
        content: str = Field(description="Assistant message to post into the chat (supports bullets)")

    class ProfileInput(BaseModel):
        free_text: str = Field(description="User preference text to store in profile questionnaire.free_text")

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
            description=(
                "Preview potential leads from the user's own database first. "
                "Use this to show a quick sample before deciding to fetch externally. "
                "You MUST summarize results to the user via chat_notify when useful."
            ),
            func=tool_db_preview,
            args_schema=PreviewInput,
        ),
        StructuredTool.from_function(
            name="discover_leads",
            description=(
                "Fetch more leads using external providers via the backend (Apollo, HubSpot, Salesforce). "
                "Call this when DB preview is empty or the user wants more. "
                "After a successful fetch, summarize a few leads via chat_notify."
            ),
            func=tool_discover,
            args_schema=DiscoverInput,
        ),
        StructuredTool.from_function(
            name="chat_notify",
            description=(
                "Post a message in the chat visible to the user. "
                "Use this to share bullets of found leads or confirm actions."
            ),
            func=tool_chat_notify,
            args_schema=NotifyInput,
        ),
        StructuredTool.from_function(
            name="close_chat",
            description=(
                "Mark the current chat session as completed when the user is satisfied."
            ),
            func=tool_close_chat,
        ),
        StructuredTool.from_function(
            name="profile_update",
            description=(
                "Save free-form user preferences to their profile for future context."
            ),
            func=tool_profile_update,
            args_schema=ProfileInput,
        ),
    ]


def _ai_orchestrate_reply(req: ChatRequest, locale: str) -> str:
    """Run an agentic loop with tools so the model can act autonomously.

    Falls back to heuristic if llm/tools unavailable.
    """
    if llm is None:
        if LLM_STRICT:
            raise HTTPException(status_code=503, detail={"error": "llm_unavailable"})
        # Fallback to heuristic
        context = [{"role": "system", "content": system_prompt(locale)}] + [m.model_dump() for m in req.messages]
        return _generate_reply(context, locale)

    # Build messages with an extra system instruction to use tools thoughtfully
    from langchain.schema import HumanMessage, SystemMessage, AIMessage
    from langchain_core.messages import ToolMessage

    sys_msgs = [
        SystemMessage(content=system_prompt(locale)),
        SystemMessage(content=(
            "You have tools to preview DB leads, discover external leads (Apollo/HubSpot/Salesforce), "
            "post messages back to the chat, update profile, and close the chat. "
            "Use tools when they help. Share concise bullets when showing leads."
        )),
    ]
    def to_lc(m: Dict):
        if m["role"] == "system":
            return SystemMessage(content=m["content"])
        if m["role"] == "assistant":
            return AIMessage(content=m["content"])
        return HumanMessage(content=m["content"])

    msgs = sys_msgs + [to_lc(m.model_dump()) for m in req.messages]
    tools = _make_tools(req.account_id, req.session_id, locale)
    try:
        model = llm.bind_tools(tools)
    except Exception as e:
        if LLM_STRICT:
            raise HTTPException(status_code=503, detail={"error": "llm_bind_failed", "message": str(e)[:200]})
        # If binding tools fails (e.g., incompatible SDK), fallback to simple generation
        context = [{"role": "system", "content": system_prompt(locale)}] + [m.model_dump() for m in req.messages]
        return _generate_reply(context, locale)

    # Save the last user message into profile as lightweight memory
    try:
        last_user = next((m.content for m in req.messages[::-1] if m.role == 'user'), "")
        if last_user:
            _post_internal(
                "/api/v1/internal/profile_update",
                {"account_id": req.account_id, "profile": {"questionnaire": {"free_text": last_user}}},
            )
    except Exception:
        pass

    def _tc_get(call, key: str, default=None):
        if isinstance(call, dict):
            return call.get(key, default)
        return getattr(call, key, default)

    for _ in range(4):  # small, safe loop
        try:
            res = model.invoke(msgs)
        except Exception as e:
            # Model invocation failed (e.g., invalid/missing key)
            if LLM_STRICT:
                raise HTTPException(status_code=503, detail={"error": "llm_invoke_failed", "message": str(e)[:200]})
            context = [{"role": "system", "content": system_prompt(locale)}] + [m.model_dump() for m in req.messages]
            return _generate_reply(context, locale)
        # If the model returned a final answer
        if not getattr(res, "tool_calls", None):
            return getattr(res, "content", t('ask_missing', locale))
        # Append the assistant message containing tool_calls, as required by OpenAI
        msgs.append(res)
        # Execute each tool call and append ToolMessage
        for call in res.tool_calls:
            try:
                name = _tc_get(call, "name")
                args = _tc_get(call, "args") or {}
                call_id = _tc_get(call, "id") or name or "tool"
            except Exception:
                # Malformed tool call; let model recover
                msgs.append(ToolMessage(content=json.dumps({"error": "malformed_tool_call"}), tool_call_id="malformed"))
                continue
            # Find the tool by name
            tool = next((t for t in tools if getattr(t, "name", None) == name), None)
            if not tool:
                # Unknown tool; surface gentle error so model can recover
                msgs.append(ToolMessage(content=json.dumps({"error": "unknown_tool", "name": name}), tool_call_id=call_id))
                continue
            try:
                result = tool.invoke(args)
            except Exception as e:
                result = {"status": "error", "message": str(e)}
            # Ensure short payload back to the model
            compact = result
            try:
                payload = json.dumps(compact)
            except Exception:
                payload = json.dumps({"status": "error", "message": "unserializable tool result"})
            msgs.append(ToolMessage(content=payload[:4000], tool_call_id=call_id))
        # continue loop for model to reflect tool outputs
    # Safety fallback answer if we reached max iterations
    if LLM_STRICT:
        raise HTTPException(status_code=503, detail={"error": "llm_no_conclusion"})
    return t('ask_missing', locale)


@router.post("/messages", response_model=ChatResponse)
async def chat_messages(req: ChatRequest, request: Request) -> ChatResponse:
    locale = normalize_locale(request.headers.get('accept-language'))
    # Prefer AI-orchestrated flow (strict mode may error if LLM unavailable)
    if llm is not None or LLM_STRICT:
        reply = _ai_orchestrate_reply(req, locale)
    else:
        context = [{"role": "system", "content": system_prompt(locale)}] + [m.model_dump() for m in req.messages]
        reply = _generate_reply(context, locale)
    # If AI tools produced the reply, return immediately to avoid duplicate heuristics.
    if llm is not None or LLM_STRICT:
        return ChatResponse(reply=reply, session_id=req.session_id)

    # Legacy heuristic path (kept for environments without AI tools).
    st = _get_state(req.session_id)
    last_user = next((m.content for m in req.messages[::-1] if m.role == 'user'), "")
    if last_user and st.get("step") == "await_confirmation":
        lower = last_user.lower()
        kind = st.get("await_kind")
        yes_words = ["yes", "y", "yeah", "yep", "sure", "ok", "okay", "please do"]
        more_words = ["no", "more", "not enough", "find more", "keep searching", "external", "fetch more", "apollo", "apollo.io"]
        if kind == "satisfied":
            if any(w in lower for w in yes_words + ["looks good", "good", "great", "satisfied", "close", "done"]):
                _post_internal("/api/v1/internal/close_chat", {"account_id": req.account_id, "chat_session_id": req.session_id})
                st["step"] = "completed"
                return ChatResponse(reply=_varied('closing', locale, [
                    "All set — closing this chat now. Start another anytime.",
                    "Great, I’ll close this session. You can reopen or start fresh whenever."
                ]), session_id=req.session_id)
            if any(w in lower for w in more_words):
                # Queue external sources now, but suppress repeats for a short window
                history_filters = st.get("last_filters") or _extract_filters_from_messages([m.model_dump() for m in req.messages])
                queued, duplicate, queued_status, body = _queue_discovery_once(req.account_id, req.session_id, history_filters)
                if queued and not duplicate:
                    st["discover_ts"] = time.time()
                    st["step"] = "collecting"
                    st["phase"] = "external_fetching"
                    # If we have a sample of leads, push a follow-up assistant message to the chat
                    sample = body.get("sample") if isinstance(body, dict) else None
                    if isinstance(sample, list) and sample:
                        bullets = []
                        for r in sample[:5]:
                            name = ((r.get('first_name') or '') + ' ' + (r.get('last_name') or '')).strip()
                            line = f"- {name or '(No name)'} — {r.get('company') or ''} — {r.get('email') or ''}"
                            bullets.append(line)
                        _post_internal(
                            "/api/v1/internal/chat_notify",
                            {"account_id": req.account_id, "chat_session_id": req.session_id, "content": "New leads found:\n" + "\n".join(bullets)},
                        )
                    st["phase"] = "external_done"
                    return ChatResponse(reply=_varied('shared_new_leads', locale, [
                        "I’ve shared some new leads above. Want me to keep going or refine the target?",
                        "Posted a few fresh leads. Should I fetch more or tweak filters?"
                    ]), session_id=req.session_id)
                if duplicate or (time.time() - st.get("discover_ts", 0)) < _DISCOVERY_TTL_SECONDS:
                    return ChatResponse(reply=_varied('already_fetching', locale, [
                        "On it — already fetching more in the background.",
                        "Working on it — pulling additional leads now."
                    ]), session_id=req.session_id)
        elif kind == "external_offer":
            if any(w in lower for w in yes_words + ["search", "go ahead", "do it", "fetch", "apollo", "apollo.io"]):
                filters = st.get("last_filters") or _extract_filters_from_messages([m.model_dump() for m in req.messages])
                queued, duplicate, queued_status, body = _queue_discovery_once(req.account_id, req.session_id, filters)
                if queued and not duplicate:
                    st["discover_ts"] = time.time()
                    st["step"] = "collecting"
                    st["phase"] = "external_fetching"
                    sample = body.get("sample") if isinstance(body, dict) else None
                    if isinstance(sample, list) and sample:
                        bullets = []
                        for r in sample[:5]:
                            name = ((r.get('first_name') or '') + ' ' + (r.get('last_name') or '')).strip()
                            line = f"- {name or '(No name)'} — {r.get('company') or ''} — {r.get('email') or ''}"
                            bullets.append(line)
                        _post_internal(
                            "/api/v1/internal/chat_notify",
                            {"account_id": req.account_id, "chat_session_id": req.session_id, "content": "New leads found:\n" + "\n".join(bullets)},
                        )
                    st["phase"] = "external_done"
                    return ChatResponse(reply=_varied('shared_new_leads', locale, [
                        "I’ve shared some new leads above. Want me to keep going or refine the target?",
                        "Posted a few fresh leads. Should I fetch more or tweak filters?"
                    ]), session_id=req.session_id)
                if duplicate or (time.time() - st.get("discover_ts", 0)) < _DISCOVERY_TTL_SECONDS:
                    return ChatResponse(reply=_varied('already_fetching', locale, [
                        "On it — already fetching more in the background.",
                        "Working on it — pulling additional leads now."
                    ]), session_id=req.session_id)
            if any(w in lower for w in ["no", "adjust", "change", "refine", "different", "another"]):
                st["step"] = "collecting"
                return ChatResponse(reply=_varied('ask_industry', locale, [
                    "Which industries should we focus on (e.g., IT, healthcare, finance)?",
                    "What industries should I target — IT, finance, healthcare, something else?"
                ]), session_id=req.session_id)
        # If none matched, fall through to normal handling
    if last_user:
        filters = _extract_filters(last_user)
        if not any(filters.values()):
            # Fall back to scanning full history for targeting details
            history_filters = _extract_filters_from_messages([m.model_dump() for m in req.messages])
            if any(history_filters.values()):
                filters = history_filters
        # Save profile free text
        profile_ok, profile_status = _post_internal(
            "/api/v1/internal/profile_update",
            {"account_id": req.account_id, "profile": {"questionnaire": {"free_text": last_user}}},
        )
        if any(filters.values()):
            # Preview from DB first and ask for satisfaction
            ok, code, data = _post_internal_json(
                "/api/v1/internal/db_preview_leads",
                {"account_id": req.account_id, "filters": filters, "limit": 5},
            )
            if ok and isinstance(data, dict):
                total = data.get("total", 0)
                rows = data.get("results", [])
                st["last_filters"] = filters
                st["step"] = "await_confirmation"
                if total and rows:
                    bullets = []
                    for r in rows[:5]:
                        name = ((r.get('first_name') or '') + ' ' + (r.get('last_name') or '')).strip()
                        line = f"- {name or '(No name)'} — {r.get('company') or ''} — {r.get('email') or ''}"
                        bullets.append(line)
                    reply = t('db_preview_intro', locale) + "\n" + "\n".join(bullets) + "\n" + t('db_satisfied', locale)
                    st["await_kind"] = "satisfied"
                    return ChatResponse(reply=reply, session_id=req.session_id)
                else:
                    # No DB results; ask whether to search external instead of auto-queuing
                    st["await_kind"] = "external_offer"
                    now = time.time()
                    if now - st.get("db_empty_ts", 0.0) > 60:
                        st["db_empty_ts"] = now
                        return ChatResponse(reply=_varied('db_empty_offer_external', locale, [
                            "I didn’t find matches in your database. Want me to search external sources now?",
                            "No clear hits in your DB yet. Should I look externally?"
                        ]), session_id=req.session_id)
                    # If we recently asked the same thing, do not repeat; move to external fetch
                    queued, duplicate, queued_status, body = _queue_discovery_once(req.account_id, req.session_id, filters)
                    if queued and not duplicate:
                        st["discover_ts"] = now
                        st["phase"] = "external_fetching"
                        return ChatResponse(reply=_varied('fetching_more', locale, [
                            "Understood — I’ll fetch more from external sources now.",
                            "Got it — pulling more leads from external providers."
                        ]), session_id=req.session_id)
                    return ChatResponse(reply=_varied('already_fetching', locale, [
                        "On it — already fetching more in the background.",
                        "Working on it — pulling additional leads now."
                    ]), session_id=req.session_id)
            # If preview call failed, keep previous heuristic reply
    return ChatResponse(reply=reply, session_id=req.session_id)
