import os
import importlib
import types

import pytest


def test_infer_filters_and_prompt(monkeypatch):
    from app import routes_chat as rc
    p = rc.system_prompt('en')
    assert 'tools' in p.lower()
    f = rc._infer_filters('Find CTOs in US for SaaS and AI')
    assert f['role'] == 'CTO'
    assert f['location'] == 'United States'
    assert 'saas' in f['keywords'] and 'ai' in f['keywords']


def test_post_internal_no_tokens(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, '_candidate_tokens', lambda: [''])
    ok, code = rc._post_internal('/x', {})
    assert ok is False and code == 0


def test_post_internal_all_fail(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, '_candidate_tokens', lambda: ['t'])
    monkeypatch.setattr(rc, '_backend_bases', lambda: ['http://a'])

    class C:
        def __init__(self, timeout=None):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *a):
            return False
        class R:
            def __init__(self):
                self.status_code = 500
        def post(self, *a, **k):
            return self.R()

    monkeypatch.setattr(rc.httpx, 'Client', C)
    ok, code = rc._post_internal('/x', {})
    assert ok is False and code == 403


def test_post_internal_json_jsonerror(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, '_candidate_tokens', lambda: ['t'])
    monkeypatch.setattr(rc, '_backend_bases', lambda: ['http://a'])

    class C:
        def __init__(self, timeout=None):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *a):
            return False
        class R:
            status_code = 200
            def json(self):
                raise ValueError('bad')
        def post(self, *a, **k):
            return self.R()

    monkeypatch.setattr(rc.httpx, 'Client', C)
    ok, code, data = rc._post_internal_json('/x', {})
    assert ok is True and code == 200 and data == {}


def test_reload_with_openai_env(monkeypatch):
    # Ensure OPENAI branch executes without using network
    monkeypatch.setenv('OPENAI_API_KEY', 'x')
    import app.routes_chat as rc
    importlib.reload(rc)
    # llm is allowed to be None if imports fail, but reaching here covers import branch
    assert hasattr(rc, 'USE_OPENAI')
    # Reset
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    importlib.reload(rc)


def test_make_tools_and_call_tool_functions(monkeypatch):
    from app import routes_chat as rc
    # Pretend LLM exists so _make_tools returns tools
    monkeypatch.setattr(rc, 'llm', object())

    # Capture posted notifications and json posts
    posted = []
    def fake_post_json(path, payload):
        posted.append(('json', path, payload))
        if path.endswith('/db_preview_leads'):
            return True, 200, {'total': 2, 'results': [
                {'first_name': 'Ava', 'last_name': 'Lee', 'company': 'Acme', 'email': 'ava@example.com'},
                {'first_name': 'Bo', 'last_name': 'Z', 'company': 'Beta', 'email': 'bo@ex.com'},
            ]}
        if path.endswith('/lead_packs'):
            return True, 200, {'lead_pack': {'id': 1, 'name': 'P1'}}
        return True, 200, {}
    def fake_post(path, payload):
        posted.append(('post', path, payload))
        return True, 200
    monkeypatch.setattr(rc, '_post_internal_json', fake_post_json)
    monkeypatch.setattr(rc, '_post_internal', fake_post)

    tools = rc._make_tools(1, 's1', 'en')
    by_name = {getattr(t, 'name'): t for t in tools}
    # db_preview_leads (call underlying func with args_schema instance)
    P = by_name['db_preview_leads'].args_schema
    res = by_name['db_preview_leads'].func(P(keywords='saas', role='CTO', limit=5))
    assert res['status'] == 'ok' and res['total'] == 2
    # chat_notify
    N = by_name['chat_notify'].args_schema
    out = by_name['chat_notify'].func(N(content='Hi'))
    assert out['status'] == 'ok'
    # close_chat
    out = by_name['close_chat'].invoke({})
    assert out['status'] == 'ok'
    # profile_update
    PF = by_name['profile_update'].args_schema
    out = by_name['profile_update'].func(PF(free_text='hello'))
    assert out['status'] == 'ok'
    # create_lead_pack
    PK = by_name['create_lead_pack'].args_schema
    out = by_name['create_lead_pack'].func(PK(lead_ids=[1,2,3], name='P1'))
    assert out['status'] == 'ok' and 'pack' in out
    # error path when neither lead_ids nor filters provided
    err = by_name['create_lead_pack'].func(PK())
    assert err['status'] == 'error' and err['code'] == 400


def test_server_assist_preview_discover_apollo(monkeypatch):
    import app.routes_chat as rc

    class LLM:
        def bind_tools(self, tools, tool_choice=None):
            self._tools = tools
            return self
        def invoke(self, messages):
            # Force no tool_calls so server-assist path triggers
            return types.SimpleNamespace(tool_calls=None, content='')

    # preview with results
    calls = []
    def post_json_preview(path, payload):
        calls.append(('json', path))
        if path.endswith('/db_preview_leads'):
            return True, 200, {'total': 1, 'results': [{'first_name': 'A', 'last_name': 'B', 'company': 'C', 'email': 'e@x'}]}
        return True, 200, {}
    monkeypatch.setattr(rc, '_post_internal_json', post_json_preview)
    monkeypatch.setattr(rc, '_post_internal', lambda *a, **k: (True, 200))
    monkeypatch.setattr(rc, 'llm', LLM())
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'find cto in us for saas'}]})
    assert r.status_code == 200 and 'preview' in r.json()['reply'].lower()

    # preview empty -> discover sample
    def post_json_discover(path, payload):
        calls.append(('json', path))
        if path.endswith('/db_preview_leads'):
            return True, 200, {'total': 0, 'results': []}
        if path.endswith('/apollo_fetch'):
            return True, 200, {}
        return True, 200, {}
    monkeypatch.setattr(rc, '_post_internal_json', post_json_discover)
    monkeypatch.setattr(rc, '_queue_discovery_once', lambda a, s, f: (True, False, 200, {'sample': [{'first_name': 'X'}]}))
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'find cto us'}]})
    assert r.status_code == 200 and 'posted' in r.json()['reply'].lower()

    # preview empty -> discover empty -> apollo sample
    def post_json_apollo(path, payload):
        calls.append(('json', path))
        if path.endswith('/db_preview_leads'):
            return True, 200, {'total': 0, 'results': []}
        if path.endswith('/apollo_fetch'):
            return True, 200, {'sample': [{'first_name': 'Y'}]}
        return True, 200, {}
    monkeypatch.setattr(rc, '_post_internal_json', post_json_apollo)
    monkeypatch.setattr(rc, '_queue_discovery_once', lambda a, s, f: (False, False, 500, {}))
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'find cto in us'}]})
    assert r.status_code == 200 and 'apollo' in r.json()['reply'].lower()


def test_second_bind_required_branch(monkeypatch):
    import app.routes_chat as rc
    class LLM:
        def __init__(self):
            self.calls = 0
        def bind_tools(self, tools, tool_choice=None):
            # Count how many times required binding is attempted
            if tool_choice == 'required':
                self.calls += 1
            return self
        def invoke(self, messages):
            # first iterations produce no tool_calls; finalize returns content
            if self.calls < 2:
                return types.SimpleNamespace(tool_calls=None)
            return types.SimpleNamespace(tool_calls=None, content='final')
    monkeypatch.setattr(rc, 'llm', LLM())
    monkeypatch.setattr(rc, '_post_internal', lambda *a, **k: (True, 200))
    monkeypatch.setattr(rc, '_post_internal_json', lambda *a, **k: (True, 200, {}))
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'find cto us saas'}]})
    assert r.status_code == 200 and r.json()['reply'] == 'final'
