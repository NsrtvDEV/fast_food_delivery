from pydantic import BaseModel


class ProductListResponse(BaseModel):
    id: int
    category_id: int
    image_id: int | None = None
    discount_id: int | None = None
    name: str
    description: str
    price: int
    final_price: int
    is_active: bool
    average_rating: float | None = None
    review_count: int = 0

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "subcategory_id": 2,
                    "image_id": 3,
                    "description": "katta mol gushti lavash",
                    "price": 37000,
                    "is_active": "True",
                }
            ]
        }
    }


class ProductUpdateRequest(BaseModel):
    category_id: int | None = None
    image_id: int | None = None
    discount_id: int | None = None
    name: str | None = None
    description: str | None = None
    price: int | None = None
    is_active: bool | None = None


class ProductCreateResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: str
    price: int
