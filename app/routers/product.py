import uuid

from fastapi import APIRouter, HTTPException, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pathlib import Path
import shutil
from typing import Annotated

from app.models import Product, Image, Review
from app.database import db_dep
from app.schemas.product import (
    ProductListResponse,
    ProductUpdateRequest,
    ProductCreateResponse,
)
from app.dependencies import current_user_dep
from app.config import settings
from app.utils import calculate_discounted_price


router = APIRouter(prefix="/products", tags=["Products"])


def _rating_map(session, product_ids: list[int]) -> dict[int, tuple[float, int]]:
    if not product_ids:
        return {}
    rows = session.execute(
        select(Review.product_id, func.avg(Review.rating), func.count(Review.id))
        .where(Review.product_id.in_(product_ids), Review.is_hidden.is_(False))
        .group_by(Review.product_id)
    ).all()
    return {product_id: (round(float(avg), 1), count) for product_id, avg, count in rows}


def _to_list_response(
    product: Product, rating_map: dict[int, tuple[float, int]] | None = None
) -> ProductListResponse:
    rating = (rating_map or {}).get(product.id)
    return ProductListResponse(
        id=product.id,
        category_id=product.category_id,
        image_id=product.image_id,
        discount_id=product.discount_id,
        name=product.name,
        description=product.description,
        price=product.price,
        final_price=calculate_discounted_price(product.price, product.discount),
        is_active=product.is_active,
        average_rating=rating[0] if rating else None,
        review_count=rating[1] if rating else 0,
    )


@router.get("/list/", response_model=list[ProductListResponse])
async def get_products(session: db_dep, search: str | None = None):
    stmt = (
        select(Product)
        .options(selectinload(Product.discount))
        .where(Product.is_active.is_(True))
    )
    if search:
        stmt = stmt.where(Product.name.ilike(f"%{search}%"))

    res = session.execute(stmt)
    products = res.scalars().all()

    if not products:
        raise HTTPException(status_code=404, detail="Products not found")

    rating_map = _rating_map(session, [p.id for p in products])
    return [_to_list_response(p, rating_map) for p in products]


@router.get("/admin/list/", response_model=list[ProductListResponse])
async def get_products_admin(session: db_dep, current_user: current_user_dep):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")

    stmt = (
        select(Product).options(selectinload(Product.discount)).order_by(Product.id)
    )
    products = session.execute(stmt).scalars().all()

    rating_map = _rating_map(session, [p.id for p in products])
    return [_to_list_response(p, rating_map) for p in products]


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

    rating_map = _rating_map(session, [product.id])
    return _to_list_response(product, rating_map)


@router.post("/create", response_model=ProductCreateResponse)
async def create_product(
    session: db_dep,
    current_user: current_user_dep,
    image: UploadFile,
    category_id: Annotated[int, Form()],
    name: Annotated[str, Form()],
    description: Annotated[str, Form()],
    price: Annotated[int, Form()],
    discount_id: Annotated[int | None, Form()] = None,
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
            category_id=category_id,
            discount_id=discount_id,
            name=name,
            image_id=image_obj.id,
            price=price,
            description=description,
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
    if "discount_id" in update_data.model_fields_set:
        product.discount_id = update_data.discount_id
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


@router.put("/{product_id}/image", response_model=ProductListResponse)
async def update_product_image(
    session: db_dep,
    product_id: int,
    current_user: current_user_dep,
    image: UploadFile,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to update product")

    stmt = (
        select(Product)
        .options(selectinload(Product.discount))
        .where(Product.id == product_id)
    )
    product = session.execute(stmt).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

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
    new_path = path / safe_filename

    old_image_id = product.image_id
    try:
        with open(new_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        new_image = Image(url=f"{settings.MEDIA_PATH}/{safe_filename}")
        session.add(new_image)
        session.flush()

        product.image_id = new_image.id
        session.commit()
        session.refresh(product)
    except Exception:
        if new_path.exists():
            new_path.unlink()
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to update product image")

    # Only after the product cleanly points at the new image do we remove the
    # old one, as a separate transaction — deleting it in the same flush as
    # the FK reassignment lets SQLAlchemy's relationship dependency handling
    # null out product.image_id right back out from under us.
    if old_image_id:
        old_image = session.execute(
            select(Image).where(Image.id == old_image_id)
        ).scalars().first()
        if old_image:
            old_path = Path(old_image.url)
            session.delete(old_image)
            session.commit()
            if old_path.exists():
                old_path.unlink()

    rating_map = _rating_map(session, [product.id])
    return _to_list_response(product, rating_map)


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


