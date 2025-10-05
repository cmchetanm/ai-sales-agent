from typing import Dict

# Minimal i18n util; extend as needed.
RESOURCES: Dict[str, Dict[str, str]] = {
    'en': {
        'system_prompt': (
            'You are an AI sales prospecting assistant. '
            'Help the user find leads by asking concise, targeted questions about their ideal customer profile '
            '(industry, role, geography, company size, keywords). '
            'When enough information is available, acknowledge and proceed. Keep responses under 120 words.'
        ),
        'ask_start': 'Hi! What industry, roles, and locations should I target for your leads?',
        'ask_keywords': 'Great, noted. Any specific keywords or technologies I should filter for?',
        'ask_missing': 'Got it. Could you share industry, target roles, and geography to start?',
        'saved_and_fetching': (
            'Thanks — I saved your preferences and started fetching leads. '
            'You can refine industry, roles, or geography to improve results.'
        ),
        'ask_industry': 'Which industries should I target (e.g., IT, healthcare, finance)?',
        'ask_role': 'Which roles should I target (e.g., CTO, VP Engineering)?',
        'ask_location': 'Any preferred locations or countries (e.g., US)?',
        'db_preview_intro': 'Here are some leads from your database:',
        'db_satisfied': 'Are you satisfied with these results? Reply yes to close, or no to fetch more from external sources.',
        'closing': 'Great — closing this chat. You can start a new session anytime.',
        'fetching_more': 'Understood — fetching more via external sources now.',
    },
    'es': {
        'system_prompt': (
            'Eres un asistente de prospección de ventas. '
            'Ayuda al usuario a encontrar leads haciendo preguntas concisas y específicas sobre su cliente ideal '
            '(industria, rol, geografía, tamaño de empresa, palabras clave). '
            'Cuando tengas suficiente información, procede. Mantén las respuestas debajo de 120 palabras.'
        ),
        'ask_start': '¡Hola! ¿Qué industria, roles y ubicaciones debo buscar para tus leads?',
        'ask_keywords': 'Perfecto. ¿Alguna palabra clave o tecnología específica para filtrar?',
        'ask_missing': 'Entendido. ¿Podrías indicar industria, roles objetivo y geografía para comenzar?',
        'saved_and_fetching': (
            'Gracias — Guardé tus preferencias y comencé a traer leads. '
            'Puedes afinar industria, roles o geografía para mejorar resultados.'
        ),
        'ask_industry': '¿Qué industrias debo buscar (p. ej., TI, salud, finanzas)?',
        'ask_role': '¿Qué roles debo buscar (p. ej., CTO, VP de Ingeniería)?',
        'ask_location': '¿Alguna ubicación o país preferido (p. ej., EE. UU.)?',
        'db_preview_intro': 'Aquí hay algunos leads de tu base de datos:',
        'db_satisfied': '¿Te satisfacen estos resultados? Responde sí para cerrar, o no para buscar más fuentes externas.',
        'closing': 'Perfecto — cierro este chat. Puedes iniciar otro cuando quieras.',
        'fetching_more': 'Entendido — buscando más con fuentes externas ahora.',
    },
    'fr': {
        'system_prompt': (
            "Vous êtes un assistant de prospection commerciale. "
            "Aidez l’utilisateur à trouver des leads en posant des questions ciblées et concises sur son client idéal "
            "(industrie, rôle, géographie, taille de l’entreprise, mots-clés). "
            "Quand vous avez assez d’informations, poursuivez. Réponses sous 120 mots."
        ),
        'ask_start': 'Bonjour ! Quelle industrie, quels rôles et quelles zones dois-je cibler ?',
        'ask_keywords': 'Parfait. Des mots-clés ou technologies à filtrer ?',
        'ask_missing': 'Très bien. Pouvez-vous préciser industrie, rôles cibles et géographie pour commencer ?',
        'saved_and_fetching': (
            'Merci — J’ai enregistré vos préférences et commencé à récupérer des leads. '
            'Vous pouvez affiner industrie, rôles ou géographie pour améliorer les résultats.'
        ),
        'ask_industry': 'Quelles industries dois-je cibler (ex. IT, santé, finance) ?',
        'ask_role': 'Quels rôles dois-je cibler (ex. CTO, VP Engineering) ?',
        'ask_location': 'Des lieux ou pays préférés (ex. US) ?',
        'db_preview_intro': 'Voici quelques leads de votre base de données :',
        'db_satisfied': 'Êtes-vous satisfait ? Répondez oui pour clôturer, ou non pour chercher davantage via des sources externes.',
        'closing': 'Parfait — je clôture cette discussion. Vous pouvez en démarrer une nouvelle à tout moment.',
        'fetching_more': 'Compris — je récupère davantage via des sources externes.',
    },
}


def normalize_locale(lang_header: str | None) -> str:
    if not lang_header:
        return 'en'
    parts = [p.split(';')[0].strip() for p in lang_header.split(',') if p]
    for p in parts:
        code = p.split('-')[0].lower()
        if code in RESOURCES:
            return code
    return 'en'


def t(key: str, locale: str) -> str:
    return RESOURCES.get(locale, RESOURCES['en']).get(key, RESOURCES['en'].get(key, key))
