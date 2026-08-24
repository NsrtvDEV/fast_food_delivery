from starlette_admin.contrib.sqla import Admin

from app.admin.auth import AdminAuthProvider
from app.database import engine
from app.models import (
    User,
    Product,
    CourierApplication,
    Payment,
    Promocodes,
    Discount,
    Image,
    Delivery,
    Branches,
    Like,
    Notification,
    Address,
    Cart,
    Category,
    Order,
    CourierWallet,
    WalletTransaction,
    OrderStatusTransition,
)

from app.admin.views import (
    UserAdminView,
    OrderAdminView,
    CourierApplicationView,
    ProductAdminView,
    CategoryAdminView,
    CartAdminView,
    AddressAdminView,
    PaymentAdminView,
    PromocodeAdminView,
    NotificationAdminView,
    LikeAdminView,
    ImageAdminView,
    BranchAdminView,
    DiscountAdminView,
    DeliveryAdminView,
    CourierWalletAdminView,
    WalletTransactionAdminView,
    OrderStatusTransitionsView,
)


admin = Admin(
    engine=engine,
    title="Foodify admin",
    base_url="/admin",
    auth_provider=AdminAuthProvider(),
)

admin.add_view(UserAdminView(User, icon="fa fa-user"))
admin.add_view(OrderAdminView(Order, icon="fa fa-receipt"))
admin.add_view(CourierApplicationView(CourierApplication, icon="fa fa-file-text"))
admin.add_view(ProductAdminView(Product, icon="fa fa-utensils"))
admin.add_view(CategoryAdminView(Category, icon="fa fa-folder"))
admin.add_view(CartAdminView(Cart, icon="fa fa-shopping-cart"))
admin.add_view(AddressAdminView(Address, icon="fa fa-location-dot"))
admin.add_view(PaymentAdminView(Payment, icon="fa fa-money-bill"))
admin.add_view(PromocodeAdminView(Promocodes, icon="fa fa-tag"))
admin.add_view(NotificationAdminView(Notification, icon="fa fa-bell"))
admin.add_view(LikeAdminView(Like, icon="fa fa-heart"))
admin.add_view(ImageAdminView(Image, icon="fa fa-image"))
admin.add_view(BranchAdminView(Branches, icon="fa fa-store"))
admin.add_view(DiscountAdminView(Discount, icon="fa fa-percent"))
admin.add_view(DeliveryAdminView(Delivery, icon="fa fa-shipping-fast"))
admin.add_view(CourierWalletAdminView(CourierWallet, icon="fa fa-wallet"))
admin.add_view(WalletTransactionAdminView(WalletTransaction, icon="fa fa-exchange-alt"))
admin.add_view(
    OrderStatusTransitionsView(OrderStatusTransition, icon="fa fa-exchange-alt")
)
