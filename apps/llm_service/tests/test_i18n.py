from app.i18n import normalize_locale, t
from app import routes_chat as rc


def test_normalize_locale_picks_supported_lang():
    assert normalize_locale('es-ES,fr;q=0.8') == 'es'
    assert normalize_locale('de-DE') == 'en'  # fallback to en


def test_t_fallbacks():
    # existing key
    assert t('ask_start', 'fr').startswith('Bonjour')
    # missing key returns english default or key
    assert t('nonexistent_key', 'fr') == 'nonexistent_key'


def test_system_prompt_has_tool_guidance():
    out = rc.system_prompt('en')
    assert 'db_preview_leads' in out and 'discover_leads' in out and 'chat_notify' in out

