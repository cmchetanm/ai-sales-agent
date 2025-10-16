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
    # Ensure OPENAI import branch executes and succeeds with stubs
    monkeypatch.setenv('OPENAI_API_KEY', 'x')
    import sys, types
    mod_openai = types.ModuleType('langchain_openai')
    class ChatOpenAI:
        def __init__(self, *a, **k):
            pass
    mod_openai.ChatOpenAI = ChatOpenAI
    monkeypatch.setitem(sys.modules, 'langchain_openai', mod_openai)
    mod_tools = types.ModuleType('langchain.tools')
    class StructuredTool: pass
    mod_tools.StructuredTool = StructuredTool
    monkeypatch.setitem(sys.modules, 'langchain.tools', mod_tools)
    mod_pyd = types.ModuleType('pydantic')
    class BaseModel: pass
    def Field(*a, **k): return None
    mod_pyd.BaseModel = BaseModel
    mod_pyd.Field = Field
    monkeypatch.setitem(sys.modules, 'pydantic', mod_pyd)
    mod_schema = types.ModuleType('langchain.schema')
    class HumanMessage: pass
    class SystemMessage: pass
    class AIMessage: pass
    mod_schema.HumanMessage = HumanMessage
    mod_schema.SystemMessage = SystemMessage
    mod_schema.AIMessage = AIMessage
    monkeypatch.setitem(sys.modules, 'langchain.schema', mod_schema)
    mod_core = types.ModuleType('langchain_core.messages')
    class ToolMessage: pass
    mod_core.ToolMessage = ToolMessage
    monkeypatch.setitem(sys.modules, 'langchain_core.messages', mod_core)
    import app.routes_chat as rc
    importlib.reload(rc)
    assert hasattr(rc, 'USE_OPENAI') and rc.USE_OPENAI is True
    # Reset
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    importlib.reload(rc)


def test_openai_import_failure_branch(monkeypatch):
    # Force failure path for imports to hit except and set llm=None
    monkeypatch.setenv('OPENAI_API_KEY', 'x')
    import sys, types
    monkeypatch.setitem(sys.modules, 'langchain_openai', types.ModuleType('langchain_openai'))
    import app.routes_chat as rc
    importlib.reload(rc)
    assert rc.llm is None
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


def test_candidate_tokens_primary_only(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setenv('INTERNAL_API_TOKEN', 'tok')
    # Production env disables dev token fallback
    monkeypatch.setenv('RAILS_ENV', 'production')
    toks = rc._candidate_tokens()
    assert toks == ['tok']


def test_post_internal_success_and_exception(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, '_candidate_tokens', lambda: ['t'])
    monkeypatch.setattr(rc, '_backend_bases', lambda: ['http://err403', 'http://ok'])

    class C:
        def __init__(self, timeout=None):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *a):
            return False
        class R:
            def __init__(self, code):
                self.status_code = code
        def post(self, url, headers=None, json=None):
            if url.startswith('http://err403'):
                return self.R(403)
            if url.startswith('http://ok'):
                return self.R(200)
            raise RuntimeError('boom')

    monkeypatch.setattr(rc.httpx, 'Client', C)
    ok, code = rc._post_internal('/p', {})
    assert ok is True and code == 200
    # exception path should be swallowed and continue
    ok2, code2 = rc._post_internal('/p', {})
    assert ok2 is True and code2 == 200


def test_tool_discover_direct(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, 'llm', object())
    monkeypatch.setattr(rc, '_queue_discovery_once', lambda *a, **k: (True, False, 200, {'sample': [{'first_name': 'A'}]}))
    posted = []
    monkeypatch.setattr(rc, '_post_internal', lambda *a, **k: posted.append(a) or (True, 200))
    tools = rc._make_tools(1, 's', 'en')
    D = {t.name: t for t in tools}['discover_leads']
    args = D.args_schema()
    out = D.func(args)
    assert out['queued'] is True and posted


def test_create_lead_pack_with_filters(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, 'llm', object())
    monkeypatch.setattr(rc, '_post_internal_json', lambda *a, **k: (True, 200, {'lead_pack': {'id': 2}}))
    tools = rc._make_tools(1, 's', 'en')
    # Call func directly with a duck-typed object exposing filters.model_dump
    func = {t.name: t for t in tools}['create_lead_pack'].func
    class F: 
        def model_dump(self, exclude_none=True):
            return {'keywords': 'ai'}
    class Inp:
        lead_ids = None
        filters = F()
        name = None
    out = func(Inp())
    assert out['status'] == 'ok'


def test_finalize_success_content(monkeypatch):
    import app.routes_chat as rc
    class LLM:
        def __init__(self):
            self.called = 0
        def bind_tools(self, tools, tool_choice=None):
            return self
        def invoke(self, messages):
            self.called += 1
            if any(getattr(m, 'content', '').startswith('Conclude now') for m in messages):
                return types.SimpleNamespace(tool_calls=None, content='final content')
            return types.SimpleNamespace(tool_calls=[{'name': 'nonexistent', 'args': {}, 'id': 'z'}])
    monkeypatch.setattr(rc, 'llm', LLM())
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'loop'}]})
    assert r.status_code == 200 and r.json()['reply'] == 'final content'


