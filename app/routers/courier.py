from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.database import db_dep
from app.models import CourierApplication
from app.schemas.courier import ApplicationStatus
from app.schemas.courier import ApplyRequest, ApplicationOut
from app.dependencies import current_user_dep

router = APIRouter(prefix="/api/courier", tags=["Courier"])


@router.post(
    "/apply", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED
)
async def apply_for_courier(
    create_data: ApplyRequest,
    session: db_dep,
    current_user: current_user_dep,
):

    stmt = select(CourierApplication).where(
        CourierApplication.user_id == current_user.id
    )
    existng = session.execute(stmt).scalars().first()

    if existng:
        if existng.status == ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The application has already been submitted and is awaiting review.",
            )
        if existng.status == ApplicationStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already a courier",
            )
        session.delete(existng)
        session.flush()

    application = CourierApplication(
        user_id=current_user.id,
        message=create_data.message,
    )
    session.add(application)
    session.commit()
    session.refresh(application)

    return application


@router.get("/application/me", response_model=ApplicationOut)
async def my_application(
    session: db_dep,
    current_user: current_user_dep,
):
    stmt = select(CourierApplication).where(
        CourierApplication.user_id == current_user.id
    )
    app = session.execute(stmt).scalars().first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="applicay=tion not found ",
        )
    return app
