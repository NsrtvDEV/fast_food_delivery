from fastapi import APIRouter, HTTPException, Request

from app.config import settings
from app.database import db_dep
from app.telegram import process_telegram_update

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request, session: db_dep):
    if not settings.TELEGRAM_WEBHOOK_SECRET or (
        request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        != settings.TELEGRAM_WEBHOOK_SECRET
    ):
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    update = await request.json()
    process_telegram_update(update, session)
    return {"ok": True}
