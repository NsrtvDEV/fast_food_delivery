from celery import Celery

from app.config import settings

from app.utils import send_email


celery = Celery(
    __name__,
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)


@celery.task(bind=True, name="send_email_celery")
def send_email_celery(self, to_email: str, subject: str, body: str):
    try:
        send_email(to_email=to_email, subject=subject, body=body)
        return True
    except Exception as e:
        raise self.retry(exc=e)
