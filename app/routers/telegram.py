from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.config import settings
from app.database import db_dep
from app.models import TelegramLink
from app.telegram import normalize_phone, request_contact_message, send_telegram_message

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request, session: db_dep):
    if not settings.TELEGRAM_WEBHOOK_SECRET or (
        request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        != settings.TELEGRAM_WEBHOOK_SECRET
    ):
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    update = await request.json()
    message = update.get("message")
    if not message:
        return {"ok": True}

    chat_id = message["chat"]["id"]
    contact = message.get("contact")

    if contact and contact.get("phone_number"):
        phone = normalize_phone(contact["phone_number"])

        link_by_phone = (
            session.execute(select(TelegramLink).where(TelegramLink.phone == phone))
            .scalars()
            .first()
        )
        link_by_chat = (
            session.execute(select(TelegramLink).where(TelegramLink.chat_id == chat_id))
            .scalars()
            .first()
        )

        if link_by_phone:
            link_by_phone.chat_id = chat_id
        elif link_by_chat:
            link_by_chat.phone = phone
        else:
            session.add(TelegramLink(phone=phone, chat_id=chat_id))

        session.commit()
        try:
            send_telegram_message(
                chat_id,
                "Номер привязан! Теперь можно входить в Foodify по этому номеру телефона.",
            )
        except RuntimeError:
            pass
        return {"ok": True}

    text = message.get("text", "")
    if text.startswith("/start"):
        try:
            request_contact_message(chat_id)
        except RuntimeError:
            pass

    return {"ok": True}
