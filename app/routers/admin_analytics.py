from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.database import db_dep
from app.dependencies import current_user_dep
from app.models import Order, OrderItem, Product, Category, Review
from app.schemas.analytics import AnalyticsResponse

router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])

TREND_DAYS = 30


def _require_staff(current_user):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")


@router.get("/", response_model=AnalyticsResponse)
async def get_analytics(session: db_dep, current_user: current_user_dep):
    _require_staff(current_user)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    non_canceled = Order.status != "canceled"

    total_revenue = (
        session.scalar(
            select(func.coalesce(func.sum(Order.total_price), 0)).where(non_canceled)
        )
        or 0
    )
    total_orders = (
        session.scalar(select(func.count(Order.id)).where(non_canceled)) or 0
    )
    average_order_value = round(total_revenue / total_orders) if total_orders else 0

    average_rating = session.scalar(
        select(func.avg(Review.rating)).where(Review.is_hidden.is_(False))
    )

    revenue_trend = []
    for i in range(TREND_DAYS - 1, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        row = session.execute(
            select(
                func.coalesce(func.sum(Order.total_price), 0),
                func.count(Order.id),
            ).where(Order.created_at >= day_start, Order.created_at < day_end)
        ).first()
        revenue_trend.append(
            {
                "date": day_start.date().isoformat(),
                "revenue": row[0] or 0,
                "orders_count": row[1] or 0,
            }
        )

    status_rows = session.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    ).all()
    status_breakdown = [{"status": s, "count": c} for s, c in status_rows]

    top_product_rows = session.execute(
        select(
            Product.id,
            Product.name,
            Product.image_id,
            func.sum(OrderItem.quantity).label("qty"),
            func.sum(OrderItem.price * OrderItem.quantity).label("revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(non_canceled)
        .group_by(Product.id, Product.name, Product.image_id)
        .order_by(func.sum(OrderItem.price * OrderItem.quantity).desc())
        .limit(10)
    ).all()
    top_products = [
        {
            "id": row.id,
            "name": row.name,
            "image_id": row.image_id,
            "orders_count": int(row.qty),
            "revenue": int(row.revenue),
        }
        for row in top_product_rows
    ]

    category_rows = session.execute(
        select(
            Category.id,
            Category.name,
            func.sum(OrderItem.price * OrderItem.quantity).label("revenue"),
            func.count(OrderItem.id).label("orders_count"),
        )
        .join(Product, Product.category_id == Category.id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(non_canceled)
        .group_by(Category.id, Category.name)
        .order_by(func.sum(OrderItem.price * OrderItem.quantity).desc())
    ).all()
    category_performance = [
        {
            "category_id": row.id,
            "category_name": row.name,
            "revenue": int(row.revenue),
            "orders_count": int(row.orders_count),
        }
        for row in category_rows
    ]

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "average_order_value": average_order_value,
        "average_rating": round(float(average_rating), 1) if average_rating else None,
        "revenue_trend": revenue_trend,
        "status_breakdown": status_breakdown,
        "top_products": top_products,
        "category_performance": category_performance,
    }
