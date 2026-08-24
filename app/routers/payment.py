from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.database import db_dep
from app.models import Payment, Order
from app.dependencies import current_user_dep
from app.schemas.payment import PaymentCreateRequest, PaymentCreateResponse, PaymentStatus

router = APIRouter(prefix="/payment", tags=["Payments"])


@router.post("/create", response_model=PaymentCreateResponse)
async def create_payment(
    session: db_dep, current_user: current_user_dep, create_data: PaymentCreateRequest
):
    stmt = select(Order).where(
        Order.id == create_data.order_id, Order.user_id == current_user.id
    )
    order = session.execute(stmt).scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    existing_payment = (
        session.execute(select(Payment).where(Payment.order_id == order.id))
        .scalars()
        .first()
    )
    if existing_payment:
        raise HTTPException(status_code=409, detail="Order is already paid")

    # The amount charged always comes from the order itself, never from the
    # client, so a tampered request body can't pay less than what is owed.
    payment = Payment(
        order_id=order.id,
        payment_type=create_data.payment_type,
        amount=order.total_price,
        status=PaymentStatus.COMPLETED.value,
        paid_at=datetime.utcnow(),
    )

    try:
        session.add(payment)
        session.commit()
        session.refresh(payment)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=402, detail=f"payment declined: {e}")

    return PaymentCreateResponse(
        order_id=payment.order_id,
        payment_type=payment.payment_type,
        amount=payment.amount,
        status=PaymentStatus.COMPLETED,
        paid_at=payment.paid_at is not None,
    )
