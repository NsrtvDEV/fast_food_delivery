import uuid

from fastapi import APIRouter, HTTPException, UploadFile, Depends
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pathlib import Path
import shutil
from typing import Annotated

from app.models import Product, Image
from app.database import db_dep
from app.schemas.product import (
    ProductListResponse,
    ProductCreateRequest,
    ProductUpdateRequest,
    ProductCreateResponse,
)
from app.dependencies import current_user_dep
from app.config import settings
from app.utils import calculate_discounted_price


router = APIRouter(prefix="/products", tags=["Products"])


def _to_list_response(product: Product) -> ProductListResponse:
    return ProductListResponse(
        id=product.id,
        category_id=product.category_id,
        image_id=product.image_id,
        name=product.name,
        description=product.description,
        price=product.price,
        final_price=calculate_discounted_price(product.price, product.discount),
        is_active=product.is_active,
    )


@router.get("/list/", response_model=list[ProductListResponse])
async def get_products(session: db_dep, search: str | None = None):
    stmt = select(Product).options(selectinload(Product.discount))
    if search:
        stmt = stmt.where(Product.name.ilike(f"%{search}%"))

    res = session.execute(stmt)
    products = res.scalars().all()

    if not products:
        raise HTTPException(status_code=404, detail="Products not found")

    return [_to_list_response(p) for p in products]


@router.get("/image/{image_id}")
async def get_product_image(session: db_dep, image_id: int):
    stmt = select(Image).where(Image.id == image_id)
    res = session.execute(stmt)
    image = res.scalars().first()
    if not image or not Path(image.url).exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image.url)


@router.get("/{product_id}", response_model=ProductListResponse)
async def get_product(session: db_dep, product_id: int):
    stmt = (
        select(Product)
        .options(selectinload(Product.discount))
        .where(Product.id == product_id)
    )
    res = session.execute(stmt)
    product = res.scalars().first()

    if not product:
        raise HTTPException(status_code=404, detail="product not found")

    return _to_list_response(product)


@router.post("/create", response_model=ProductCreateResponse)
async def create_product(
    session: db_dep,
    create_data: Annotated[ProductCreateRequest, Depends()],
    current_user: current_user_dep,
    image: UploadFile,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to create product ")

    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only jpg, jpeg, and png are allowed.",
        )

    if image.size > 1024 * 1024 * 5:
        raise HTTPException(
            status_code=400, detail="File size exceeds the limit of 5MB."
        )

    path = Path(settings.MEDIA_PATH)
    path.mkdir(exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex}{Path(image.filename).suffix}"
    res = path / safe_filename
    try:
        with open(res, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        image_obj = Image(
            url=f"{settings.MEDIA_PATH}/{safe_filename}",
        )

        session.add(image_obj)
        session.flush()

        product = Product(
            category_id=create_data.category_id,
            discount_id=create_data.discount_id,
            name=create_data.name,
            image_id=image_obj.id,
            price=create_data.price,
            description=create_data.description,
        )

        session.add(product)
        session.commit()
        session.refresh(product)

        return product

    except Exception:
        if res.exists():
            res.unlink()
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create product")


@router.put("/{product_id}")
async def update_product(
    session: db_dep,
    product_id: int,
    update_data: ProductUpdateRequest,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to update product")

    stmt = select(Product).where(Product.id == product_id)
    res = session.execute(stmt)
    product = res.scalars().first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if update_data.category_id:
        product.category_id = update_data.category_id
    if update_data.image_id:
        product.image_id = update_data.image_id
    if update_data.name:
        product.name = update_data.name
    if update_data.description:
        product.description = update_data.description
    if update_data.price:
        product.price = update_data.price
    if update_data.is_active is not None:
        product.is_active = update_data.is_active

    session.commit()
    session.refresh(product)

    return product


@router.delete("/{product_id}/")
async def delete_product(
    session: db_dep, product_id: int, current_user: current_user_dep
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to delete product")

    stmt = select(Product).where(Product.id == product_id)
    res = session.execute(stmt)
    product = res.scalars().first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False

    session.commit()
    session.refresh(product)


