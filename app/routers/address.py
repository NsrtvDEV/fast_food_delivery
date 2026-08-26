import asyncio
import logging
from sqlalchemy import select, func
from fastapi import HTTPException, APIRouter
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError

from app.database import db_dep
from app.models import Address, Order
from app.dependencies import current_user_dep
from app.schemas.address import (
    AddressCreateRequest,
    AddressCreatResponse,
    AddressUpdateRequest,
    AddressListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/address", tags=["Address"])

geolocator = Nominatim(user_agent="fast_food")


@router.get("/list/", response_model=list[AddressListResponse])
async def list_addresses(session: db_dep, current_user: current_user_dep):
    stmt = (
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.id.desc())
    )
    return session.execute(stmt).scalars().all()


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

    try:
        user_address = await asyncio.get_event_loop().run_in_executor(
            None, lambda: geolocator.reverse(location_query, language="uz", timeout=10)
        )
    except (GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError) as e:
        logger.warning("Geocoder unavailable for %s: %s", location_query, e)
        raise HTTPException(
            status_code=503,
            detail="Address lookup service is temporarily unavailable, please try again",
        )
    except Exception as e:
        logger.exception("Unexpected geocoding failure for %s", location_query)
        raise HTTPException(
            status_code=502, detail=f"Address lookup failed: {e}"
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

    stmt = select(Address).where(
        Address.id == address_id, Address.user_id == current_user.id
    )
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


@router.delete("/{address_id}", status_code=204)
async def delete_address(
    session: db_dep, address_id: int, current_user: current_user_dep
):
    stmt = select(Address).where(
        Address.id == address_id, Address.user_id == current_user.id
    )
    address = session.execute(stmt).scalars().first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    orders_count = session.execute(
        select(func.count(Order.id)).where(Order.address_id == address_id)
    ).scalar_one()
    if orders_count:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete address: {orders_count} order(s) use it",
        )

    session.delete(address)
    session.commit()
