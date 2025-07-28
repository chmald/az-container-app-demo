package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/dapr/go-sdk/client"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"notification-service/internal/models"
	"notification-service/pkg/logger"
)

type NotificationService struct {
	daprClient client.Client
	logger     *logrus.Logger
}

func NewNotificationService(daprClient client.Client) *NotificationService {
	return &NotificationService{
		daprClient: daprClient,
		logger:     logger.GetLogger(),
	}
}

// SendNotification sends a notification
func (s *NotificationService) SendNotification(ctx context.Context, req *models.NotificationRequest) (*models.Notification, error) {
	notification := &models.Notification{
		ID:        uuid.New().String(),
		Type:      req.Type,
		Recipient: req.Recipient,
		Subject:   req.Subject,
		Message:   req.Message,
		Data:      req.Data,
		Status:    models.NotificationStatusPending,
		CreatedAt: time.Now(),
	}

	s.logger.WithFields(logrus.Fields{
		"notification_id": notification.ID,
		"type":           notification.Type,
		"recipient":      notification.Recipient,
	}).Info("Processing notification request")

	// Simulate sending notification based on type
	var err error
	switch notification.Type {
	case models.NotificationTypeEmail:
		err = s.sendEmail(ctx, notification)
	case models.NotificationTypeSMS:
		err = s.sendSMS(ctx, notification)
	case models.NotificationTypePush:
		err = s.sendPushNotification(ctx, notification)
	default:
		err = fmt.Errorf("unsupported notification type: %s", notification.Type)
	}

	if err != nil {
		notification.Status = models.NotificationStatusFailed
		notification.Error = err.Error()
		s.logger.WithFields(logrus.Fields{
			"notification_id": notification.ID,
			"error":          err.Error(),
		}).Error("Failed to send notification")
	} else {
		notification.Status = models.NotificationStatusSent
		now := time.Now()
		notification.SentAt = &now
		s.logger.WithFields(logrus.Fields{
			"notification_id": notification.ID,
			"type":           notification.Type,
		}).Info("Notification sent successfully")
	}

	// Save notification to state store
	if err := s.saveNotification(ctx, notification); err != nil {
		s.logger.WithFields(logrus.Fields{
			"notification_id": notification.ID,
			"error":          err.Error(),
		}).Warn("Failed to save notification to state store")
	}

	// Publish notification event
	if err := s.publishNotificationEvent(ctx, notification); err != nil {
		s.logger.WithFields(logrus.Fields{
			"notification_id": notification.ID,
			"error":          err.Error(),
		}).Warn("Failed to publish notification event")
	}

	return notification, nil
}

// sendEmail simulates sending an email notification
func (s *NotificationService) sendEmail(ctx context.Context, notification *models.Notification) error {
	s.logger.WithFields(logrus.Fields{
		"notification_id": notification.ID,
		"recipient":      notification.Recipient,
		"subject":        notification.Subject,
	}).Info("Sending email notification")

	// Simulate email sending delay
	time.Sleep(100 * time.Millisecond)

	// For demo purposes, we'll simulate success for valid email addresses
	// In a real implementation, this would integrate with email service (SendGrid, SES, etc.)
	if len(notification.Recipient) > 0 && notification.Recipient != "invalid@example.com" {
		return nil
	}

	return fmt.Errorf("invalid email address: %s", notification.Recipient)
}

// sendSMS simulates sending an SMS notification
func (s *NotificationService) sendSMS(ctx context.Context, notification *models.Notification) error {
	s.logger.WithFields(logrus.Fields{
		"notification_id": notification.ID,
		"recipient":      notification.Recipient,
	}).Info("Sending SMS notification")

	// Simulate SMS sending delay
	time.Sleep(150 * time.Millisecond)

	// For demo purposes, simulate success for valid phone numbers
	// In a real implementation, this would integrate with SMS service (Twilio, AWS SNS, etc.)
	if len(notification.Recipient) >= 10 && notification.Recipient != "+1234567890" {
		return nil
	}

	return fmt.Errorf("invalid phone number: %s", notification.Recipient)
}

// sendPushNotification simulates sending a push notification
func (s *NotificationService) sendPushNotification(ctx context.Context, notification *models.Notification) error {
	s.logger.WithFields(logrus.Fields{
		"notification_id": notification.ID,
		"recipient":      notification.Recipient,
	}).Info("Sending push notification")

	// Simulate push notification delay
	time.Sleep(50 * time.Millisecond)

	// For demo purposes, simulate success for valid device tokens
	// In a real implementation, this would integrate with push service (FCM, APNS, etc.)
	if len(notification.Recipient) > 0 && notification.Recipient != "invalid-token" {
		return nil
	}

	return fmt.Errorf("invalid device token: %s", notification.Recipient)
}

// saveNotification saves notification to Dapr state store
func (s *NotificationService) saveNotification(ctx context.Context, notification *models.Notification) error {
	data, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	err = s.daprClient.SaveState(ctx, "statestore", fmt.Sprintf("notification-%s", notification.ID), data, nil)
	if err != nil {
		return fmt.Errorf("failed to save notification to state store: %w", err)
	}

	return nil
}

