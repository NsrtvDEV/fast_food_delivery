from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import db_dep
from app.models import Review, Order, OrderItem
from app.schemas.review import ReviewCreateRequest, ReviewResponse, ProductRatingSummary
from app.dependencies import current_user_dep

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def _to_response(review: Review) -> ReviewResponse:
    customer = review.user
    name = (
        f"{customer.first_name or ''} {customer.last_name or ''}".strip()
        or customer.username
        or customer.email
        or "Guest"
    )
    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        product_name=review.product.name if review.product else "—",
        customer_name=name,
        rating=review.rating,
        comment=review.comment,
        is_hidden=review.is_hidden,
        created_at=review.created_at,
    )


@router.post("/", response_model=ReviewResponse)
async def create_review(
    session: db_dep, create_data: ReviewCreateRequest, current_user: current_user_dep
):
    delivered = (
        session.execute(
            select(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.user_id == current_user.id,
                Order.status == "delivered",
                OrderItem.product_id == create_data.product_id,
            )
        )
        .scalars()
        .first()
    )
    if not delivered:
        raise HTTPException(
            status_code=403,
            detail="You can only review products from a delivered order",
        )

    existing = (
        session.execute(
            select(Review).where(
                Review.user_id == current_user.id,
                Review.product_id == create_data.product_id,
            )
        )
        .scalars()
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")

    review = Review(
        product_id=create_data.product_id,
        user_id=current_user.id,
        rating=create_data.rating,
        comment=create_data.comment,
    )
    session.add(review)
    session.commit()

    stmt = (
        select(Review)
        .where(Review.id == review.id)
        .options(selectinload(Review.user), selectinload(Review.product))
    )
    review = session.execute(stmt).scalars().first()
    return _to_response(review)


@router.get("/product/{product_id}", response_model=list[ReviewResponse])
async def get_product_reviews(session: db_dep, product_id: int):
    stmt = (
        select(Review)
        .where(Review.product_id == product_id, Review.is_hidden.is_(False))
        .options(selectinload(Review.user), selectinload(Review.product))
        .order_by(Review.created_at.desc())
    )
    reviews = session.execute(stmt).scalars().all()
    return [_to_response(r) for r in reviews]


@router.get("/product/{product_id}/summary", response_model=ProductRatingSummary)
async def get_product_rating_summary(session: db_dep, product_id: int):
    row = session.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.product_id == product_id, Review.is_hidden.is_(False)
        )
    ).first()
    avg_rating, count = row
    return ProductRatingSummary(
        average_rating=round(float(avg_rating), 1) if avg_rating else None,
        review_count=count or 0,
    )


@router.get("/admin/list", response_model=list[ReviewResponse])
async def list_reviews_admin(session: db_dep, current_user: current_user_dep):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")

    stmt = (
        select(Review)
        .options(selectinload(Review.user), selectinload(Review.product))
        .order_by(Review.created_at.desc())
    )
    reviews = session.execute(stmt).scalars().all()
    return [_to_response(r) for r in reviews]


@router.patch("/{review_id}/toggle-visibility", response_model=ReviewResponse)
async def toggle_review_visibility(
    session: db_dep, review_id: int, current_user: current_user_dep
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")

    stmt = (
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.user), selectinload(Review.product))
    )
    review = session.execute(stmt).scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_hidden = not review.is_hidden
    session.commit()
    session.refresh(review)
    return _to_response(review)


@router.delete("/{review_id}")
async def delete_review(session: db_dep, review_id: int, current_user: current_user_dep):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")

    stmt = select(Review).where(Review.id == review_id)
    review = session.execute(stmt).scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    session.delete(review)
    session.commit()
