import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.database import db_dep
from app.models import Cart, TelegramLink, User
from app.rate_limit import rate_limiter
from app.schemas.auth import PhoneRequestCodeRequest, PhoneVerifyRequest
from app.telegram import normalize_phone, send_telegram_message
from app.utils import generate_jwt_token, hash_password, redis_client

router = APIRouter(prefix="/phone", tags=["Auth"])

OTP_TTL_SECONDS = 300


@router.post(
    "/request-code",
    dependencies=[Depends(rate_limiter("phone_request_code", 5, 300))],
)
async def request_code(session: db_dep, data: PhoneRequestCodeRequest):
    phone = normalize_phone(data.phone)

    link = (
        session.execute(select(TelegramLink).where(TelegramLink.phone == phone))
        .scalars()
        .first()
    )
    if not link:
        raise HTTPException(
            status_code=404,
            detail=(
                "This phone number is not linked to Telegram yet. Open the "
                "Foodify bot and share your phone number first."
            ),
        )

    code = f"{secrets.randbelow(1_000_000):06d}"
    redis_client.setex(f"phone_otp:{phone}", OTP_TTL_SECONDS, code)

    try:
        send_telegram_message(link.chat_id, f"Your Foodify login code: {code}")
    except RuntimeError:
        raise HTTPException(status_code=502, detail="Could not deliver the code via Telegram")

    return {"message": "Code sent via Telegram."}


@router.post(
    "/verify",
    dependencies=[Depends(rate_limiter("phone_verify", 10, 300))],
)
async def verify_code(session: db_dep, data: PhoneVerifyRequest):
    phone = normalize_phone(data.phone)

    stored_code = redis_client.get(f"phone_otp:{phone}")
    if not stored_code:
        raise HTTPException(status_code=400, detail="Code expired or was never requested")

    if isinstance(stored_code, bytes):
        stored_code = stored_code.decode("utf-8")

    if not secrets.compare_digest(stored_code, data.code):
        raise HTTPException(status_code=400, detail="Invalid code")

    redis_client.delete(f"phone_otp:{phone}")

    user = session.execute(select(User).where(User.phone == phone)).scalars().first()

    if not user:
        user = User(
            phone=phone,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            is_active=True,
        )
        session.add(user)
        session.flush()
        session.add(Cart(user_id=user.id))
        session.commit()
        session.refresh(user)
    elif not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token, refresh_token = generate_jwt_token(user.id)

    return {"access_token": access_token, "refresh_token": refresh_token}
