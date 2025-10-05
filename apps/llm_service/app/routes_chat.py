import os
from fastapi import APIRouter, Request
from .schemas import ChatRequest, ChatResponse
from typing import List, Dict
import httpx
from .i18n import normalize_locale, t
import time

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


def system_prompt(locale: str) -> str:
    return t('system_prompt', locale)


def _generate_reply(messages: List[Dict], locale: str) -> str:
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
            return getattr(result, "content", t('ask_missing', locale))
        except Exception:
            pass
    # If OpenAI is configured, you could swap in LangChain/OpenAI here.
    # To keep this service portable, reply with a lightweight heuristic.
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    if not last_user:
        return t('ask_start', locale)
    # Very simple branching to simulate helpfulness
    lower = last_user.lower()
    if any(k in lower for k in ["industry", "role", "location", "geo", "size", "company"]):
        return t('ask_keywords', locale)
    return t('ask_missing', locale)


def _extract_filters(text: str) -> Dict[str, str]:
    t = text.lower()
    role = 'cto' if 'cto' in t or 'engineering' in t else ('marketing' if 'marketing' in t else '')
    location = 'us' if 'us' in t or 'united states' in t else ('india' if 'india' in t else '')
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
        st = {"step": "collecting", "discover_ts": 0.0, "last_filters": {}, "await_kind": None}
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


@router.post("/messages", response_model=ChatResponse)
async def chat_messages(req: ChatRequest, request: Request) -> ChatResponse:
    locale = normalize_locale(request.headers.get('accept-language'))
    context = [{"role": "system", "content": system_prompt(locale)}] + [m.model_dump() for m in req.messages]
    reply = _generate_reply(context, locale)
    # Heuristic tool use: if user provided targeting details, preview DB, then queue if needed
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
                return ChatResponse(reply=t('closing', locale), session_id=req.session_id)
            if any(w in lower for w in more_words):
                # Queue external sources now, but suppress repeats for a short window
                history_filters = st.get("last_filters") or _extract_filters_from_messages([m.model_dump() for m in req.messages])
                queued, duplicate, queued_status, body = _queue_discovery_once(req.account_id, req.session_id, history_filters)
                if queued and not duplicate:
                    st["discover_ts"] = time.time()
                    st["step"] = "collecting"
                    created = body.get("created") if isinstance(body, dict) else None
                    extra = f" ({created} new leads)" if isinstance(created, int) else ""
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
                    return ChatResponse(reply=t('fetching_more', locale) + extra, session_id=req.session_id)
                if duplicate or (time.time() - st.get("discover_ts", 0)) < _DISCOVERY_TTL_SECONDS:
                    return ChatResponse(reply="On it — already fetching from external sources.", session_id=req.session_id)
        elif kind == "external_offer":
            if any(w in lower for w in yes_words + ["search", "go ahead", "do it", "fetch", "apollo", "apollo.io"]):
                filters = st.get("last_filters") or _extract_filters_from_messages([m.model_dump() for m in req.messages])
                queued, duplicate, queued_status, body = _queue_discovery_once(req.account_id, req.session_id, filters)
                if queued and not duplicate:
                    st["discover_ts"] = time.time()
                    st["step"] = "collecting"
                    created = body.get("created") if isinstance(body, dict) else None
                    extra = f" ({created} new leads)" if isinstance(created, int) else ""
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
                    return ChatResponse(reply=t('fetching_more', locale) + extra, session_id=req.session_id)
                if duplicate or (time.time() - st.get("discover_ts", 0)) < _DISCOVERY_TTL_SECONDS:
                    return ChatResponse(reply="On it — already fetching from external sources.", session_id=req.session_id)
            if any(w in lower for w in ["no", "adjust", "change", "refine", "different", "another"]):
                st["step"] = "collecting"
                return ChatResponse(reply=t('ask_industry', locale), session_id=req.session_id)
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
                    return ChatResponse(reply=t('db_empty_offer_external', locale), session_id=req.session_id)
            # If preview call failed, keep previous heuristic reply
    return ChatResponse(reply=reply, session_id=req.session_id)
