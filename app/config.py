from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str
    DEBUG: bool
    MEDIA_PATH: str = "media"
    BASE_URL: str = "https://foodify.uz"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    SESSION_ID_EXPIRE_DAYS: int = 1
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SECRET_KEY: str

    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str

    ALGORITHM: str = "HS256"

    # Email Settings

    EMAIL_ADDRESS: str = "nsrtv123@gmail.com"
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    EMAIL_PASSWORD: str | None = None

    # If set, email is sent via the Resend HTTP API instead of SMTP - needed
    # on hosts (like Render's free tier) that block outbound SMTP ports.
    RESEND_API_KEY: str | None = None
    RESEND_FROM: str = "Foodify <onboarding@resend.dev>"

    REDIS_URL: str = "redis://localhost:6379/4"

    # If set, uploaded product photos go to Cloudflare R2 instead of local
    # disk - needed on hosts with an ephemeral filesystem (Render's free
    # tier wipes local files on every restart). R2_PUBLIC_URL is the
    # bucket's public base URL (r2.dev subdomain or a custom domain),
    # without a trailing slash.
    R2_ACCOUNT_ID: str | None = None
    R2_ACCESS_KEY_ID: str | None = None
    R2_SECRET_ACCESS_KEY: str | None = None
    R2_BUCKET_NAME: str | None = None
    R2_PUBLIC_URL: str | None = None

    SETUP_TOKEN: str | None = None

    TELEGRAM_TOKEN: str | None = None
    TELEGRAM_WEBHOOK_SECRET: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
