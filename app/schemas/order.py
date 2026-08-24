from pydantic import BaseModel
from datetime import datetime

from app.models import OrderStatus


class OrderItemCreateRequest(BaseModel):
    product_id: int
    quantity: int


class OrederCreateRequest(BaseModel):
    branch_id: int
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
