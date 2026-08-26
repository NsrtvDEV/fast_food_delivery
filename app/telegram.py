import json
import re
import threading
import time
import urllib.request
import urllib.error

from sqlalchemy import select

from app.config import settings

TELEGRAM_API_BASE = "https://api.telegram.org"


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"[^\d+]", "", phone)
    if not digits.startswith("+"):
        digits = f"+{digits}"
    return digits


def _call_telegram_api(method: str, payload: dict, timeout: int = 10) -> dict:
    url = f"{TELEGRAM_API_BASE}/bot{settings.TELEGRAM_TOKEN}/{method}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = json.loads(response.read())
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())
    except (urllib.error.URLError, TimeoutError) as e:
        raise RuntimeError(f"Telegram API request failed: {e}") from e

    if not body.get("ok"):
        raise RuntimeError(f"Telegram {method} failed: {body}")

    return body


def send_telegram_message(chat_id: int, text: str) -> None:
    _call_telegram_api("sendMessage", {"chat_id": chat_id, "text": text})


def request_contact_message(chat_id: int) -> None:
    _call_telegram_api(
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": "Поделитесь своим номером телефона, чтобы привязать аккаунт Foodify.",
            "reply_markup": {
                "keyboard": [
                    [{"text": "Поделиться номером телефона", "request_contact": True}]
                ],
                "resize_keyboard": True,
                "one_time_keyboard": True,
            },
        },
    )


def get_updates(offset: int | None, timeout: int = 25) -> list[dict]:
    payload: dict = {"timeout": timeout}
    if offset is not None:
        payload["offset"] = offset
    body = _call_telegram_api("getUpdates", payload, timeout=timeout + 10)
    return body.get("result", [])


def delete_webhook() -> None:
    _call_telegram_api("deleteWebhook", {})


def process_telegram_update(update: dict, session) -> None:
    from app.models import TelegramLink

    message = update.get("message")
    if not message:
        return

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
        return

    text = message.get("text", "")
    if text.startswith("/start"):
        try:
            request_contact_message(chat_id)
        except RuntimeError:
            pass


def _poll_loop() -> None:
    from app.database import SessionLocal

    try:
        delete_webhook()
    except RuntimeError as e:
        print(f"[telegram] delete_webhook failed: {e}")

    offset: int | None = None
    print("[telegram] polling started")
    while True:
        try:
            updates = get_updates(offset)
        except RuntimeError as e:
            print(f"[telegram] poll failed: {e}")
            time.sleep(3)
            continue

        for update in updates:
            offset = update["update_id"] + 1
            session = SessionLocal()
            try:
                process_telegram_update(update, session)
            except Exception as e:
                print(f"[telegram] update processing failed: {e}")
                session.rollback()
            finally:
                session.close()


def start_telegram_polling() -> None:
    if not settings.TELEGRAM_TOKEN:
        return
    thread = threading.Thread(target=_poll_loop, daemon=True)
    thread.start()
