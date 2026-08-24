import asyncio
from sqlalchemy import select
from fastapi import HTTPException, APIRouter
from geopy.geocoders import Nominatim

from app.database import db_dep
from app.models import Address
from app.dependencies import current_user_dep
from app.schemas.address import (
    AddressCreateRequest,
    AddressCreatResponse,
    AddressUpdateRequest,
    AddressListResponse,
)

router = APIRouter(prefix="/address", tags=["Address"])

geolocator = Nominatim(user_agent="fast_food")


@router.get("/location/{address_id}", response_model=AddressListResponse)
async def get_location(
    session: db_dep, address_id: int, current_user: current_user_dep
):
    stmt = select(Address).where(
        Address.id == address_id, Address.user_id == current_user.id
    )
    address = session.execute(stmt).scalars().first()

    if not address:
        raise HTTPException(status_code=404, detail="address not found")

    return address
    

@router.post("/create", response_model=AddressCreatResponse)
async def create_address(
    session: db_dep, current_user: current_user_dep, create_data: AddressCreateRequest
):
    location_query = f"{create_data.latitude}, {create_data.longitude}"

    user_address = await asyncio.get_event_loop().run_in_executor(
        None, lambda: geolocator.reverse(location_query, language="uz")
    )
    if not user_address:
        raise HTTPException(status_code=404, detail="Location not found!")

    address = Address(
        user_id=current_user.id,
        location_name=user_address.address,
        latitude=create_data.latitude,
        longitude=create_data.longitude,
    )

    session.add(address)
    session.commit()
    session.refresh(address)
    return address


@router.put("/update/{address_id}")
async def update_address(
    session: db_dep,
    address_id: int,
    current_user: current_user_dep,
    update_data: AddressUpdateRequest,
):

    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to update category")

    stmt = select(Address).where(Address.id == address_id)
    address = session.execute(stmt).scalars().first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    if update_data.location_name:
        address.location_name = update_data.location_name
    if update_data.latitude:
        address.latitude = update_data.latitude
    if update_data.longitude:
        address.longitude = update_data.longitude

    session.commit()
    session.refresh(address)

    return address
