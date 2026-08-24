from datetime import datetime
from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.models import (
    Delivery,
    Order,
    Notification,
    OrderStatusTransition,
    WalletTransaction,
    CourierWallet,
)
from app.schemas.delivery import (
    OrderStatus,
)
from app.database import db_dep
from app.schemas.delivery import UpdateStatusRequest, valid_transitions
from app.dependencies import current_user_dep


router = APIRouter(prefix="/delivery", tags=["Deliveries"])

ACTIVE_STATUSES = [
    OrderStatus.ACCEPTED.value,
    OrderStatus.COOKING.value,
    OrderStatus.ON_THE_WAY.value,
]


STATUS_MESSAGES = {
    OrderStatus.ACCEPTED: {
        "title": "Order Accepted! 🎉",
        "message": "Your order has been accepted and sent to the restaurant.",
    },
    OrderStatus.COOKING: {
        "title": "Being Prepared 👨‍🍳",
        "message": "Your order is being prepared in the kitchen.",
    },
    OrderStatus.ON_THE_WAY: {
        "title": "On The Way 🚴",
        "message": "The courier has picked up your order and is heading your way.",
    },
    OrderStatus.DELIVERED: {
        "title": "Delivered! ✅",
        "message": "Your order has been delivered. Enjoy your meal!",
    },
    OrderStatus.CANCELED: {
        "title": "Order Canceled ❌",
        "message": "Unfortunately, your order has been canceled.",
    },
}


@router.get("/orders/available")
async def get_available_orders(session: db_dep, current_user: current_user_dep):
    if not current_user.is_courier:
        raise HTTPException(status_code=403, detail="Couriers only")

    taken_order_ids = (
        session.execute(
            select(Delivery.order_id).where(Delivery.courier_id.isnot(None))
        )
        .scalars()
        .all()
    )

    orders = (
        session.execute(
            select(Order)
            .where(Order.status == OrderStatus.CREATED.value)
            .where(Order.id.notin_(taken_order_ids))
            .order_by(Order.created_at)
        )
        .scalars()
        .all()
    )

    return {"orders": orders}


@router.get("/orders/active")
async def get_active_orders(session: db_dep, current_user: current_user_dep):
    deliveries = (
        session.execute(select(Delivery).where(Delivery.courier_id == current_user.id))
        .scalars()
        .all()
    )

    if not deliveries:
        return {"courier_id": current_user.id, "orders": []}

    order_ids = [d.order_id for d in deliveries]
    orders = (
        session.execute(
            select(Order)
            .where(Order.id.in_(order_ids))
            .where(Order.status.in_(ACTIVE_STATUSES))
        )
        .scalars()
        .all()
    )

    return {"courier_id": current_user.id, "orders": orders}


@router.put("/orders/{order_id}/status")
async def update_order_status(
    session: db_dep,
    order_id: int,
    data: UpdateStatusRequest,
    current_user: current_user_dep,
):
    order = session.execute(select(Order).where(Order.id == order_id)).scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    delivery = (
        session.execute(
            select(Delivery)
            .where(Delivery.order_id == order_id)
            .where(Delivery.courier_id == current_user.id)
        )
        .scalars()
        .first()
    )
    if not delivery:
        raise HTTPException(
            status_code=403, detail="You are not the courier of this order"
        )

    current_status = OrderStatus(order.status)
    new_status = data.status

    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {current_status.value} to {new_status.value}",
        )

    transition = OrderStatusTransition(
        order_id=order_id,
        from_status=current_status.value,
        to_status=new_status.value,
        reason=getattr(data, "reason", None),
        created_at=datetime.utcnow(),
    )
    session.add(transition)

    order.status = new_status.value
    order.updated_at = datetime.utcnow()
    session.commit()

    if new_status == OrderStatus.DELIVERED:
        COURIER_FEE = 0.1  # 10% от заказа
        earning = round(order.total_price * COURIER_FEE)

        wallet = (
            session.execute(
                select(CourierWallet).where(CourierWallet.courier_id == current_user.id)
            )
            .scalars()
            .first()
        )

        if not wallet:
            wallet = CourierWallet(
                courier_id=current_user.id, balance=0, currency="UZS"
            )
            session.add(wallet)
            session.flush()

        wallet.balance += earning

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            order_id=order_id,
            amount=earning,
        )
        session.add(transaction)
        session.commit()

    notification_data = STATUS_MESSAGES.get(new_status)
    if notification_data:
        notification = Notification(
            user_id=order.user_id,
            title=notification_data["title"],
            message=notification_data["message"],
            is_read=False,
            is_sent_to_all=False,
        )
        session.add(notification)
        session.commit()

    session.refresh(order)
    return {"message": "Status updated", "order": order}


@router.post("/orders/{order_id}/take")
async def take_order(session: db_dep, order_id: int, current_user: current_user_dep):
    order = session.execute(select(Order).where(Order.id == order_id)).scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.CREATED.value:  # ✅ проверяем CREATED
        raise HTTPException(status_code=400, detail=f"Order status: '{order.status}'")

    existing = (
        session.execute(
            select(Delivery)
            .where(Delivery.order_id == order_id)
            .where(Delivery.courier_id.isnot(None))
        )
        .scalars()
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="Order already taken by another courier"
        )

    active_delivery = (
        session.execute(
            select(Delivery)
            .join(Order, Delivery.order_id == Order.id)
            .where(Delivery.courier_id == current_user.id)
            .where(Order.status.in_(ACTIVE_STATUSES))
        )
        .scalars()
        .first()
    )
    if active_delivery:
        raise HTTPException(status_code=400, detail="Finish your current order first.")

    transition = OrderStatusTransition(
        order_id=order_id,
        from_status=OrderStatus.CREATED.value,
        to_status=OrderStatus.ACCEPTED.value,
        created_at=datetime.utcnow(),
    )
    session.add(transition)

    order.status = OrderStatus.ACCEPTED.value
    order.updated_at = datetime.utcnow()

    delivery = Delivery(
        order_id=order_id,
        courier_id=current_user.id,
        branch_id=order.branch_id,
        status="assigned",
        assigned_at=datetime.utcnow(),
    )
    session.add(delivery)
    session.commit()
    session.refresh(delivery)
    return delivery


@router.post("/orders/{order_id}/drop")
async def drop_order(session: db_dep, order_id: int, current_user: current_user_dep):
    delivery = (
        session.execute(
            select(Delivery)
            .where(Delivery.order_id == order_id)
            .where(Delivery.courier_id == current_user.id)
        )
        .scalars()
        .first()
    )

    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")

    order = session.execute(select(Order).where(Order.id == order_id)).scalars().first()

    if order and order.status == OrderStatus.ON_THE_WAY.value:
        raise HTTPException(
            status_code=400,
            detail="Cannot drop order: you are already on the way",
        )

    session.delete(delivery)
    session.commit()

    return {"message": "Order dropped. It is available for other couriers again."}
