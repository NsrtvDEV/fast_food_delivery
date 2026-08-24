import json
import re
import urllib.request
import urllib.error

from app.config import settings

TELEGRAM_API_BASE = "https://api.telegram.org"


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"[^\d+]", "", phone)
    if not digits.startswith("+"):
        digits = f"+{digits}"
    return digits


def _call_telegram_api(method: str, payload: dict) -> dict:
    url = f"{TELEGRAM_API_BASE}/bot{settings.TELEGRAM_TOKEN}/{method}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
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
