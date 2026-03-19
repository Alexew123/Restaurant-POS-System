from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Text, Boolean,  DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    pin_code = Column(String(4), unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    hourly_rate = Column(Numeric(10,2), default=0.00)
    deleted_at = Column(DateTime, nullable=True, default=None)

    role = relationship("Role", back_populates="users")
    shifts = relationship("Shift", back_populates="user")   

class ItemType(Base):
    __tablename__ = "item_types"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), unique=True, nullable=False)
    category = Column(String(50), nullable=False)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    type_id = Column(Integer, ForeignKey("item_types.id"))

    category = relationship("ItemType", back_populates="products")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    waiter_id = Column(Integer, ForeignKey("users.id"))
    table_nr = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="In Progress")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    waiter = relationship("User")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    clock_in_time = Column(DateTime, default=func.now())
    clock_out_time = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="shifts")
