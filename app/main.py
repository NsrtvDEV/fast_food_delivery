from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
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
)
from app.admin.settings import admin

app = FastAPI(
    title="Foodify delivery service",
    description="Foodify - fast foof delivevery service inspired from Oqtepa and Evos, built in FatsAPI",
)


app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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

admin.mount_to(app=app)
