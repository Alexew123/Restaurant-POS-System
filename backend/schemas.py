from pydantic import BaseModel, Field


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

    
    







    