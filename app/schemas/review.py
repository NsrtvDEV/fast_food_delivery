from datetime import datetime
from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    customer_name: str
    rating: int
    comment: str | None
    is_hidden: bool
    created_at: datetime


class ProductRatingSummary(BaseModel):
    average_rating: float | None
    review_count: int
