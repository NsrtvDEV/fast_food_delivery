import logging
import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.config import settings
from app.database import db_dep
from app.models import User, Cart
from app.rate_limit import rate_limiter
from app.schemas.auth import UserRegisterRequest, UserRegisterResponse
from app.utils import hash_password, send_email, redis_client


router = APIRouter(prefix="/register", tags=["Auth"])
logger = logging.getLogger(__name__)


def _send_email_safe(to_email: str, subject: str, body: str) -> None:
    """Email delivery is best-effort: a slow/unreachable SMTP server should
    never hang or fail the registration request itself."""
    try:
        send_email(to_email, subject, body)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


@router.post(
    "/",
    response_model=UserRegisterResponse,
    dependencies=[Depends(rate_limiter("register", 5, 3600))],
)
async def register_user(
    session: db_dep, data: UserRegisterRequest, background_tasks: BackgroundTasks
):

    stmt = select(User).where(User.email == data.email)
    existing = session.execute(stmt).scalars().first()

    if existing:
        # Respond exactly like a fresh registration so the API can't be used
        # to probe which emails are already registered. The account owner is
        # still informed — just through the inbox, not the HTTP response.
        background_tasks.add_task(
            _send_email_safe,
            data.email,
            "Registration attempt",
            "Someone tried to register a new account with this email, but you "
            "already have one. If this was you, just log in instead.",
        )
        return JSONResponse(
            status_code=204,
            content={"message": "Email confirmation sent to your email."},
            background=background_tasks,
        )

    stmt = select(User).limit(1)
    existing_user = session.execute(stmt).scalars().first()
    is_first_user = existing_user is None
    grant_superuser = (
        is_first_user
        and settings.SETUP_TOKEN is not None
        and data.setup_token == settings.SETUP_TOKEN
    )

    user = User(
        email=data.email, password_hash=hash_password(data.password), is_active=False
    )

    session.add(user)
    session.flush()

    cart = Cart(user_id=user.id)
    session.add(cart)

    secret_code = secrets.token_hex(8)
    background_tasks.add_task(
        _send_email_safe,
        data.email,
        "Email confirmation",
        f"Your confirmation code is: {secret_code}",
    )

    redis_client.setex(secret_code, 120, user.email)

    if grant_superuser:
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True

    session.commit()

    return JSONResponse(
        status_code=204,
        content={"message": "Email confirmation sent to your email."},
        background=background_tasks,
    )


@router.post(
    "/verify/{secret_code}",
    response_model=UserRegisterResponse,
    dependencies=[Depends(rate_limiter("verify", 10, 300))],
)
async def verify_register(session: db_dep, secret_code: str):
    email = redis_client.get(secret_code)

    if not email:
        raise HTTPException(status_code=400, detail="Invalid code")

    if isinstance(email, bytes):
        email = email.decode("utf-8")

    stmt = select(User).where(User.email == email)
    user = session.execute(stmt).scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    session.commit()
    session.refresh(user)

    redis_client.delete(secret_code)

    return user
