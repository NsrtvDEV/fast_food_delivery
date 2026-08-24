from fastapi import HTTPException, Request

from app.utils import redis_client


def rate_limiter(key_prefix: str, limit: int, window_seconds: int):
    """Fixed-window rate limit per client IP, backed by the shared Redis instance."""

    async def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{key_prefix}:{client_ip}"

        current = redis_client.incr(key)
        if current == 1:
            redis_client.expire(key, window_seconds)

        if current > limit:
            raise HTTPException(
                status_code=429, detail="Too many requests. Please try again later."
            )

    return dependency
