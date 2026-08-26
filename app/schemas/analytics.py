from pydantic import BaseModel


class DailyRevenuePoint(BaseModel):
    date: str
    revenue: int
    orders_count: int


class StatusBreakdownItem(BaseModel):
    status: str
    count: int


class TopProductItem(BaseModel):
    id: int
    name: str
    image_id: int | None
    orders_count: int
    revenue: int


class CategoryPerformanceItem(BaseModel):
    category_id: int
    category_name: str
    revenue: int
    orders_count: int


class AnalyticsResponse(BaseModel):
    total_revenue: int
    total_orders: int
    average_order_value: int
    average_rating: float | None
    revenue_trend: list[DailyRevenuePoint]
    status_breakdown: list[StatusBreakdownItem]
    top_products: list[TopProductItem]
    category_performance: list[CategoryPerformanceItem]
