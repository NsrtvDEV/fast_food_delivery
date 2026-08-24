from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from typing import List

from app.database import db_dep
from app.models import User, CourierApplication, CourierWallet
from app.schemas.courier import ApplicationStatus, ApplicationWithUser, DecisionRequest
from app.dependencies import current_user_dep

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/applications", response_model=List[ApplicationWithUser])
async def list_applications(
    session: db_dep,
    current_user: current_user_dep,
    status: ApplicationStatus | None = None,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="not allow to see this page")

    app_stmt = select(CourierApplication)

    if status:
        apps = app_stmt.where(CourierApplication.status == status)

    stmt = apps.order_by(CourierApplication.created_at.desc())

    result = session.execute(stmt)
    apps = result.scalars().all()

    return apps


@router.get("/applications/{application_id}", response_model=ApplicationWithUser)
async def get_application(
    application_id: str,
    session: db_dep,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not authorized to see this page")

    stmt = select(CourierApplication).where(CourierApplication.id == application_id)
    app = session.execute(stmt).scalars().first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.patch(
    "/applications/{application_id}/decision", response_model=ApplicationWithUser
)
async def make_decision(
    application_id: str,
    data: DecisionRequest,
    session: db_dep,
    current_user: current_user_dep,
):

    stmt = select(CourierApplication).where(CourierApplication.id == application_id)
    app = session.execute(stmt).scalars().first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.status != ApplicationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"The application has already been processed. (status: {app.status})",
        )

    if data.status == ApplicationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot set the status to PENDING manually",
        )

    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Not allow for you")

    app.status = data.status

    if data.status == ApplicationStatus.APPROVED:
        stmt = select(User).where(User.id == app.user_id)
        user = session.execute(stmt).scalars().first()
        user.is_courier = True

        wallet = CourierWallet(courier_id=user.id, balance=0, currency="UZS")
        session.add(wallet)

    session.commit()
    session.refresh(app)

    return app
