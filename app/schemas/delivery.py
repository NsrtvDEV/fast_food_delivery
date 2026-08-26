from pydantic import BaseModel
from enum import Enum


class OrderStatus(str, Enum):
    CREATED = "created"
    ACCEPTED = "accepted"
    COOKING = "cooking"
    ON_THE_WAY = "on the way"
    DELIVERED = "delivered"
    CANCELED = "canceled"


class UpdateStatusRequest(BaseModel):
    status: OrderStatus
    reason: str | None = None


class DeliveryUpdateRequest(BaseModel):
    order_id: int
    courier_id: int
    status: OrderStatus


valid_transitions = {
    OrderStatus.CREATED: [OrderStatus.ACCEPTED, OrderStatus.CANCELED],
    OrderStatus.ACCEPTED: [OrderStatus.COOKING, OrderStatus.CANCELED],
    OrderStatus.COOKING: [OrderStatus.ON_THE_WAY],
    OrderStatus.ON_THE_WAY: [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [],
    OrderStatus.CANCELED: [],
}


class DeliveryCreateResponse(BaseModel):
    id: int
    order_id: int
    courier_id: int
    branch_id: int
    status: str


class AdminDeliveryResponse(BaseModel):
    delivery_id: int
    order_id: int
    order_status: str
    customer_name: str
    courier_name: str | None
    branch_name: str | None
    total_price: int
    assigned_at: str | None
