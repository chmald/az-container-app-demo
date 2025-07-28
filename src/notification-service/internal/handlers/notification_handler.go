package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"notification-service/internal/models"
	"notification-service/internal/services"
	"notification-service/pkg/logger"
)

type NotificationHandler struct {
	service *services.NotificationService
	logger  *logrus.Logger
}

func NewNotificationHandler(service *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		service: service,
		logger:  logger.GetLogger(),
	}
}

// SendNotification handles HTTP requests to send notifications
func (h *NotificationHandler) SendNotification(c *gin.Context) {
	var req models.NotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Invalid notification request")
		
		c.JSON(http.StatusBadRequest, models.NotificationResponse{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	notification, err := h.service.SendNotification(c.Request.Context(), &req)
	if err != nil {
		h.logger.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Failed to send notification")
		
		c.JSON(http.StatusInternalServerError, models.NotificationResponse{
			Success: false,
			Error:   "Failed to send notification: " + err.Error(),
		})
		return
	}

	response := models.NotificationResponse{
		Success: true,
		Data:    notification,
		Message: "Notification sent successfully",
	}

	c.JSON(http.StatusOK, response)
}

// HealthCheck handles health check requests
func (h *NotificationHandler) HealthCheck(c *gin.Context) {
	response := models.HealthResponse{
		Success:   true,
		Service:   "notification-service",
		Status:    "healthy",
		Timestamp: time.Now(),
		Version:   "1.0.0",
	}

	c.JSON(http.StatusOK, response)
}

// Dapr subscription handlers

// HandleOrderCreated handles order created events from Dapr pub/sub
func (h *NotificationHandler) HandleOrderCreated(c *gin.Context) {
	var event models.OrderCreatedEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		h.logger.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Invalid order created event")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ProcessOrderCreatedEvent(c.Request.Context(), &event); err != nil {
		h.logger.WithFields(logrus.Fields{
			"order_id": event.OrderID,
			"error":    err.Error(),
		}).Error("Failed to process order created event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// HandleOrderStatusUpdated handles order status updated events from Dapr pub/sub
func (h *NotificationHandler) HandleOrderStatusUpdated(c *gin.Context) {
	var event models.OrderStatusUpdatedEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		h.logger.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Invalid order status updated event")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ProcessOrderStatusUpdatedEvent(c.Request.Context(), &event); err != nil {
		h.logger.WithFields(logrus.Fields{
			"order_id": event.OrderID,
			"error":    err.Error(),
		}).Error("Failed to process order status updated event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// HandleInventoryAlert handles inventory alert events from Dapr pub/sub
func (h *NotificationHandler) HandleInventoryAlert(c *gin.Context) {
	var event models.InventoryAlertEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		h.logger.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Invalid inventory alert event")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ProcessInventoryAlertEvent(c.Request.Context(), &event); err != nil {
		h.logger.WithFields(logrus.Fields{
			"product_id": event.ProductID,
			"error":      err.Error(),
		}).Error("Failed to process inventory alert event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// GetDaprSubscriptions returns Dapr subscription configuration
func (h *NotificationHandler) GetDaprSubscriptions(c *gin.Context) {
	subscriptions := []map[string]interface{}{
		{
			"pubsubname": "pubsub",
			"topic":      "order-created",
			"route":      "/events/order-created",
		},
		{
			"pubsubname": "pubsub",
			"topic":      "order-status-updated",
			"route":      "/events/order-status-updated",
		},
		{
			"pubsubname": "pubsub",
			"topic":      "inventory-alert",
			"route":      "/events/inventory-alert",
		},
	}

	c.JSON(http.StatusOK, subscriptions)
}