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

    # If set, uploaded product photos go to S3-compatible object storage
    # (Supabase Storage, Cloudflare R2, etc.) instead of local disk - needed
    # on hosts with an ephemeral filesystem (Render's free tier wipes local
    # files on every restart). S3_PUBLIC_URL is the base URL each uploaded
    # file's name gets appended to, without a trailing slash - for Supabase
    # that's https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>,
    # for R2 it's the bucket's r2.dev URL or a custom domain.
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_BUCKET_NAME: str | None = None
    S3_REGION: str = "auto"
    S3_PUBLIC_URL: str | None = None

    SETUP_TOKEN: str | None = None

    TELEGRAM_TOKEN: str | None = None
    TELEGRAM_WEBHOOK_SECRET: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
