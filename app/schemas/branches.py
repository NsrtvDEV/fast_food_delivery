from pydantic import BaseModel


class Branch_create_req(BaseModel):
    name: str | None = None
    address: str
    working_hours: str
    phone: str
    latitude: float
    longitude: float


class Branch_update_req(BaseModel):
    id: int
    name: str | None = None
    address: str | None = None
    working_hours: str | None = None
    phone: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class BranchResponse(BaseModel):
    id: int
    name: str | None = None
    address: str
    working_hours: str
    branch_phone: str
    latitude: float | None = None
    longitude: float | None = None
