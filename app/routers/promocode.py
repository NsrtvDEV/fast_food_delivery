from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.models import Promocodes
from app.database import db_dep
from app.schemas.promocode import (
    CreatePromocodeRequest,
    ApplyPromocodeRequest,
    PromocodeListResponse,
)
from app.dependencies import current_user_dep

router = APIRouter(prefix="/promocodes", tags=["Promocodes"])


@router.get("/list/", response_model=list[PromocodeListResponse])
async def get_promocodes(session: db_dep, current_user: current_user_dep):
    stmt = select(Promocodes)

    if not (current_user.is_staff or current_user.is_superuser):
        stmt = stmt.where(Promocodes.is_active.is_(True))

    code = session.execute(stmt).scalars().all()

    return code


@router.post("/")
async def create_promocode(
    session: db_dep, create_data: CreatePromocodeRequest, current_user: current_user_dep
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to create a post  ")

    stmt = select(Promocodes).where(Promocodes.code == create_data.code.upper())
    code = session.execute(stmt).scalars().first()
    if code:
        raise HTTPException(status_code=400, detail="Promocode already exists")

    code = Promocodes(
        code=create_data.code.upper(),
        discount_percentage=create_data.discount_percentage,
        is_active=create_data.is_active,
        max_uses=create_data.max_uses,
        created_at=datetime.utcnow(),
    )

    session.add(code)
    session.commit()
    session.refresh(code)

    return code


@router.post("/apply")
async def apply_promocode(
    session: db_dep, apply_data: ApplyPromocodeRequest, current_user: current_user_dep
):

    stmt = select(Promocodes).where(Promocodes.code == apply_data.code.upper())
    code = session.execute(stmt).scalars().first()

    if not code:
        raise HTTPException(status_code=404, detail="Code not found")

    if not code.is_active:
        raise HTTPException(status_code=400, detail="Code is not active")

    if code.max_uses is not None and code.used_count >= code.max_uses:
        raise HTTPException(status_code=400, detail="Code exhausted")

    discount_amount = round(apply_data.price * code.discount_percentage / 100)
    final_price = apply_data.price - discount_amount

    code.used_count += 1
    session.commit()

    return {"total price": final_price}


@router.delete("/delete/{promocode_id}")
async def delete_promocode(
    session: db_dep, promocode_id: int, current_user: current_user_dep
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(
            status_code=403, detail="Not authorized to delete promocode"
        )

    stmt = select(Promocodes).where(Promocodes.id == promocode_id)
    code = session.execute(stmt).scalars().first()

    if not code:
        raise HTTPException(status_code=404, detail="Code not found")

    code.is_active = False

    session.commit()
    session.refresh(code)
