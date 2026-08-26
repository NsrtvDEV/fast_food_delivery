from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.dependencies import current_user_dep, credentials_dep
from app.schemas.user import (
    UserProfileResponse,
    UserUpdateRequest,
    ChangePasswordRequest,
)
from app.database import db_dep
from app.models import TokenBlackList, TelegramLink
from app.utils import hash_password, verify_password

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


def _profile_response(session: db_dep, user) -> UserProfileResponse:
    telegram_linked = False
    if user.phone:
        stmt = select(TelegramLink).where(TelegramLink.phone == user.phone)
        telegram_linked = session.execute(stmt).scalars().first() is not None

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        is_active=user.is_active,
        is_staff=user.is_staff,
        is_courier=user.is_courier,
        is_superuser=user.is_superuser,
        is_deleted=user.is_deleted,
        telegram_linked=telegram_linked,
    )


@router.get("/me", response_model=UserProfileResponse)
async def me(session: db_dep, current_user: current_user_dep):
    return _profile_response(session, current_user)


@router.put("/me/update/", response_model=UserProfileResponse)
async def update_user(
    session: db_dep, current_user: current_user_dep, update_data: UserUpdateRequest
):

    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    if update_data.email is not None:
        current_user.email = update_data.email
    if update_data.first_name is not None:
        current_user.first_name = update_data.first_name
    if update_data.last_name is not None:
        current_user.last_name = update_data.last_name
    if update_data.phone is not None:
        current_user.phone = update_data.phone

    session.commit()
    session.refresh(current_user)

    return _profile_response(session, current_user)


@router.post("/me/change-password/")
async def change_password(
    session: db_dep, current_user: current_user_dep, data: ChangePasswordRequest
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(data.new_password)
    session.commit()

    return {"detail": "Password changed successfully"}


@router.post("/me/deactivate/", status_code=200)
async def deactivate_user(session: db_dep, current_user: current_user_dep):
    current_user.is_active = False

    session.commit()
    session.refresh(current_user)

    return {"detail": "User deactivated successfully"}


@router.post("/logout")
async def logout(
    session: db_dep, current_user: current_user_dep, credentials: credentials_dep
):
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    stmt = select(TokenBlackList).where(TokenBlackList.token == token)
    existing = session.execute(stmt).scalars().first()

    if existing:
        raise HTTPException(status_code=400, detail="Token already invalidated")

    blanc_list_token = TokenBlackList(token=token)
    session.add(blanc_list_token)
    session.commit()

    return {"detail": "Successfully logged out"}
