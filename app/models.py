from datetime import datetime
from enum import Enum
from sqlalchemy import (
    BigInteger,
    Integer,
    Float,
    String,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    func,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderStatus(str, Enum):
    CREATED = "created"
    ACCEPTED = "accepted"
    DELIVERED = "delivered"


class BaseModel(Base):
    __abstract__ = True

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
    )


class User(BaseModel):
    __tablename__ = "users" 

    email: Mapped[str] = mapped_column(String(100), nullable=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=True)
    deleted_email: Mapped[str] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_courier: Mapped[bool] = mapped_column(Boolean, default=False)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)

    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="user", lazy="raise_on_sql"
    )
    addresses: Mapped[list["Address"]] = relationship(
        "Address", back_populates="user", lazy="raise_on_sql"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", lazy="raise_on_sql"
    )
    likes: Mapped[list["Like"]] = relationship(
        "Like", back_populates="user", lazy="raise_on_sql"
    )
    cart: Mapped["Cart"] = relationship(
        "Cart", back_populates="user", lazy="raise_on_sql"
    )
    deliveries: Mapped[list["Delivery"]] = relationship(
        "Delivery", back_populates="courier", lazy="raise_on_sql"
    )
    application: Mapped["CourierApplication"] = relationship(
        back_populates="user", uselist=False
    )
    wallet: Mapped["CourierWallet"] = relationship(
        "CourierWallet", back_populates="courier", lazy="raise_on_sql", uselist=False
    )
    reviews: Mapped[list["Review"]] = relationship(
        "Review", back_populates="user", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', phone='{self.phone}')>"


class Order(BaseModel):
    __tablename__ = "orders"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    address_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("addresses.id"))
    promocode_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("promocodes.id"), nullable=True
    )
    branch_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("branches.id"))
    status: Mapped[str] = mapped_column(String, default="created")
    total_price: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    user: Mapped["User"] = relationship(
        "User", back_populates="orders", lazy="raise_on_sql"
    )
    address: Mapped["Address"] = relationship(
        "Address", back_populates="orders", lazy="raise_on_sql"
    )
    promocode: Mapped["Promocodes"] = relationship(
        "Promocodes", back_populates="orders", lazy="raise_on_sql"
    )
    branch: Mapped["Branches"] = relationship(
        "Branches", back_populates="orders", lazy="raise_on_sql"
    )
    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", lazy="raise_on_sql"
    )
    payment: Mapped["Payment"] = relationship(
        "Payment", back_populates="order", lazy="raise_on_sql", uselist=False
    )
    delivery: Mapped["Delivery"] = relationship(
        "Delivery", back_populates="order", lazy="raise_on_sql", uselist=False
    )
    status_transitions: Mapped[list["OrderStatusTransition"]] = relationship(
        "OrderStatusTransition", back_populates="order", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id},  total_price={self.total_price})>"


