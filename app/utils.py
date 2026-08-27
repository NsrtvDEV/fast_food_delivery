import redis
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

from passlib.context import CryptContext

from jose import JWTError, jwt

from app.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def generate_slug(title):
    return title.lower()


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


def generate_jwt_token(user_id: int, is_access_only: bool = False):
    access_token = jwt.encode(
        algorithm=settings.ALGORITHM,
        key=settings.SECRET_KEY,
        claims={
            "sub": str(user_id),
            "type": "access",
            "exp": datetime.now(timezone.utc)
            + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        },
    )

    if is_access_only:
        return access_token

    refresh_token = jwt.encode(
        algorithm=settings.ALGORITHM,
        key=settings.SECRET_KEY,
        claims={
            "sub": str(user_id),
            "type": "refresh",
            "exp": datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        },
    )

    return access_token, refresh_token


def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(
            token, key=settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token : {e}")


def send_email(to_email: str, subject: str, body: str):
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_ADDRESS
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
        server.starttls()
        server.login(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
        server.send_message(msg)


redis_client = redis.from_url(settings.REDIS_URL)


def calculate_discounted_price(price: int, discount) -> int:
    if not discount or not discount.is_active:
        return price

    now = datetime.utcnow()
    if not (discount.start_date <= now <= discount.end_date):
        return price

    if discount.discount_type == "percentage":
        discounted = price * (1 - discount.value / 100)
    elif discount.discount_type == "fixed":
        discounted = price - discount.value
    else:
        return price

    return max(0, int(discounted))
