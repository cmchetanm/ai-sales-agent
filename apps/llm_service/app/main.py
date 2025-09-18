from fastapi import FastAPI
from .routes_chat import router as chat_router

app = FastAPI(title="AI Sales Agent LLM Service", version="0.1.0")


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Basic health check placeholder."""
    return {"status": "ok"}


app.include_router(chat_router)
