from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.dependencies import current_user_dep, credentials_dep
from app.schemas.user import UserProfileResponse, UserUpdateRequest
from app.database import db_dep
from app.models import TokenBlackList

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me", response_model=UserProfileResponse)
async def me(current_user: current_user_dep):
    return current_user


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

    return current_user


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
