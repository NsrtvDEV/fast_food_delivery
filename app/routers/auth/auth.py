from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.database import db_dep
from app.models import User
from app.rate_limit import rate_limiter
from app.schemas.auth import UserLoginRequest, RefreshToken
from app.utils import verify_password, generate_jwt_token, decode_jwt_token

router = APIRouter(tags=["Auth"])


@router.post("/login", dependencies=[Depends(rate_limiter("login", 5, 300))])
async def login(session: db_dep, login_data: UserLoginRequest):
    stmt = select(User).where(User.email == login_data.email)
    user = session.execute(stmt).scalars().first()

    if (
        not user
        or not user.is_active
        or not verify_password(login_data.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token, refresh_token = generate_jwt_token(user.id)

    return {"access_token": access_token, "refresh_token": refresh_token}


@router.post("/refresh")
async def refresh(session: db_dep, data: RefreshToken):
    decode_data = decode_jwt_token(data.refresh_token)

    if decode_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    exp_time = datetime.fromtimestamp(decode_data["exp"], tz=timezone.utc)

    if exp_time < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user_id = decode_data["sub"]
    access_token = generate_jwt_token(user_id, is_access_only=True)

    return {"access_token": access_token}
