from typing import Dict, List, Optional
from datetime import datetime
import asyncio
import json
from uuid import uuid4

from dapr.clients import DaprClient
from dapr.clients.grpc._state import StateItem

from app.models.product import Product, ProductCreate, ProductUpdate, StockLevel, InventoryAlert
from app.utils.logger import get_logger

logger = get_logger()

class InventoryService:
    def __init__(self):
        self.dapr_client = DaprClient()
        self.store_name = "statestore"
        self.pubsub_name = "pubsub"
        
        # Initialize with sample data for demo purposes
        self._initialize_sample_data()

    def _initialize_sample_data(self) -> None:
        """Initialize sample product data for demonstration."""
        sample_products = [
            Product(
                id="product-001",
                name="Gaming Laptop",
                description="High-performance gaming laptop with RTX 4080",
                price=1899.99,
                quantity=15,
                category="electronics",
                sku="LAPTOP-GAMING-001",
                image_url="https://example.com/images/gaming-laptop.jpg"
            ),
            Product(
                id="product-002",
                name="Wireless Mouse",
                description="Ergonomic wireless mouse with RGB lighting",
                price=29.99,
                quantity=50,
                category="electronics",
                sku="MOUSE-WIRELESS-001"
            ),
            Product(
                id="product-003",
                name="Mechanical Keyboard",
                description="Cherry MX Blue mechanical keyboard",
                price=79.99,
                quantity=25,
                category="electronics",
                sku="KEYBOARD-MECH-001"
            ),
            Product(
                id="product-004",
                name="Running Shoes",
                description="Lightweight running shoes for daily training",
                price=129.99,
                quantity=8,  # Low stock
                category="sports",
                sku="SHOES-RUNNING-001"
            ),
            Product(
                id="product-005",
                name="Coffee Maker",
                description="Programmable drip coffee maker",
                price=89.99,
                quantity=0,  # Out of stock
                category="home_garden",
                sku="COFFEE-MAKER-001"
            )
        ]
        
        self.sample_products = {product.id: product for product in sample_products}
        logger.info("Sample product data initialized", count=len(sample_products))

    async def get_all_products(self, page: int = 1, page_size: int = 10) -> Dict:
        """Retrieve all products with pagination."""
        try:
            # In a real implementation, this would query the database
            # For demo purposes, return sample data
            products = list(self.sample_products.values())
            
            # Calculate pagination
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_products = products[start_idx:end_idx]
            
            logger.info("Retrieved products", total=len(products), page=page, page_size=page_size)
            
            return {
                "success": True,
                "data": paginated_products,
                "total": len(products),
                "page": page,
                "page_size": page_size
            }
        except Exception as e:
            logger.error("Error retrieving products", error=str(e))
            raise

    async def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """Retrieve a product by ID."""
        try:
            # In a real implementation, this would query the state store
            product = self.sample_products.get(product_id)
            
            if product:
                logger.info("Retrieved product", product_id=product_id)
            else:
                logger.warning("Product not found", product_id=product_id)
            
            return product
        except Exception as e:
            logger.error("Error retrieving product", product_id=product_id, error=str(e))
            raise

    async def create_product(self, product_data: ProductCreate) -> Product:
        """Create a new product."""
        try:
            new_product = Product(**product_data.dict())
            
            # Save to state store via Dapr
            try:
                state_data = new_product.dict()
                state_data['created_at'] = state_data['created_at'].isoformat()
                state_data['updated_at'] = state_data['updated_at'].isoformat()
                
                await self.dapr_client.save_state(
                    store_name=self.store_name,
                    key=f"product-{new_product.id}",
                    value=json.dumps(state_data)
                )
            except Exception as e:
                logger.warning("Could not save to state store, using in-memory", error=str(e))
                self.sample_products[new_product.id] = new_product

            # Publish product created event
            try:
                await self.dapr_client.publish_event(
                    pubsub_name=self.pubsub_name,
                    topic_name="product-created",
                    data=new_product.dict()
                )
                logger.info("Published product created event", product_id=new_product.id)
            except Exception as e:
                logger.warning("Could not publish product created event", error=str(e))

            logger.info("Created new product", product_id=new_product.id, name=new_product.name)
            return new_product
        except Exception as e:
            logger.error("Error creating product", error=str(e))
            raise

    async def update_product(self, product_id: str, product_data: ProductUpdate) -> Optional[Product]:
        """Update an existing product."""
        try:
            existing_product = await self.get_product_by_id(product_id)
            if not existing_product:
                return None

            # Update fields
            update_data = product_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing_product, field, value)
            
            existing_product.updated_at = datetime.utcnow()

            # Save to state store
            try:
                state_data = existing_product.dict()
                state_data['created_at'] = state_data['created_at'].isoformat()
                state_data['updated_at'] = state_data['updated_at'].isoformat()
                
                await self.dapr_client.save_state(
                    store_name=self.store_name,
                    key=f"product-{product_id}",
                    value=json.dumps(state_data)
                )
            except Exception as e:
                logger.warning("Could not save to state store, updating in-memory", error=str(e))
                self.sample_products[product_id] = existing_product

            # Publish product updated event
            try:
                await self.dapr_client.publish_event(
                    pubsub_name=self.pubsub_name,
                    topic_name="product-updated",
                    data=existing_product.dict()
                )
                logger.info("Published product updated event", product_id=product_id)
            except Exception as e:
                logger.warning("Could not publish product updated event", error=str(e))

            logger.info("Updated product", product_id=product_id)
            return existing_product
        except Exception as e:
            logger.error("Error updating product", product_id=product_id, error=str(e))
            raise

    async def update_inventory(self, product_id: str, quantity: int) -> Optional[Product]:
        """Update product inventory quantity."""
        try:
            product = await self.get_product_by_id(product_id)
            if not product:
                return None

            old_quantity = product.quantity
            product.quantity = quantity
            product.updated_at = datetime.utcnow()

            # Save updated product
            updated_product = await self.update_product(product_id, ProductUpdate(quantity=quantity))

            # Check for stock level changes and publish alerts
            await self._check_stock_level_and_publish_alert(updated_product)

            # Publish inventory updated event
            try:
                await self.dapr_client.publish_event(
                    pubsub_name=self.pubsub_name,
                    topic_name="inventory-updated",
                    data={
                        "product_id": product_id,
                        "old_quantity": old_quantity,
                        "new_quantity": quantity,
                        "product": updated_product.dict() if updated_product else None
                    }
                )
                logger.info("Published inventory updated event", 
                          product_id=product_id, 
                          old_quantity=old_quantity, 
                          new_quantity=quantity)
            except Exception as e:
                logger.warning("Could not publish inventory updated event", error=str(e))

            return updated_product
        except Exception as e:
            logger.error("Error updating inventory", product_id=product_id, error=str(e))
            raise

    async def _check_stock_level_and_publish_alert(self, product: Product) -> None:
        """Check stock level and publish alerts if necessary."""
        try:
            stock_level = self._get_stock_level(product.quantity)
            
            if stock_level in [StockLevel.OUT_OF_STOCK, StockLevel.LOW_STOCK]:
                alert = InventoryAlert(
                    product_id=product.id,
                    product_name=product.name,
                    current_quantity=product.quantity,
                    stock_level=stock_level
                )

                try:
                    await self.dapr_client.publish_event(
                        pubsub_name=self.pubsub_name,
                        topic_name="inventory-alert",
                        data=alert.dict()
                    )
                    logger.info("Published inventory alert", 
                              product_id=product.id, 
                              stock_level=stock_level.value)
                except Exception as e:
                    logger.warning("Could not publish inventory alert", error=str(e))
        except Exception as e:
            logger.error("Error checking stock level", product_id=product.id, error=str(e))

    def _get_stock_level(self, quantity: int, low_stock_threshold: int = 10) -> StockLevel:
        """Determine stock level based on quantity."""
        if quantity == 0:
            return StockLevel.OUT_OF_STOCK
        elif quantity <= low_stock_threshold:
            return StockLevel.LOW_STOCK
        else:
            return StockLevel.IN_STOCK

    async def get_low_stock_products(self, threshold: int = 10) -> List[Product]:
        """Get products with low stock."""
        try:
            products = list(self.sample_products.values())
            low_stock_products = [p for p in products if p.quantity <= threshold]
            
            logger.info("Retrieved low stock products", 
                       count=len(low_stock_products), 
                       threshold=threshold)
            return low_stock_products
        except Exception as e:
            logger.error("Error retrieving low stock products", error=str(e))
            raise

    async def search_products(self, query: str) -> List[Product]:
        """Search products by name or description."""
        try:
            products = list(self.sample_products.values())
            query_lower = query.lower()
            
            matching_products = [
                p for p in products 
                if query_lower in p.name.lower() or query_lower in p.description.lower()
            ]
            
            logger.info("Searched products", query=query, results=len(matching_products))
            return matching_products
        except Exception as e:
            logger.error("Error searching products", query=query, error=str(e))
            raise