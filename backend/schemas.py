from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


# Roles
class RoleCreate(BaseModel):
    name: str

class RoleResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}

# Users
class UserCreate(BaseModel):
    name: str
    pin_code: str = Field(..., min_length=4, max_length=4)
    role_id: int
    hourly_rate: Decimal


class UserResponse(BaseModel):
    id: int
    name: str
    role_id: int
    hourly_rate: Decimal
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    name: str
    pin_code: str | None = None
    role_id: int
    hourly_rate: Decimal

# Item Types
class ItemTypeCreate(BaseModel):
    type: str
    category: str
    
class ItemTypeResponse(BaseModel):
    id: int
    type: str
    category: str
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
    

# Products
class ProductCreate(BaseModel):
    name: str
    price: float = Field(..., gt=0, description="Price must be strictly positive")
    type_id: int

class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    type_id: int
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

# Order Items
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    description: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    description: Optional[str] = None

    model_config = {"from_attributes": True}

# Orders
class OrderCreate(BaseModel):
    waiter_id: int
    table_nr: int
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    waiter_id: int
    table_nr: int
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = {"from_attributes": True}

# Login
class LoginRequest(BaseModel):
    pin_code: str
    
class LoginResponse(BaseModel):
    message: str
    id: int
    name: str
    role_id: int

# Shifts
class ShiftCreate(BaseModel):
    notes: Optional[str] = None

class ShiftResponse(BaseModel):
    id: int
    user_id: int
    hourly_rate: Decimal
    clock_in_time: datetime
    clock_out_time: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}