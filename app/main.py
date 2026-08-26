from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.telegram import start_telegram_polling
from app.routers import (
    auth_router,
    courier_admin_router, 
    courier_router,
    product_router,
    order_router,
    branch_router,
    notif_router,
    location_router,
    users_router,
    promocode_router,
    subcategory_router,
    payment_router,
    delivery_router,
    discount_router,
    cart_router,
    telegram_router,
    admin_dashboard_router,
    settings_router,
    review_router,
    admin_analytics_router,
)
from app.admin.settings import admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_telegram_polling()
    yield


app = FastAPI(
    title="Foodify delivery service",
    description="Foodify - fast foof delivevery service inspired from Oqtepa and Evos, built in FatsAPI",
    lifespan=lifespan,
)


app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courier_router)
app.include_router(courier_admin_router)
app.include_router(branch_router)
app.include_router(notif_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(location_router)
app.include_router(promocode_router)
app.include_router(subcategory_router)
app.include_router(payment_router)
app.include_router(delivery_router)
app.include_router(discount_router)
app.include_router(telegram_router)
app.include_router(admin_dashboard_router)
app.include_router(settings_router)
app.include_router(review_router)
app.include_router(admin_analytics_router)

admin.mount_to(app=app)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