// publishNotificationEvent publishes notification event to Dapr pub/sub
func (s *NotificationService) publishNotificationEvent(ctx context.Context, notification *models.Notification) error {
	eventData := map[string]interface{}{
		"notification_id": notification.ID,
		"type":           notification.Type,
		"recipient":      notification.Recipient,
		"status":         notification.Status,
		"created_at":     notification.CreatedAt,
		"sent_at":        notification.SentAt,
	}

	err := s.daprClient.PublishEvent(ctx, "pubsub", "notification-sent", eventData)
	if err != nil {
		return fmt.Errorf("failed to publish notification event: %w", err)
	}

	return nil
}

// ProcessOrderCreatedEvent processes order created events
func (s *NotificationService) ProcessOrderCreatedEvent(ctx context.Context, event *models.OrderCreatedEvent) error {
	s.logger.WithFields(logrus.Fields{
		"order_id":    event.OrderID,
		"customer_id": event.CustomerID,
		"total":       event.Total,
	}).Info("Processing order created event")

	// Create email notification for customer
	req := &models.NotificationRequest{
		Type:      models.NotificationTypeEmail,
		Recipient: fmt.Sprintf("customer-%s@example.com", event.CustomerID),
		Subject:   "Order Confirmation",
		Message:   fmt.Sprintf("Your order %s has been created with total $%.2f", event.OrderID, event.Total),
		Data: map[string]interface{}{
			"order_id":    event.OrderID,
			"customer_id": event.CustomerID,
			"total":       event.Total,
			"items":       event.Items,
		},
	}

	_, err := s.SendNotification(ctx, req)
	if err != nil {
		s.logger.WithFields(logrus.Fields{
			"order_id": event.OrderID,
			"error":    err.Error(),
		}).Error("Failed to send order confirmation notification")
		return err
	}

	return nil
}

// ProcessOrderStatusUpdatedEvent processes order status updated events
func (s *NotificationService) ProcessOrderStatusUpdatedEvent(ctx context.Context, event *models.OrderStatusUpdatedEvent) error {
	s.logger.WithFields(logrus.Fields{
		"order_id": event.OrderID,
		"status":   event.Status,
	}).Info("Processing order status updated event")

	// Create notification based on status
	var subject, message string
	switch event.Status {
	case "confirmed":
		subject = "Order Confirmed"
		message = fmt.Sprintf("Your order %s has been confirmed", event.OrderID)
	case "shipped":
		subject = "Order Shipped"
		message = fmt.Sprintf("Your order %s has been shipped", event.OrderID)
	case "delivered":
		subject = "Order Delivered"
		message = fmt.Sprintf("Your order %s has been delivered", event.OrderID)
	default:
		subject = "Order Status Updated"
		message = fmt.Sprintf("Your order %s status has been updated to %s", event.OrderID, event.Status)
	}

	req := &models.NotificationRequest{
		Type:      models.NotificationTypeEmail,
		Recipient: fmt.Sprintf("customer-order-%s@example.com", event.OrderID),
		Subject:   subject,
		Message:   message,
		Data: map[string]interface{}{
			"order_id": event.OrderID,
			"status":   event.Status,
		},
	}

	_, err := s.SendNotification(ctx, req)
	if err != nil {
		s.logger.WithFields(logrus.Fields{
			"order_id": event.OrderID,
			"error":    err.Error(),
		}).Error("Failed to send order status notification")
		return err
	}

	return nil
}

// ProcessInventoryAlertEvent processes inventory alert events
func (s *NotificationService) ProcessInventoryAlertEvent(ctx context.Context, event *models.InventoryAlertEvent) error {
	s.logger.WithFields(logrus.Fields{
		"product_id":   event.ProductID,
		"product_name": event.ProductName,
		"stock_level":  event.StockLevel,
		"quantity":     event.CurrentQuantity,
	}).Info("Processing inventory alert event")

	var subject, message string
	switch event.StockLevel {
	case "out_of_stock":
		subject = "Product Out of Stock"
		message = fmt.Sprintf("Product %s (%s) is out of stock", event.ProductName, event.ProductID)
	case "low_stock":
		subject = "Low Stock Alert"
		message = fmt.Sprintf("Product %s (%s) has low stock: %d remaining", event.ProductName, event.ProductID, event.CurrentQuantity)
	default:
		subject = "Inventory Alert"
		message = fmt.Sprintf("Inventory alert for product %s (%s)", event.ProductName, event.ProductID)
	}

	req := &models.NotificationRequest{
		Type:      models.NotificationTypeEmail,
		Recipient: "admin@example.com",
		Subject:   subject,
		Message:   message,
		Data: map[string]interface{}{
			"product_id":       event.ProductID,
			"product_name":     event.ProductName,
			"current_quantity": event.CurrentQuantity,
			"stock_level":      event.StockLevel,
			"threshold":        event.Threshold,
		},
	}

	_, err := s.SendNotification(ctx, req)
	if err != nil {
		s.logger.WithFields(logrus.Fields{
			"product_id": event.ProductID,
			"error":      err.Error(),
		}).Error("Failed to send inventory alert notification")
		return err
	}

	return nil
}