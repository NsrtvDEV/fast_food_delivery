from pydantic import BaseModel
from datetime import datetime


class RecentOrderResponse(BaseModel):
    id: int
    customer_name: str
    items_summary: str
    status: str
    created_at: datetime
    total_price: int


class DeliveryPerformanceResponse(BaseModel):
    on_time_rate: float | None
    early: int
    on_time: int
    late: int


class DailyRevenueResponse(BaseModel):
    date: str
    revenue: int


class TopSellingProductResponse(BaseModel):
    id: int
    name: str
    image_id: int | None
    orders_count: int
    revenue: int


class DashboardResponse(BaseModel):
    orders_today: int
    orders_change_pct: float | None
    out_for_delivery: int
    avg_delivery_minutes: float | None
    revenue_today: int
    revenue_change_pct: float | None
    delivery_performance: DeliveryPerformanceResponse
    recent_orders: list[RecentOrderResponse]
    weekly_revenue: list[DailyRevenueResponse]
    top_selling: list[TopSellingProductResponse]
