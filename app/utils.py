import logging
import shutil
import smtplib
import uuid
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta
from pathlib import Path

import boto3
import redis
import requests
from botocore.config import Config as BotoConfig
from fastapi import HTTPException

from passlib.context import CryptContext

from jose import JWTError, jwt

from app.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
logger = logging.getLogger(__name__)


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
    if settings.RESEND_API_KEY:
        _send_email_resend(to_email, subject, body)
    else:
        _send_email_smtp(to_email, subject, body)


def _send_email_resend(to_email: str, subject: str, body: str):
    response = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
        json={
            "from": settings.RESEND_FROM,
            "to": [to_email],
            "subject": subject,
            "text": body,
        },
        timeout=10,
    )
    response.raise_for_status()


def _send_email_smtp(to_email: str, subject: str, body: str):
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


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
        region_name=settings.S3_REGION,
    )


def save_uploaded_image(file_obj, filename: str, content_type: str) -> str:
    """Save an uploaded image and return a URL/path to fetch it back by.

    Uploads to S3-compatible object storage (Supabase Storage, Cloudflare
    R2, etc; returning its public URL) when configured - needed on hosts
    with an ephemeral filesystem, like Render's free tier, which wipes
    local files on every restart. Falls back to local disk (returning a
    relative path) when that isn't configured, for local dev.
    """
    safe_filename = f"{uuid.uuid4().hex}{Path(filename).suffix}"

    if settings.S3_ENDPOINT_URL and settings.S3_BUCKET_NAME:
        _s3_client().upload_fileobj(
            file_obj,
            settings.S3_BUCKET_NAME,
            safe_filename,
            ExtraArgs={"ContentType": content_type},
        )
        return f"{settings.S3_PUBLIC_URL}/{safe_filename}"

    path = Path(settings.MEDIA_PATH)
    path.mkdir(exist_ok=True)
    dest = path / safe_filename
    with open(dest, "wb") as buffer:
        shutil.copyfileobj(file_obj, buffer)
    return str(dest)


def delete_uploaded_image(url: str) -> None:
    """Counterpart to save_uploaded_image - deletes from object storage or
    local disk depending on which one the given url/path came from."""
    if url.startswith("http://") or url.startswith("https://"):
        if settings.S3_ENDPOINT_URL and settings.S3_BUCKET_NAME:
            key = url.rsplit("/", 1)[-1]
            try:
                _s3_client().delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            except Exception:
                logger.exception("Failed to delete object storage file %s", key)
        return

    path = Path(url)
    if path.exists():
        path.unlink()
