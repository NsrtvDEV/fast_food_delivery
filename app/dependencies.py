from typing import Annotated
from datetime import datetime, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.database import db_dep
from app.models import TokenBlackList, User
from app.utils import decode_jwt_token

jwt_security = HTTPBearer(auto_error=False)

credentials_dep = Annotated[HTTPAuthorizationCredentials, Depends(jwt_security)]


def get_current_user(
    session: db_dep, credentials: HTTPAuthorizationCredentials = Depends(jwt_security)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    blacklisted = (
        session.execute(
            select(TokenBlackList).where(
                TokenBlackList.token == credentials.credentials
            )
        )
        .scalars()
        .first()
    )
    if blacklisted:
        raise HTTPException(status_code=401, detail="Token has been revoked")

    decode = decode_jwt_token(credentials.credentials)

    if decode.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = decode["sub"]
    exp = datetime.fromtimestamp(decode["exp"], tz=timezone.utc)

    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Token expired")

    stmt = select(User).where(User.id == user_id)
    user = session.execute(stmt).scalars().first()

    if not user or user.is_deleted:
        raise HTTPException(status_code=404, detail="User not found")

    return user


current_user_dep = Annotated[User, Depends(get_current_user)]
