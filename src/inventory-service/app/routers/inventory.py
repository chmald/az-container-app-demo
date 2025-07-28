from fastapi import APIRouter, HTTPException, Query, Path
from typing import List, Optional
import asyncio

from app.models.product import (
    Product, ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    InventoryUpdateRequest
)
from app.services.inventory_service import InventoryService
from app.utils.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/inventory", tags=["inventory"])

# Initialize inventory service
inventory_service = InventoryService()

@router.get("/", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search query for product name or description")
):
    """
    Get all products with optional pagination and search.
    """
    try:
        if search:
            products = await inventory_service.search_products(search)
            return ProductListResponse(
                data=products,
                total=len(products),
                page=1,
                page_size=len(products),
                message=f"Found {len(products)} products matching '{search}'"
            )
        else:
            result = await inventory_service.get_all_products(page=page, page_size=page_size)
            return ProductListResponse(**result)
    except Exception as e:
        logger.error("Error getting products", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str = Path(..., description="Product ID")
):
    """
    Get a specific product by ID.
    """
    try:
        product = await inventory_service.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return ProductResponse(data=product, message="Product retrieved successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting product", product_id=product_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(product_data: ProductCreate):
    """
    Create a new product.
    """
    try:
        product = await inventory_service.create_product(product_data)
        return ProductResponse(data=product, message="Product created successfully")
    except Exception as e:
        logger.error("Error creating product", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create product")

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_data: ProductUpdate,
    product_id: str = Path(..., description="Product ID")
):
    """
    Update an existing product.
    """
    try:
        product = await inventory_service.update_product(product_id, product_data)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return ProductResponse(data=product, message="Product updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating product", product_id=product_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update product")

@router.put("/{product_id}/inventory", response_model=ProductResponse)
async def update_inventory(
    inventory_data: InventoryUpdateRequest,
    product_id: str = Path(..., description="Product ID")
):
    """
    Update product inventory quantity.
    """
    try:
        product = await inventory_service.update_inventory(product_id, inventory_data.quantity)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return ProductResponse(data=product, message="Inventory updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating inventory", product_id=product_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update inventory")

@router.get("/alerts/low-stock", response_model=ProductListResponse)
async def get_low_stock_products(
    threshold: int = Query(10, ge=0, description="Low stock threshold")
):
    """
    Get products with low stock.
    """
    try:
        products = await inventory_service.get_low_stock_products(threshold)
        return ProductListResponse(
            data=products,
            total=len(products),
            page=1,
            page_size=len(products),
            message=f"Found {len(products)} products with stock <= {threshold}"
        )
    except Exception as e:
        logger.error("Error getting low stock products", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health", include_in_schema=False)
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "success": True,
        "service": "inventory-service",
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }