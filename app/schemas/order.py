from pydantic import BaseModel
from datetime import datetime

from app.schemas.delivery import OrderStatus


class OrderItemCreateRequest(BaseModel):
    product_id: int
    quantity: int


class OrederCreateRequest(BaseModel):
    branch_id: int
    address_id: int | None = None
    promocode: str | None = None


class OrderUpdateRequest(BaseModel):
    user_id: int
    address_id: int
    promocode_id: int
    branch_id: int
    total_price: int


class OrderListResponse(BaseModel):
    id: int
    user_id: int
    address_id: int
    promocode_id: int | None = None
    branch_id: int
    total_price: int
    status: str
    created_at: datetime

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "user_id": 2,
                    "address_id": 3,
                    "promocode_id": 4,
                    "branch_id": 2,
                    "total_price": 137000,
                    "created_at": "2026-01-19T13:01:18.001Z",
                }
            ]
        }
    }


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: int


class OrderCreateResponse(BaseModel):
    id: int
    user_id: int
    address_id: int
    branch_id: int
    promocode_id: int | None
    total_price: int
    order_items: list[OrderItemResponse]


class OrderTransitionRequest(BaseModel):
    to_status: OrderStatus


class AdminOrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_contact: str
    items_summary: str
    branch_address: str | None = None
    status: str
    total_price: int
    created_at: datetime


class CustomerOrderItem(BaseModel):
    id: int
    product_id: int
    product_name: str
    image_id: int | None = None
    quantity: int
    price: int


class OrderStatusHistoryEntry(BaseModel):
    to_status: str
    created_at: datetime


class CustomerOrderResponse(BaseModel):
    id: int
    status: str
    total_price: int
    created_at: datetime
    branch_name: str | None = None
    branch_address: str | None = None
    address_name: str | None = None
    items: list[CustomerOrderItem]
    status_history: list[OrderStatusHistoryEntry] = []
