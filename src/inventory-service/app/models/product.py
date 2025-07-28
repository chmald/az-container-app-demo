from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class ProductCategory(str, Enum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    BOOKS = "books"
    HOME_GARDEN = "home_garden"
    SPORTS = "sports"
    OTHER = "other"

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Product name")
    description: str = Field(..., max_length=1000, description="Product description")
    price: float = Field(..., gt=0, description="Product price")
    quantity: int = Field(..., ge=0, description="Available quantity")
    category: ProductCategory = Field(..., description="Product category")
    sku: Optional[str] = Field(None, max_length=50, description="Stock Keeping Unit")
    image_url: Optional[str] = Field(None, description="Product image URL")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    category: Optional[ProductCategory] = None
    sku: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = None

class Product(ProductBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    success: bool = True
    data: Optional[Product] = None
    message: Optional[str] = None

class ProductListResponse(BaseModel):
    success: bool = True
    data: List[Product] = []
    total: int = 0
    page: int = 1
    page_size: int = 10
    message: Optional[str] = None

class InventoryUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=0, description="New quantity value")

class StockLevel(str, Enum):
    OUT_OF_STOCK = "out_of_stock"
    LOW_STOCK = "low_stock"
    IN_STOCK = "in_stock"

class InventoryAlert(BaseModel):
    product_id: str
    product_name: str
    current_quantity: int
    stock_level: StockLevel
    threshold: int = 10
    timestamp: datetime = Field(default_factory=datetime.utcnow)