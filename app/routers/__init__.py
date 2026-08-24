from .auth import auth_router
from .branches import router as branch_router
from .product import router as product_router
from .cart import router as cart_router
from .order import router as order_router
from .notification import router as notif_router
from .address import router as location_router
from .users import router as users_router
from .promocode import router as promocode_router
from .category import router as subcategory_router
from .payment import router as payment_router
from .delivery import router as delivery_router
from .discount import router as discount_router
from .courier import router as courier_router
from .courier_admin import router as courier_admin_router
from .telegram import router as telegram_router

__all__ = [
    "auth_router",
    "courier_admin_router",
    "courier_router",
    "product_router",
    "order_router",
    "cart_router",
    "notif_router",
    "branch_router",
    "location_router",
    "users_router",
    "promocode_router",
    "subcategory_router",
    "payment_router",
    "delivery_router",
    "discount_router",
    "telegram_router",
]