from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


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


class UserResponse(BaseModel):
    id: int
    name: str
    role_id: int

    model_config = {"from_attributes": True}

# Item Types
class ItemTypeCreate(BaseModel):
    type: str
    category: str
    
class ItemTypeResponse(BaseModel):
    id: int
    type: str
    category: str

    model_config = {"from_attributes": True}
    

# Products
class ProductCreate(BaseModel):
    name: str
    price: float
    type_id: int

class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    type_id: int

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


class LoginRequest(BaseModel):
    pin_code: str
    
class LoginResponse(BaseModel):
    message: str
    id: int
    name: str
    role_id: int