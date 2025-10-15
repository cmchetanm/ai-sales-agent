import os
os.environ.pop("OPENAI_API_KEY", None)  # ensure real model is not used in tests

from fastapi.testclient import TestClient

from app.main import app
from app import routes_chat as rc


class FakeLLM:
    def __init__(self):
        self._tools = []
        self._step = 0

    def bind_tools(self, tools):
        self._tools = tools
        return self

    def invoke(self, messages):
        # Step 0: ask to preview
        if self._step == 0:
            self._step += 1
            return type("Res", (), {
                "tool_calls": [
                    {"name": "db_preview_leads", "args": {"role": "CTO", "location": "United States", "limit": 5}, "id": "t1"}
                ]
            })()
        # Step 1: discover
        elif self._step == 1:
            self._step += 1
            return type("Res", (), {
                "tool_calls": [
                    {"name": "discover_leads", "args": {"role": "CTO", "location": "United States", "keywords": "saas ai"}, "id": "t2"}
                ]
            })()
        # Final answer
        return type("Res", (), {"tool_calls": None, "content": "Shared results."})()


def _patch_internals(monkeypatch):
    def fake_post_json(path: str, payload: dict):
        if path.endswith("/db_preview_leads"):
            return True, 200, {"status": "ok", "total": 0, "results": []}
        if path.endswith("/discover_leads"):
            return True, 200, {"status": "ok", "sample": [{"first_name": "Ava", "last_name": "Lee", "email": "ava@example.com", "company": "Acme"}]}
        return True, 200, {}

    def fake_post(path: str, payload: dict):
        return True, 200

    monkeypatch.setattr(rc, "_post_internal_json", fake_post_json)
    monkeypatch.setattr(rc, "_post_internal", fake_post)


def test_chat_ai_success(monkeypatch):
    _patch_internals(monkeypatch)
    monkeypatch.setattr(rc, "llm", FakeLLM())
    client = TestClient(app)
    resp = client.post("/chat/messages", json={
        "session_id": "s1", "account_id": 1, "user_id": 1,
        "messages": [{"role": "user", "content": "Find CTOs in US for SaaS"}]
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["reply"].startswith("Shared")


def test_chat_ai_unavailable(monkeypatch):
    monkeypatch.setattr(rc, "llm", None)
    client = TestClient(app)
    resp = client.post("/chat/messages", json={
        "session_id": "s2", "account_id": 1, "user_id": 1,
        "messages": [{"role": "user", "content": "hello"}]
    })
    assert resp.status_code == 503


class BindFailLLM:
    def bind_tools(self, tools):
        raise RuntimeError("bind failed")


def test_chat_ai_bind_failure(monkeypatch):
    monkeypatch.setattr(rc, "llm", BindFailLLM())
    client = TestClient(app)
    resp = client.post("/chat/messages", json={
        "session_id": "s3", "account_id": 1, "user_id": 1,
        "messages": [{"role": "user", "content": "anything"}]
    })
    assert resp.status_code == 503


class InvokeFailLLM:
    def bind_tools(self, tools):
        return self

    def invoke(self, messages):
        raise RuntimeError("invoke failed")


def test_chat_ai_invoke_failure(monkeypatch):
    _patch_internals(monkeypatch)
    monkeypatch.setattr(rc, "llm", InvokeFailLLM())
    client = TestClient(app)
    resp = client.post("/chat/messages", json={
        "session_id": "s4", "account_id": 1, "user_id": 1,
        "messages": [{"role": "user", "content": "hi"}]
    })
    assert resp.status_code == 503


def test_queue_discovery_ttl(monkeypatch):
    calls = []

    def fake_post_json(path: str, payload: dict):
        calls.append(payload)
        return True, 200, {"status": "ok"}

    monkeypatch.setattr(rc, "_post_internal_json", fake_post_json)
    ok1, dup1, _, _ = rc._queue_discovery_once(1, "s1", {"role": "cto"})
    ok2, dup2, _, _ = rc._queue_discovery_once(1, "s1", {"role": "cto"})
    assert ok1 is True and dup1 is False
    assert ok2 is False and dup2 is True


def test_candidate_tokens_default(monkeypatch):
    monkeypatch.delenv("INTERNAL_API_TOKEN", raising=False)
    toks = rc._candidate_tokens()
    assert "dev-internal-token" in toks


def test_unknown_tool_call(monkeypatch):
    class L:
        def bind_tools(self, tools):
            self.t = tools
            return self

        def invoke(self, messages):
            # First return an unknown tool, then finalize
            if not hasattr(self, 'x'):
                self.x = 1
                return type("Res", (), {"tool_calls": [{"name": "nonexistent", "args": {}, "id": "u1"}]})()
            return type("Res", (), {"tool_calls": None, "content": "Done"})()

    # Stub internals to be safe
    monkeypatch.setattr(rc, "_post_internal", lambda *a, **k: (True, 200))
    monkeypatch.setattr(rc, "_post_internal_json", lambda *a, **k: (True, 200, {}))
    monkeypatch.setattr(rc, "llm", L())
    client = TestClient(app)
    resp = client.post("/chat/messages", json={
        "session_id": "s5", "account_id": 1, "user_id": 1,
        "messages": [{"role": "user", "content": "find"}]
    })
    assert resp.status_code == 200
    assert resp.json()["reply"] == "Done"


def test_backend_bases_dedupe(monkeypatch):
    monkeypatch.setenv("BACKEND_INTERNAL_URL", "http://backend:3000")
    monkeypatch.setenv("BACKEND_URL", "http://backend:3000")
    bases = rc._backend_bases()
    assert bases.count("http://backend:3000") == 1


def test_post_internal_and_json_fallback(monkeypatch):
    # Force known bases/tokens
    monkeypatch.setattr(rc, "_backend_bases", lambda: ["http://a", "http://b"])
    monkeypatch.setattr(rc, "_candidate_tokens", lambda: ["t1"]) 

    class Resp:
        def __init__(self, code, body=None):
            self.status_code = code
            self._body = body or {}
        def json(self):
            return self._body

    class C:
        def __init__(self, timeout=None):
            self.timeout = timeout
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc, tb):
            return False
        def post(self, url, headers=None, json=None):
            if url.startswith("http://a"):
                return Resp(403)  # unauthorized on first base
            return Resp(200, {"ok": True})

    monkeypatch.setattr(rc.httpx, "Client", C)
    ok, code, data = rc._post_internal_json("/path", {"x": 1})
    assert ok is True and code == 200 and data == {"ok": True}

    # Now both bases 500 -> expect False with 403 (since token exists)
    class C2(C):
        def post(self, url, headers=None, json=None):
            return Resp(500)
    monkeypatch.setattr(rc.httpx, "Client", C2)
    ok, code, data = rc._post_internal_json("/path", {"x": 1})
    assert ok is False and code == 403


def test_llm_no_conclusion(monkeypatch):
    _patch_internals(monkeypatch)
    class LoopLLM:
        def bind_tools(self, tools):
            return self
        def invoke(self, messages):
            return type("Res", (), {"tool_calls": [{"name": "nonexistent", "args": {}, "id": "z"}]})()
    monkeypatch.setattr(rc, "llm", LoopLLM())
    client = TestClient(app)
    resp = client.post("/chat/messages", json={
        "session_id": "s6", "account_id": 1, "user_id": 1,
        "messages": [{"role": "user", "content": "loop"}]
    })
    # Finalize path should produce a 200 with fallback finalization
    assert resp.status_code == 200
    assert resp.json()["reply"] != ""
