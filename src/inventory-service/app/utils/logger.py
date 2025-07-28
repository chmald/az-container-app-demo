import structlog
import sys
from typing import Dict, Any

def configure_logging(log_level: str = "INFO") -> structlog.stdlib.BoundLogger:
    """Configure structured logging for the application."""
    
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    logger = structlog.get_logger("inventory-service")
    logger.info("Logging configured", log_level=log_level)
    
    return logger

def get_logger() -> structlog.stdlib.BoundLogger:
    """Get a configured logger instance."""
    return structlog.get_logger("inventory-service")