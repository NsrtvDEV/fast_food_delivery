from datetime import datetime
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import (
    Order,
    Product,
    OrderItem,
    Promocodes,
    Cart,
    CartItem,
    Address,
    Delivery,
    OrderStatusTransition,
)
from app.database import db_dep
from app.schemas.order import (
    OrderListResponse,
    OrederCreateRequest,
    OrderCreateResponse,
    OrderTransitionRequest,
    AdminOrderResponse,
    CustomerOrderResponse,
    CustomerOrderItem,
    OrderStatusHistoryEntry,
)
from app.dependencies import current_user_dep
from app.utils import calculate_discounted_price
from app.schemas.delivery import OrderStatus, valid_transitions


router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/list", response_model=list[CustomerOrderResponse])
async def list_order(session: db_dep, current_user: current_user_dep):
    stmt = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .options(
            selectinload(Order.order_items).selectinload(OrderItem.product),
            selectinload(Order.address),
            selectinload(Order.branch),
        )
    )
    orders = session.execute(stmt).scalars().all()
    if not orders:
        return []

    order_ids = [o.id for o in orders]
    transitions_stmt = (
        select(OrderStatusTransition)
        .where(OrderStatusTransition.order_id.in_(order_ids))
        .order_by(OrderStatusTransition.created_at)
    )
    transitions_by_order: dict[int, list[OrderStatusTransition]] = {}
    for t in session.execute(transitions_stmt).scalars().all():
        transitions_by_order.setdefault(t.order_id, []).append(t)

    result = []
    for o in orders:
        result.append(
            CustomerOrderResponse(
                id=o.id,
                status=o.status,
                total_price=o.total_price,
                created_at=o.created_at,
                branch_name=o.branch.name if o.branch else None,
                branch_address=o.branch.address if o.branch else None,
                address_name=o.address.location_name if o.address else None,
                items=[
                    CustomerOrderItem(
                        id=item.id,
                        product_id=item.product_id,
                        product_name=item.product.name if item.product else "—",
                        image_id=item.product.image_id if item.product else None,
                        quantity=item.quantity,
                        price=item.price,
                    )
                    for item in o.order_items
                ],
                status_history=[
                    OrderStatusHistoryEntry(to_status=t.to_status, created_at=t.created_at)
                    for t in transitions_by_order.get(o.id, [])
                ],
            )
        )
    return result


@router.get("/admin/list", response_model=list[AdminOrderResponse])
async def list_orders_admin(
    session: db_dep,
    current_user: current_user_dep,
    status_filter: str | None = None,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")

    stmt = (
        select(Order)
        .order_by(Order.created_at.desc())
        .options(
            selectinload(Order.user),
            selectinload(Order.order_items).selectinload(OrderItem.product),
            selectinload(Order.branch),
        )
    )
    if status_filter:
        stmt = stmt.where(Order.status == status_filter)

    orders = session.execute(stmt).scalars().all()

    result = []
    for o in orders:
        customer = o.user
        name = (
            f"{customer.first_name or ''} {customer.last_name or ''}".strip()
            or customer.username
            or customer.email
            or "Guest"
        )
        contact = customer.phone or customer.email or "—"
        items_summary = ", ".join(
            item.product.name for item in o.order_items if item.product
        )
        result.append(
            AdminOrderResponse(
                id=o.id,
                customer_name=name,
                customer_contact=contact,
                items_summary=items_summary or "—",
                branch_address=o.branch.address if o.branch else None,
                status=o.status,
                total_price=o.total_price,
                created_at=o.created_at,
            )
        )
    return result


@router.get("/{order_id}", response_model=OrderListResponse)
async def get_order(session: db_dep, order_id: int, current_user: current_user_dep):
    stmt = select(Order).where(
        Order.id == order_id, Order.user_id == current_user.id
    )
    res = session.execute(stmt)
    order = res.scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@router.post("/create", response_model=OrderCreateResponse)
async def create_order(
    session: db_dep,
    create_data: OrederCreateRequest,
    current_user: current_user_dep,
):
    address_stmt = select(Address).where(Address.user_id == current_user.id)
    if create_data.address_id is not None:
        address_stmt = address_stmt.where(Address.id == create_data.address_id)
    address = (session.execute(address_stmt)).scalars().first()
    if not address:
        detail = (
            "Address not found"
            if create_data.address_id is not None
            else "Please add address first"
        )
        raise HTTPException(status_code=404, detail=detail)

    cart_stmt = select(Cart).where(Cart.user_id == current_user.id)
    cart = (session.execute(cart_stmt)).scalars().first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart_items_stmt = (
        select(CartItem)
        .where(CartItem.cart_id == cart.id)
        .options(selectinload(CartItem.product).selectinload(Product.discount))
    )
    cart_items = (session.execute(cart_items_stmt)).scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0

    order = Order(
        user_id=current_user.id,
        address_id=address.id,
        branch_id=create_data.branch_id,
        status=OrderStatus.CREATED.value,
    )
    session.add(order)
    session.flush()

    for item in cart_items:
        product = item.product
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product with id {item.product_id} not found!"
            )
        final_price = calculate_discounted_price(product.price, product.discount)
        total += final_price * item.quantity

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=final_price,
        )
        session.add(order_item)

    for item in cart_items:
        session.delete(item)
    cart.total_price = 0

    if create_data.promocode:
        stmt = select(Promocodes).where(
            Promocodes.code == create_data.promocode.upper()
        )
        code = (session.execute(stmt)).scalars().first()
        if not code:
            raise HTTPException(status_code=404, detail="Promocode not found")
        if not code.is_active:
            raise HTTPException(status_code=400, detail="Promocode is not active")
        if code.max_uses is not None and code.used_count >= code.max_uses:
            raise HTTPException(status_code=400, detail="Promocode exhausted")

        discount_amount = round(total * code.discount_percentage / 100)
        total -= discount_amount
        code.used_count += 1
        order.promocode_id = code.id

    order.total_price = total

    delivery = Delivery(
        order_id=order.id,
        branch_id=create_data.branch_id,
        status="pending",
        courier_id=None,
    )
    session.add(delivery)
    session.commit()

    order_stmt = (
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.order_items).selectinload(OrderItem.product),
            selectinload(Order.address),
            selectinload(Order.branch),
            selectinload(Order.promocode),
        )
    )
    order = session.execute(order_stmt).scalars().first()
    return order


@router.post("/{order_id}/transitions")
async def order_transition(
    session: db_dep,
    order_id: int,
    create_data: OrderTransitionRequest,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized")

    stmt = select(Order).where(Order.id == order_id)
    order = session.execute(stmt).scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    current_status = OrderStatus(order.status)
    new_status = create_data.to_status

    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {current_status.value} to {new_status.value}",
        )

    transition = OrderStatusTransition(
        order_id=order_id,
        from_status=current_status.value,
        to_status=new_status.value,
        created_at=datetime.utcnow(),
    )
    session.add(transition)

    order.status = new_status.value
    order.updated_at = datetime.utcnow()

    session.commit()
    session.refresh(transition)
    return transition