class OrderItem(BaseModel):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[int] = mapped_column(BigInteger, nullable=False)

    order: Mapped["Order"] = relationship(
        "Order", back_populates="order_items", lazy="raise_on_sql"
    )
    product: Mapped["Product"] = relationship(
        "Product", back_populates="order_items", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity}, price={self.price})>"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("categories.id"))
    discount_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("discounts.id"), nullable=True
    )
    image_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("images.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[int] = mapped_column(BigInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=True, default=True)

    category: Mapped["Category"] = relationship(
        "Category", back_populates="products", lazy="raise_on_sql"
    )
    image: Mapped["Image"] = relationship(
        "Image", back_populates="product", lazy="raise_on_sql"
    )
    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="product", lazy="raise_on_sql"
    )
    likes: Mapped[list["Like"]] = relationship(
        "Like", back_populates="product", lazy="raise_on_sql"
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="product", lazy="raise_on_sql"
    )
    discount: Mapped["Discount"] = relationship(
        "Discount", back_populates="products", lazy="raise_on_sql"
    )
    reviews: Mapped[list["Review"]] = relationship(
        "Review", back_populates="product", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', price={self.price})>"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"


class Cart(BaseModel):
    __tablename__ = "carts"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    total_price: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    user: Mapped["User"] = relationship(
        "User", back_populates="cart", lazy="raise_on_sql"
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="cart", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Cart(id={self.id}, user_id={self.user_id}, total_price={self.total_price})>"


class CartItem(BaseModel):
    __tablename__ = "cart_items"

    cart_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("carts.id"))
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[int] = mapped_column(BigInteger, nullable=False)

    cart: Mapped["Cart"] = relationship(
        "Cart", back_populates="cart_items", lazy="raise_on_sql"
    )
    product: Mapped["Product"] = relationship(
        "Product", back_populates="cart_items", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<CartItem(id={self.id}, cart_id={self.cart_id}, product_id={self.product_id}, quantity={self.quantity}, price={self.price})>"


class Address(BaseModel):
    __tablename__ = "addresses"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    location_name: Mapped[str] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)

    user: Mapped["User"] = relationship(
        "User", back_populates="addresses", lazy="raise_on_sql"
    )

    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="address", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Address(id={self.id}, user_id={self.user_id}, latitude={self.latitude}, longitude={self.longitude})>"


class Payment(BaseModel):
    __tablename__ = "payments"

    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"))
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    payment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship(
        "Order", back_populates="payment", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Payment(id={self.id}, order_id={self.order_id}, amount={self.amount}, payment_type='{self.payment_type}', status='{self.status}', paid_at={self.paid_at})>"


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    image_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("images.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_sent_to_all: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(
        "User", back_populates="notifications", lazy="raise_on_sql"
    )
    image: Mapped["Image"] = relationship(
        "Image", back_populates="notification", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, title='{self.title}', message='{self.message}', is_read={self.is_read})>"


class Like(BaseModel):
    __tablename__ = "likes"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"))

    user: Mapped["User"] = relationship(
        "User", back_populates="likes", lazy="raise_on_sql"
    )
    product: Mapped["Product"] = relationship(
        "Product", back_populates="likes", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Like(id={self.id}, user_id={self.user_id}, product_id={self.product_id})>"


class Branches(Base):
    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=True)
    address: Mapped[str] = mapped_column(String(200), nullable=False)
    working_hours: Mapped[str] = mapped_column(String(100), nullable=False)
    branch_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)

    deliveries: Mapped[list["Delivery"]] = relationship(
        "Delivery", back_populates="branch", lazy="raise_on_sql"
    )
    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="branch", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Branch(id={self.id}, address='{self.address}', working_hours='{self.working_hours}', branch_phone='{self.branch_phone}')>"


class Promocodes(BaseModel):
    __tablename__ = "promocodes"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    discount_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    max_uses: Mapped[int] = mapped_column(BigInteger, nullable=True)
    used_count: Mapped[int] = mapped_column(BigInteger, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="promocode", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Promocode(id={self.id}, code='{self.code}', discount_percentage={self.discount_percentage}, discount_price={self.discount_price}, is_active={self.is_active})>"


class Delivery(BaseModel):
    __tablename__ = "deliveries"

    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"))
    courier_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=True
    )
    branch_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("branches.id"))
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    delivery_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=True
    )

    order: Mapped["Order"] = relationship(
        "Order", back_populates="delivery", lazy="raise_on_sql"
    )
    courier: Mapped["User"] = relationship(
        "User", back_populates="deliveries", lazy="raise_on_sql"
    )
    branch: Mapped["Branches"] = relationship(
        "Branches", back_populates="deliveries", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Delivery(id={self.id}, order_id={self.order_id}, courier_id={self.courier_id}, branch_id={self.branch_id}, status='{self.status}', delivery_time={self.delivery_time})>"


class Image(BaseModel):
    __tablename__ = "images"

    url: Mapped[str] = mapped_column(String(200), nullable=False)

    product: Mapped["Product"] = relationship(
        "Product", back_populates="image", lazy="raise_on_sql"
    )
    notification: Mapped["Notification"] = relationship(
        "Notification", back_populates="image", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Image(id={self.id}, url='{self.url}')>"


class Discount(BaseModel):
    __tablename__ = "discounts"

    name: Mapped[str] = mapped_column(String(50), nullable=True)
    discount_type: Mapped[str] = mapped_column(String(50), nullable=True)
    value: Mapped[int] = mapped_column(BigInteger)
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="discount", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<name {self.name}>"


class TokenBlackList(Base):
    __tablename__ = "token_blanc_list"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    token: Mapped[str] = mapped_column(String, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )

    def __repr__(self):
        return self.token


class TelegramLink(BaseModel):
    __tablename__ = "telegram_links"

    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    chat_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)

    def __repr__(self):
        return f"<TelegramLink(phone={self.phone}, chat_id={self.chat_id})>"


class CourierApplication(BaseModel):
    __tablename__ = "courier_applications"

    user_id: Mapped[str] = mapped_column(
        BigInteger, ForeignKey("users.id"), unique=True
    )
    status: Mapped[str] = mapped_column(String, default="PENDING")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="application")


class CourierWallet(BaseModel):
    __tablename__ = "courier_wallets"

    courier_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), unique=True, nullable=False
    )
    balance: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="UZS")

    courier: Mapped["User"] = relationship(
        "User", back_populates="wallet", lazy="raise_on_sql"
    )
    transactions: Mapped[list["WalletTransaction"]] = relationship(
        "WalletTransaction", back_populates="wallet", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<CourierWallet(courier_id={self.courier_id}, balance={self.balance})>"


class WalletTransaction(BaseModel):
    __tablename__ = "wallet_transactions"

    wallet_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("courier_wallets.id"), nullable=False
    )
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id"), nullable=True
    )
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)

    wallet: Mapped["CourierWallet"] = relationship(
        "CourierWallet", back_populates="transactions", lazy="raise_on_sql"
    )
    order: Mapped["Order"] = relationship("Order", lazy="raise_on_sql")

    def __repr__(self):
        return f"<WalletTransaction(id={self.id}, wallet_id={self.wallet_id}, amount={self.amount}')>"


class OrderStatusTransition(Base):
    __tablename__ = "order_status_transitions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"))
    from_status: Mapped[str] = mapped_column(String(20), nullable=False)
    to_status: Mapped[str] = mapped_column(String(20), nullable=False) 
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )

    order: Mapped["Order"] = relationship(
        "Order", back_populates="status_transitions", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<OrderStatusTransition {self.from_status} → {self.to_status}>"


class SiteSettings(BaseModel):
    __tablename__ = "site_settings"

    about_title: Mapped[str] = mapped_column(String(100), nullable=True)
    about_text: Mapped[str] = mapped_column(Text, nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[str] = mapped_column(String(100), nullable=True)
    contact_address: Mapped[str] = mapped_column(String(200), nullable=True)
    contact_hours: Mapped[str] = mapped_column(String(100), nullable=True)

    def __repr__(self):
        return f"<SiteSettings(id={self.id})>"


class Review(BaseModel):
    __tablename__ = "reviews"

    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"))
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    product: Mapped["Product"] = relationship(
        "Product", back_populates="reviews", lazy="raise_on_sql"
    )
    user: Mapped["User"] = relationship(
        "User", back_populates="reviews", lazy="raise_on_sql"
    )

    def __repr__(self):
        return f"<Review(id={self.id}, product_id={self.product_id}, rating={self.rating})>"
