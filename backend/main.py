from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.pin_code == user.pin_code).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this PIN code already exists")

    new_user = models.User(name=user.name, pin_code=user.pin_code, role_id=user.role_id, hourly_rate=user.hourly_rate)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/item-types/", response_model=schemas.ItemTypeResponse)
def create_item_type(item_type: schemas.ItemTypeCreate, db: Session = Depends(get_db)):
    existing_type = db.query(models.ItemType).filter(models.ItemType.type == item_type.type).first()
    if existing_type:
        raise HTTPException(status_code=400, detail="Item type already exists") 
    
    new_item_type = models.ItemType(type=item_type.type, category=item_type.category)
    db.add(new_item_type)
    db.commit()
    db.refresh(new_item_type)
    return new_item_type

@app.post("/products/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    existing_product = db.query(models.Product).filter(models.Product.name == product.name).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this name already exists")
    
    new_product = models.Product(name=product.name, price=product.price, type_id=product.type_id)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

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

@app.post("/login/", response_model=schemas.LoginResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.pin_code == request.pin_code).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid PIN code")
    
    return {"message": "Login succesful",
            "id": user.id,
            "name": user.name,
            "role_id": user.role_id}