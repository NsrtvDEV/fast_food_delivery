from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.database import db_dep
from app.dependencies import current_user_dep
from app.models import Order, OrderItem, OrderStatusTransition, Product
from app.schemas.admin_dashboard import DashboardResponse

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])

EARLY_THRESHOLD_MINUTES = 25
ON_TIME_THRESHOLD_MINUTES = 40


def _require_staff(current_user):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")


def _pct_change(current: int, previous: int) -> float | None:
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(session: db_dep, current_user: current_user_dep):
    _require_staff(current_user)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    orders_today = (
        session.scalar(
            select(func.count(Order.id)).where(Order.created_at >= today_start)
        )
        or 0
    )
    orders_yesterday = (
        session.scalar(
            select(func.count(Order.id)).where(
                Order.created_at >= yesterday_start, Order.created_at < today_start
            )
        )
        or 0
    )

    out_for_delivery = (
        session.scalar(
            select(func.count(Order.id)).where(Order.status == "on the way")
        )
        or 0
    )

    revenue_today = (
        session.scalar(
            select(func.coalesce(func.sum(Order.total_price), 0)).where(
                Order.created_at >= today_start
            )
        )
        or 0
    )
    revenue_yesterday = (
        session.scalar(
            select(func.coalesce(func.sum(Order.total_price), 0)).where(
                Order.created_at >= yesterday_start, Order.created_at < today_start
            )
        )
        or 0
    )

    delivered_rows = session.execute(
        select(OrderStatusTransition.created_at, Order.created_at)
        .join(Order, Order.id == OrderStatusTransition.order_id)
        .where(OrderStatusTransition.to_status == "delivered")
    ).all()

    durations = [
        (delivered_at - order_created_at).total_seconds() / 60
        for delivered_at, order_created_at in delivered_rows
        if delivered_at >= order_created_at
    ]

    avg_delivery_minutes = (
        round(sum(durations) / len(durations), 1) if durations else None
    )
    early = sum(1 for d in durations if d <= EARLY_THRESHOLD_MINUTES)
    on_time = sum(
        1 for d in durations if EARLY_THRESHOLD_MINUTES < d <= ON_TIME_THRESHOLD_MINUTES
    )
    late = sum(1 for d in durations if d > ON_TIME_THRESHOLD_MINUTES)
    on_time_rate = (
        round((early + on_time) / len(durations) * 100, 1) if durations else None
    )

    recent_orders_raw = (
        session.execute(
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.order_items).selectinload(OrderItem.product),
            )
            .order_by(Order.created_at.desc())
            .limit(6)
        )
        .scalars()
        .all()
    )

    recent_orders = []
    for o in recent_orders_raw:
        customer = o.user
        name = (
            f"{customer.first_name or ''} {customer.last_name or ''}".strip()
            or customer.username
            or customer.email
            or "Guest"
        )
        items_summary = ", ".join(
            item.product.name for item in o.order_items if item.product
        )
        recent_orders.append(
            {
                "id": o.id,
                "customer_name": name,
                "items_summary": items_summary or "—",
                "status": o.status,
                "created_at": o.created_at,
                "total_price": o.total_price,
            }
        )

    weekly_revenue = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        rev = (
            session.scalar(
                select(func.coalesce(func.sum(Order.total_price), 0)).where(
                    Order.created_at >= day_start, Order.created_at < day_end
                )
            )
            or 0
        )
        weekly_revenue.append({"date": day_start.date().isoformat(), "revenue": rev})

    top_selling_rows = session.execute(
        select(
            Product.id,
            Product.name,
            Product.image_id,
            func.sum(OrderItem.quantity).label("qty"),
            func.sum(OrderItem.price * OrderItem.quantity).label("revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= today_start)
        .group_by(Product.id, Product.name, Product.image_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(4)
    ).all()

    top_selling = [
        {
            "id": row.id,
            "name": row.name,
            "image_id": row.image_id,
            "orders_count": int(row.qty),
            "revenue": int(row.revenue),
        }
        for row in top_selling_rows
    ]

    return {
        "orders_today": orders_today,
        "orders_change_pct": _pct_change(orders_today, orders_yesterday),
        "out_for_delivery": out_for_delivery,
        "avg_delivery_minutes": avg_delivery_minutes,
        "revenue_today": revenue_today,
        "revenue_change_pct": _pct_change(revenue_today, revenue_yesterday),
        "delivery_performance": {
            "on_time_rate": on_time_rate,
            "early": early,
            "on_time": on_time,
            "late": late,
        },
        "recent_orders": recent_orders,
        "weekly_revenue": weekly_revenue,
        "top_selling": top_selling,
    }
