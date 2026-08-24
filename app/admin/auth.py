from sqlalchemy import select
from starlette.requests import Request
from starlette.responses import Response
from starlette_admin.auth import AdminUser, AuthProvider
from starlette_admin.exceptions import LoginFailed

from app.database import SessionLocal
from app.models import User
from app.utils import verify_password


class AdminAuthProvider(AuthProvider):
    async def login(
        self,
        username: str,
        password: str,
        remember_me: bool,
        request: Request,
        response: Response,
    ) -> Response:
        session = SessionLocal()
        try:
            user = session.execute(
                select(User).where(User.email == username)
            ).scalars().first()

            if (
                not user
                or not user.is_active
                or not (user.is_staff or user.is_superuser)
                or not verify_password(password, user.password_hash)
            ):
                raise LoginFailed("Invalid email or password")

            request.session.update({"user_id": user.id})
            return response
        finally:
            session.close()

    async def is_authenticated(self, request: Request) -> bool:
        user_id = request.session.get("user_id")
        if user_id is None:
            return False

        session = SessionLocal()
        try:
            user = session.get(User, user_id)
            if not user or not user.is_active or not (user.is_staff or user.is_superuser):
                return False
            request.state.user = user
            return True
        finally:
            session.close()

    def get_admin_user(self, request: Request) -> AdminUser:
        user = request.state.user
        return AdminUser(username=user.email)

    async def logout(self, request: Request, response: Response) -> Response:
        request.session.clear()
        return response
