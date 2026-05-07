import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app, get_db
from database import Base
import models
import schemas

# 1. Setup the In-Memory SQLite Database for Testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Override the dependency so FastAPI uses the test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# 3. Setup and Teardown for the database tables
@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# --- THE TESTS ---

def test_product_validation_unit():
    """Test Case 1: Pydantic should reject negative prices."""
    from pydantic import ValidationError
    
    with pytest.raises(ValidationError):
        # This should fail because price is -5.00
        schemas.ProductCreate(name="Classic Burger", price=-5.00, type_id=1)

def test_claim_available_table_integration():
    """Test Case 4: Claiming an Available Table."""
    
    # Step A: Seed the database with a dummy user (waiter)
    db = TestingSessionLocal()
    test_role = models.Role(name="Waiter")
    db.add(test_role)
    db.commit()
    
    test_user = models.User(name="Test Waiter", pin_code="1234", role_id=test_role.id)
    db.add(test_user)
    db.commit()
    
    # Step B: Make the API request to create an order
    response = client.post(
        "/orders/",
        json={"waiter_id": test_user.id, "table_nr": 4, "items": []}
    )
    
    # Step C: Assert the results
    assert response.status_code == 200
    data = response.json()
    assert data["table_nr"] == 4
    assert data["status"] == "In Progress"
    assert data["waiter_id"] == test_user.id