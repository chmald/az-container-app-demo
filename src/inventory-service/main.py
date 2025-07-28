from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import os

from app.routers import inventory
from app.utils.logger import configure_logging, get_logger

# Configure logging
configure_logging(os.getenv("LOG_LEVEL", "INFO"))
logger = get_logger()

# Create FastAPI application
app = FastAPI(
    title="Inventory Service",
    description="Inventory management microservice with Dapr integration",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"]  # Configure appropriately for production
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log the request
    logger.info(
        "HTTP Request",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=f"{process_time:.4f}s"
    )
    
    return response

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        error=str(exc),
        url=str(request.url),
        method=request.method
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error"
        }
    )

# Include routers
app.include_router(inventory.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "success": True,
        "service": "inventory-service",
        "message": "Inventory Service is running",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "success": True,
        "service": "inventory-service",
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Inventory Service starting up", version="1.0.0")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Inventory Service shutting down")

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_config=None  # Use our custom logging
    )