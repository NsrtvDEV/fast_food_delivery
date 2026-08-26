from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.models import Discount
from app.database import db_dep
from app.schemas.discount import (
    DiscountCreateRequest,
    DiscountCreateResponse,
    DiscountUpdateRequest,
)
from app.dependencies import current_user_dep

router = APIRouter(prefix="/discounts", tags=["Discounts"])


@router.get("/list", response_model=list[DiscountCreateResponse])
async def list_discounts(session: db_dep):
    stmt = select(Discount).order_by(Discount.id.desc())
    return session.execute(stmt).scalars().all()


@router.post("/create", response_model=DiscountCreateResponse)
async def create_discount(
    session: db_dep, create_data: DiscountCreateRequest, current_user: current_user_dep
):

    if not (current_user.is_superuser or current_user.is_staff):
        raise HTTPException(status_code=403, detail="Only admins can create discounts")

    discount = Discount(
        name=create_data.name,
        discount_type=create_data.discount_type,
        value=create_data.value,
        start_date=create_data.start_date,
        end_date=create_data.end_date,
        is_active=create_data.is_active,
    )

    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")

    session.add(discount)
    session.commit()
    session.refresh(discount)

    return discount


@router.put("/{category_id}")
async def update_product(
    session: db_dep,
    category_id: int,
    update_data: DiscountUpdateRequest,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to update discount")

    stmt = select(Discount).where(Discount.id == category_id)
    res = session.execute(stmt)
    category = res.scalars().first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if update_data.name:
        category.name = update_data.name
    if update_data.discount_type:
        category.discount_type = update_data.discount_type
    if update_data.value:
        category.value = update_data.value
    if update_data.start_date:
        category.start_date = update_data.start_date
    if update_data.end_date:
        category.end_date = update_data.end_date
    if update_data.is_active:
        category.is_active = update_data.is_active

    session.commit()
    session.refresh(category)

    return category


@router.delete("/{discount_id}")
async def delete_discount(
    session: db_dep, discount_id: int, current_user: current_user_dep
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to delete product")

    stmt = select(Discount).where(Discount.id == discount_id)
    discount = session.execute(stmt).scalars().first()

    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")

    session.delete(discount)
    session.commit()