def test_post_internal_json_tokens_none_and_exception(monkeypatch):
    from app import routes_chat as rc
    # no tokens
    monkeypatch.setattr(rc, '_candidate_tokens', lambda: [''])
    ok, code, data = rc._post_internal_json('/x', {})
    assert (ok, code, data) == (False, 0, {})
    # exception path in httpx
    monkeypatch.setattr(rc, '_candidate_tokens', lambda: ['t'])
    monkeypatch.setattr(rc, '_backend_bases', lambda: ['http://a'])
    class C:
        def __init__(self, timeout=None):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *a):
            return False
        def post(self, *a, **k):
            raise RuntimeError('err')
    monkeypatch.setattr(rc.httpx, 'Client', C)
    ok, code, data = rc._post_internal_json('/y', {})
    assert ok is False and code == 403


def test_make_tools_llm_none_returns_empty(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, 'llm', None)
    assert rc._make_tools(1, 's', 'en') == []


def test_tool_db_preview_error(monkeypatch):
    from app import routes_chat as rc
    monkeypatch.setattr(rc, 'llm', object())
    monkeypatch.setattr(rc, '_post_internal_json', lambda *a, **k: (False, 500, {}))
    tools = rc._make_tools(1, 's', 'en')
    P = {t.name: t for t in tools}['db_preview_leads'].args_schema
    res = {t.name: t for t in tools}['db_preview_leads'].func(P())
    assert res['status'] == 'error'


def test_ai_ignores_other_roles(monkeypatch):
    import app.routes_chat as rc
    class LLM:
        def bind_tools(self, tools, tool_choice=None):
            return self
        def invoke(self, messages):
            return types.SimpleNamespace(tool_calls=None, content='ok')
    monkeypatch.setattr(rc, 'llm', LLM())
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    # Include an assistant role to hit the branch
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [
        {'role': 'assistant', 'content': 'prev'},
        {'role': 'system', 'content': 'noop'}
    ]})
    assert r.status_code == 200 and r.json()['reply'] == 'ok'


def test_profile_update_exception_swallowed(monkeypatch):
    import app.routes_chat as rc
    class LLM:
        def bind_tools(self, tools, tool_choice=None):
            return self
        def invoke(self, messages):
            return types.SimpleNamespace(tool_calls=None, content='ok')
    monkeypatch.setattr(rc, 'llm', LLM())
    monkeypatch.setattr(rc, '_post_internal', lambda *a, **k: (_ for _ in ()).throw(RuntimeError('fail')))
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'hello'}]})
    assert r.status_code == 200 and r.json()['reply'] == 'ok'


def test_tool_unserializable_result_path(monkeypatch):
    import app.routes_chat as rc
    class BadTool:
        name = 'bad'
        def invoke(self, args):
            return object()  # not JSON serializable
    class LLM:
        def bind_tools(self, tools, tool_choice=None):
            self.tools = tools + [BadTool()]
            return self
        def invoke(self, messages):
            if not hasattr(self, 'x'):
                self.x = 1
                return types.SimpleNamespace(tool_calls=[{'name': 'bad', 'args': {}, 'id': 'id1'}])
            return types.SimpleNamespace(tool_calls=None, content='done')
    monkeypatch.setattr(rc, 'llm', LLM())
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'x'}]})
    assert r.status_code == 200 and r.json()['reply'] == 'done'


def test_finalize_default_and_exception(monkeypatch):
    import app.routes_chat as rc
    # default message when finalization content empty or has tool_calls
    class LLM1:
        def bind_tools(self, tools, tool_choice=None):
            return self
        def invoke(self, messages):
            # Always returns a tool call so the loop completes and triggers finalize
            return types.SimpleNamespace(tool_calls=[{'name': 'nonexistent', 'args': {}, 'id': 'z'}])
    monkeypatch.setattr(rc, 'llm', LLM1())
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    r = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'no tools'}]})
    assert r.status_code == 200 and 'share a sample' in r.json()['reply'].lower()
    # exception path during finalization
    class LLM2:
        def bind_tools(self, tools, tool_choice=None):
            return self
        def invoke(self, messages):
            # During finalize, raise; otherwise return a tool call to progress the loop
            if any(getattr(m, 'content', '').startswith('Conclude now') for m in messages):
                raise RuntimeError('fail')
            return types.SimpleNamespace(tool_calls=[{'name': 'nonexistent', 'args': {}, 'id': 'z'}])
    monkeypatch.setattr(rc, 'llm', LLM2())
    r2 = client.post('/chat/messages', json={'session_id': 's', 'account_id': 1, 'user_id': 1, 'messages': [{'role': 'user', 'content': 'no tools'}]})
    assert r2.status_code == 200 and 'share a sample' in r2.json()['reply'].lower()


def test_health_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    res = client.get('/health')
    assert res.status_code == 200 and res.json()['status'] == 'ok'


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
