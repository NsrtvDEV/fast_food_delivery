from pydantic import BaseModel, EmailStr, model_validator


class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    is_active: bool
    is_staff: bool
    is_courier: bool
    is_superuser: bool
    is_deleted: bool
    telegram_linked: bool = False


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    new_password2: str

    @model_validator(mode="after")
    def check_passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.new_password2:
            raise ValueError("passwords do not match")
        if len(self.new_password) < 8:
            raise ValueError("password must be at least 8 characters long")
        return self
