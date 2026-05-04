from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from database import SessionLocal
import models
import schemas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Hello from the Restaurant Backend!"}

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connection successful!"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection failed: {str(e)}"}

# Login Endpoint
@app.post("/login/", response_model=schemas.LoginResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.pin_code == request.pin_code, 
        models.User.deleted_at == None
        ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid PIN code")
    
    return {"message": "Login succesful",
            "id": user.id,
            "name": user.name,
            "role_id": user.role_id}


# Roles Endpoints
@app.post("/roles/", response_model=schemas.RoleResponse)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    existing_role = db.query(models.Role).filter(models.Role.name == role.name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    new_role = models.Role(name=role.name)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@app.get("/roles/", response_model=list[schemas.RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(models.Role).all()
    return roles


#Users Endpoints
@app.get("/users/", response_model=list[schemas.UserResponse])
def get_active_users(db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.deleted_at == None).all()
    return users

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.pin_code == user.pin_code, 
        models.User.deleted_at == None
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this PIN code already exists")

    new_user = models.User(name=user.name, pin_code=user.pin_code, role_id=user.role_id, hourly_rate=user.hourly_rate)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.name = user_update.name
    if user_update.pin_code and user_update.pin_code.strip() != "":
        db_user.pin_code = user_update.pin_code
    db_user.role_id = user_update.role_id
    db_user.hourly_rate = user_update.hourly_rate

    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.deleted_at = datetime.now(timezone.utc)
    db_user.pin_code = f"X{db_user.id:03x}"
    db.commit()
    return {"message": "User marked as deleted"}

#Item Types Endpoints
@app.get("/item-types/", response_model=list[schemas.ItemTypeResponse])
def get_item_types(db: Session = Depends(get_db)):
    item_types = db.query(models.ItemType).filter(models.ItemType.deleted_at == None).all()
    return item_types

@app.post("/item-types/", response_model=schemas.ItemTypeResponse)
def create_item_type(item_type: schemas.ItemTypeCreate, db: Session = Depends(get_db)):
    existing_type = db.query(models.ItemType).filter(
        models.ItemType.type == item_type.type, 
        models.ItemType.deleted_at == None
        ).first()
    if existing_type:
        raise HTTPException(status_code=400, detail="Item type already exists") 
    
    new_item_type = models.ItemType(type=item_type.type, category=item_type.category)
    db.add(new_item_type)
    db.commit()
    db.refresh(new_item_type)
    return new_item_type

@app.put("/item-types/{type_id}", response_model=schemas.ItemTypeResponse)
def update_item_type(type_id: int, item_type_update: schemas.ItemTypeCreate, db: Session = Depends(get_db)):
    db_item_type = db.query(models.ItemType).filter(models.ItemType.id == type_id, models.ItemType.deleted_at == None).first()
    if not db_item_type:
        raise HTTPException(status_code=404, detail="Item type not found")
    
    if item_type_update.type and item_type_update.type.strip() != "":
        existing_type = db.query(models.ItemType).filter(
            models.ItemType.type == item_type_update.type, 
            models.ItemType.deleted_at == None, 
            models.ItemType.id != type_id
        ).first()
        if existing_type:
            raise HTTPException(status_code=400, detail="Another item type with this name already exists")

    db_item_type.type = item_type_update.type
    db_item_type.category = item_type_update.category

    db.commit()
    db.refresh(db_item_type)
    return db_item_type

@app.delete("/item-types/{type_id}")
def delete_item_type(type_id: int, db: Session = Depends(get_db)):
    db_item_type = db.query(models.ItemType).filter(
        models.ItemType.id == type_id, 
        models.ItemType.deleted_at == None
        ).first()
    if not db_item_type:
        raise HTTPException(status_code=404, detail="Item type not found")
    
    db_item_type.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Item type marked as deleted"}


# Products Endpoints
@app.get("/products/", response_model=list[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).filter(
        models.Product.deleted_at == None,
        ).all()
    return products

@app.post("/products/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    existing_product = db.query(models.Product).filter(
        models.Product.name == product.name, 
        models.Product.deleted_at == None
        ).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this name already exists")
    
    new_product = models.Product(name=product.name, price=product.price, type_id=product.type_id)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_update: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.deleted_at == None
        ).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product_update.name and product_update.name.strip() != "" and product_update.name != db_product.name:
        existing_product = db.query(models.Product).filter(
            models.Product.name == product_update.name, 
            models.Product.deleted_at == None, 
            models.Product.id != product_id
            ).first()
        if existing_product:
            raise HTTPException(status_code=400, detail="Another product with this name already exists")

    if product_update.type_id != db_product.type_id:
        active_type = db.query(models.ItemType).filter(
            models.ItemType.id == product_update.type_id, 
            models.ItemType.deleted_at == None
            ).first()
        if not active_type:
            raise HTTPException(status_code=400, detail="Assigned item type does not exist or is deleted")

    db_product.name = product_update.name
    db_product.price = product_update.price
    db_product.type_id = product_update.type_id

    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.deleted_at == None).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Product marked as deleted"}

# Orders Endpoints
@app.get("/orders/active", response_model=list[schemas.OrderResponse])
def get_active_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(
        models.Order.status == "In Progress"
    ).all()

    for order in orders:
        if order.waiter_id:
            order.waiter_name = order.waiter.name
        else:
            order.waiter_name = "Unknown"
    return orders

@app.post("/orders/", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    new_order = models.Order(waiter_id=order.waiter_id, table_nr=order.table_nr, status="In Progress")
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for item in order.items:
        new_item = models.OrderItem(order_id=new_order.id, product_id=item.product_id, quantity=item.quantity, description=item.description)
        db.add(new_item)
    
    db.commit()
    db.refresh(new_order)
    return new_order


# Shifts Endpoints

'''Helper function to get the current active shift for a user'''
def get_current_active_shift(db: Session, user_id: int):
    return db.query(models.Shift).filter(
        models.Shift.user_id == user_id,
        models.Shift.clock_out_time == None
    ).first()

@app.get("/users/{user_id}/shift/active", response_model=schemas.ShiftResponse)
def get_active_shift(user_id: int, db: Session = Depends(get_db)):
    active_shift = get_current_active_shift(db, user_id)
    if not active_shift:
        raise HTTPException(status_code=404, detail="No active shift found for this user")
    return active_shift

@app.post("/users/{user_id}/shift/clock-in", response_model=schemas.ShiftResponse)
def clock_in(user_id: int, db: Session = Depends(get_db)):
    if (get_current_active_shift(db, user_id)):
        raise HTTPException(status_code=400, detail="User already has an active shift")
    
    user = db.query(models.User).filter(
        models.User.id == user_id, 
        models.User.deleted_at == None
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_shift = models.Shift(
        user_id=user_id,
        hourly_rate=user.hourly_rate,
        clock_in_time=datetime.now(timezone.utc)
    )

    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)
    return new_shift

@app.put("/users/{user_id}/shift/clock-out", response_model=schemas.ShiftResponse)
def clock_out(user_id: int, db: Session = Depends(get_db)):
    active_shift = get_current_active_shift(db, user_id)
    if not active_shift:
        raise HTTPException(status_code=404, detail="No active shift found for this user")

    active_shift.clock_out_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(active_shift)
    return active_shift

@app.get("/users/{user_id}/shifts/", response_model=list[schemas.ShiftResponse])
def get_user_shifts(user_id: int, db: Session = Depends(get_db)):
    shifts = db.query(models.Shift).filter(
        models.Shift.user_id == user_id
        ).order_by(models.Shift.clock_in_time.desc()).all()
    return shifts

@app.get("/shifts/", response_model=list[schemas.ManagerShiftResponse])
def get_all_shifts(db: Session = Depends(get_db)):
    records = db.query(models.Shift, models.User).join(
        models.User, models.Shift.user_id == models.User.id).order_by(models.Shift.clock_in_time.desc()).all()
    
    result = []
    for shift, user in records:
        result.append({
            "id": shift.id,
            "user_id": user.id,
            "user_name": user.name if user else "Unknown",
            "hourly_rate": float(shift.hourly_rate),
            "clock_in_time": shift.clock_in_time,
            "clock_out_time": shift.clock_out_time,
            "notes": shift.notes
        })
        
    return result


@app.put("/shifts/{shift_id}", response_model=schemas.ShiftResponse)
def update_shift(shift_id: int, shift_update: schemas.ShiftUpdate, db: Session = Depends(get_db)):
    db_shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if shift_update.clock_in_time is not None:
        db_shift.clock_in_time = shift_update.clock_in_time
    if shift_update.clock_out_time is not None:
        db_shift.clock_out_time = shift_update.clock_out_time
    if shift_update.notes is not None:
        db_shift.notes = shift_update.notes

    db.commit()
    db.refresh(db_shift)
    return db_shift
