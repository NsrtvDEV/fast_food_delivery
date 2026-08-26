from pydantic import BaseModel


class SiteSettingsResponse(BaseModel):
    about_title: str | None = None
    about_text: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    contact_address: str | None = None
    contact_hours: str | None = None


class SiteSettingsUpdateRequest(BaseModel):
    about_title: str | None = None
    about_text: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    contact_address: str | None = None
    contact_hours: str | None = None
