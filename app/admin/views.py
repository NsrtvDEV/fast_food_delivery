from starlette.requests import Request
from starlette_admin.contrib.sqla import ModelView
from starlette_admin.fields import PasswordField

from app.utils import hash_password


class UserAdminView(ModelView):
    fields = [
        "id",
        "email",
        PasswordField("password_hash", label="Password", exclude_from_edit=True),
        "first_name",
        "last_name",
        "is_active",
        "is_courier",
        "is_staff",
        "is_superuser",
        "deleted_email",
        "created_at",
        "updated_at",
        "is_deleted",
    ]

    exclude_fields_from_list = ["password_hash", "deleted_email", "is_deleted"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]

    async def before_create(self, request: Request, data: dict, obj) -> None:
        # The form only ever collects a plaintext password; it is hashed here
        # so a raw password hash is never something the admin types or edits.
        obj.password_hash = hash_password(data["password_hash"])


class OrderAdminView(ModelView):
    fields = [
        "id",
        "user",
        "address",
        "promocode",
        "branch",
        "status",
        "total_price",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["address", "promocode"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at", "user", "address"]


class ProductAdminView(ModelView):
    fields = [
        "id",
        "category",
        "image",
        "name",
        "description",
        "price",
    ]

    exclude_fields_from_list = ["description"]
    exclude_fields_from_create = ["id"]
    exclude_fields_from_edit = ["id"]


class CategoryAdminView(ModelView):
    fields = ["id", "name"]

    exclude_fields_from_create = ["id"]
    exclude_fields_from_edit = ["id"]


class CartAdminView(ModelView):
    fields = [
        "id",
        "user",
        "total_price",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_create = ["id", "total_price", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "user", "total_price", "created_at", "updated_at"]


class AddressAdminView(ModelView):
    fields = [
        "id",
        "user",
        "latitude",
        "longitude",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["created_at", "updated_at"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = [
        "id",
        "user",
        "latitude",
        "longitude",
        "created_at",
        "updated_at",
    ]


class PaymentAdminView(ModelView):
    fields = [
        "id",
        "order",
        "amount",
        "payment_type",
        "status",
        "paid_at",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["payment_type", "created_at", "updated_at"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = [
        "id",
        "order",
        "amount",
        "payment_type",
        "created_at",
        "updated_at",
    ]


class PromocodeAdminView(ModelView):
    fields = [
        "id",
        "code",
        "discount_percentage",
        "is_active",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["created_at", "updated_at"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]


class NotificationAdminView(ModelView):
    fields = [
        "id",
        "user",
        "image",
        "title",
        "message",
        "is_read",
        "is_sent_to_all",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["user", "image", "message"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]


class LikeAdminView(ModelView):
    fields = [
        "id",
        "user",
        "product",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]


class ImageAdminView(ModelView):
    fields = ["id", "url", "created_at", "updated_at"]

    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]


class BranchAdminView(ModelView):
    fields = ["id", "address", "working_hours", "branch_phone"]

    exclude_fields_from_list = ["address"]
    exclude_fields_from_create = ["id"]
    exclude_fields_from_edit = ["id"]


class DiscountAdminView(ModelView):
    fields = [
        "id",
        "name",
        "discount_type",
        "value",
        "is_active",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["created_at", "updated_at", "discount_type"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]


class DeliveryAdminView(ModelView):
    fields = [
        "id",
        "order",
        "courier",
        "branch",
        "status",
        "delivery_time",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["order", "courier", "created_at", "updated_at"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "order", "courier", "created_at", "updated_at"]


class CourierApplicationView(ModelView):
    fields = [
        "id",
        "user",
        "status",
        "message",
        "admin_note",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["message", "created_at", "updated_at"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]


class CourierWalletAdminView(ModelView):
    fields = [
        "id",
        "courier",
        "balance",
        "currency",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["created_at", "updated_at"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at", "balance", "currency"]


class WalletTransactionAdminView(ModelView):
    fields = [
        "id",
        "wallet",
        "order",
        "amount",
        "created_at",
        "updated_at",
    ]

    exclude_fields_from_list = ["description", "created_at", "updated_at"]
    exclude_fields_from_create = ["id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "created_at", "updated_at"]


class OrderStatusTransitionsView(ModelView):
    fields = ["id", "order", "from_status", "to_status", "reason", "created_at"]

    exclude_fields_from_create = [
        "id",
        "order",
        "from_status",
        "to_status",
        "reason",
        "created_at",
    ]
    exclude_fields_from_list = ["reason"]
    exclude_fields_from_edit = [
        "id",
        "order",
        "from_status",
        "to_status",
        "reason",
        "created_at",
    ]
