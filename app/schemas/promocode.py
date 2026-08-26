from pydantic import BaseModel


class CreatePromocodeRequest(BaseModel):
    code: str
    discount_percentage: int
    is_active: bool
    max_uses: int


class UpdatepromocodeRequest(BaseModel):
    code: str
    discount_percentage: int
    max_uses: int
    is_active: bool


class ApplyPromocodeRequest(BaseModel):
    code: str
    price: int


class PromocodeListResponse(BaseModel):
    id: int
    code: str
    discount_percentage: int
    max_uses: int
    used_count: int
    is_active: bool
