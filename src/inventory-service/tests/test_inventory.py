import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["service"] == "inventory-service"
    assert response.json()["status"] == "healthy"

def test_get_products():
    """Test get all products endpoint"""
    response = client.get("/api/inventory/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)

def test_get_product_by_id():
    """Test get product by ID endpoint"""
    # Test with existing product
    response = client.get("/api/inventory/product-001")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == "product-001"

def test_get_product_not_found():
    """Test get non-existent product"""
    response = client.get("/api/inventory/non-existent-id")
    assert response.status_code == 404

def test_create_product():
    """Test create new product endpoint"""
    product_data = {
        "name": "Test Product",
        "description": "A test product",
        "price": 99.99,
        "quantity": 10,
        "category": "electronics",
        "sku": "TEST-001"
    }
    
    response = client.post("/api/inventory/", json=product_data)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == product_data["name"]
    assert data["data"]["price"] == product_data["price"]

def test_create_product_validation_error():
    """Test create product with invalid data"""
    invalid_data = {
        "name": "",  # Empty name should fail validation
        "price": -10  # Negative price should fail validation
    }
    
    response = client.post("/api/inventory/", json=invalid_data)
    assert response.status_code == 422  # Validation error

def test_search_products():
    """Test product search functionality"""
    response = client.get("/api/inventory/?search=laptop")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    # Should find products containing "laptop" in name or description

def test_low_stock_products():
    """Test low stock alert endpoint"""
    response = client.get("/api/inventory/alerts/low-stock?threshold=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)