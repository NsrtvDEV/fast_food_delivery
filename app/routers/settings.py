from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.database import db_dep
from app.models import SiteSettings
from app.schemas.settings import SiteSettingsResponse, SiteSettingsUpdateRequest
from app.dependencies import current_user_dep

router = APIRouter(prefix="/settings", tags=["Site Settings"])

DEFAULTS = {
    "about_title": "О нас",
    "about_text": (
        "Foodify — сервис доставки еды. Мы готовим и доставляем свежие блюда "
        "быстро и с заботой о качестве."
    ),
    "contact_phone": "",
    "contact_email": "",
    "contact_address": "",
    "contact_hours": "",
}


def _get_or_create(session) -> SiteSettings:
    settings_row = session.execute(select(SiteSettings)).scalars().first()
    if not settings_row:
        settings_row = SiteSettings(**DEFAULTS)
        session.add(settings_row)
        session.commit()
        session.refresh(settings_row)
    return settings_row


@router.get("/", response_model=SiteSettingsResponse)
async def get_settings(session: db_dep):
    return _get_or_create(session)


@router.put("/", response_model=SiteSettingsResponse)
async def update_settings(
    session: db_dep,
    update_data: SiteSettingsUpdateRequest,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Staff access only")

    settings_row = _get_or_create(session)

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(settings_row, field, value)

    session.commit()
    session.refresh(settings_row)
    return settings_row
