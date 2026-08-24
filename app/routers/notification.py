from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from typing import List

from app.database import db_dep
from app.models import Notification, User
from app.schemas.notification import NotificationCreateRequest, NotificationReadResponse
from app.dependencies import current_user_dep
from app.celery import send_email_celery

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/", status_code=201, response_model=None)
async def create_notification(
    create_data: NotificationCreateRequest,
    session: db_dep,
    current_user: current_user_dep,
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(
            status_code=403, detail="you are not allowed to create notification!"
        )
    if create_data.is_sent_to_all:
        stmt = select(User)
        users = session.execute(stmt).scalars().all()
        for user in users:
            n = Notification(
                user_id=user.id,
                title=create_data.title,
                message=create_data.message,
                image_id=create_data.image_id,
                is_sent_to_all=True,
            )
            session.add(n)
            send_email_celery.delay(user.email, create_data.title, create_data.message)
        session.commit()
        return {"status": "success", "message": "Notification sent to all users"}

    else:
        if not create_data.user_id:
            raise HTTPException(status_code=400, detail="user_id required")

        user = (
            session.execute(select(User).where(User.id == create_data.user_id))
            .scalars()
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        n = Notification(
            user_id=user.id,
            title=create_data.title,
            message=create_data.message,
            image_id=create_data.image_id,
        )
        session.add(n)
        session.commit()
        session.refresh(n)

        send_email_celery.delay(user.email, create_data.title, create_data.message)
        return n


@router.get("/user/{user_id}", response_model=List[NotificationReadResponse])
async def get_user_notifications(
    user_id: int, session: db_dep, current_user: current_user_dep
):
    if user_id != current_user.id and not (
        current_user.is_staff or current_user.is_superuser
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    stmt = select(Notification).where(Notification.user_id == user_id)
    notifications = session.execute(stmt).scalars().all()
    return notifications


@router.put("/{notification_id}/read", response_model=NotificationReadResponse)
async def mark_notification_read(
    notification_id: int, session: db_dep, current_user: current_user_dep
):
    notification = (
        session.execute(select(Notification).where(Notification.id == notification_id))
        .scalars()
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.user_id != current_user.id and not (
        current_user.is_staff or current_user.is_superuser
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    notification.is_read = True
    session.commit()
    session.refresh(notification)
    return notification
