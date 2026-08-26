from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.database import db_dep
from app.models import Category, Product
from app.schemas.catgory import (
    CategoryCreateRequest,
    CategoryListResponse,
    CategoryUpdateRequest,
)
from app.dependencies import current_user_dep

router = APIRouter(prefix="/category", tags=["Category"])


@router.get("/list/", response_model=list[CategoryListResponse])
async def get_post_list(session: db_dep):
    stmt = select(Category)
    res = session.execute(stmt)
    category = res.scalars().all()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return category


@router.post("/create")
async def create_category(
    session: db_dep,
    create_data: CategoryCreateRequest,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(
            status_code=403, detail="Not authorized to create a category"
        )

    categ = Category(name=create_data.name)
    session.add(categ)
    session.commit()
    session.refresh(categ)

    return categ


@router.put("/{category_id}")
async def update_category(
    session: db_dep,
    category_id: int,
    update_data: CategoryUpdateRequest,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to update category")

    stmt = select(Category).where(Category.id == category_id)
    res = session.execute(stmt)
    category = res.scalars().first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if update_data.name:
        category.name = update_data.name

    session.commit()
    session.refresh(category)

    return category


@router.delete("/{category_id}")
async def delete_category(
    session: db_dep, category_id: int, current_user: current_user_dep
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to update category")

    stmt = select(Category).where(Category.id == category_id)
    category = session.execute(stmt).scalars().first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    products_count = session.scalar(
        select(func.count(Product.id)).where(Product.category_id == category_id)
    )
    if products_count:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category: {products_count} product(s) still use it",
        )

    session.delete(category)
    session.commit()
