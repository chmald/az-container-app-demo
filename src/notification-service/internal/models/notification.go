package models

import (
	"time"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeEmail NotificationType = "email"
	NotificationTypeSMS   NotificationType = "sms"
	NotificationTypePush  NotificationType = "push"
)

// NotificationStatus represents the status of a notification
type NotificationStatus string

const (
	NotificationStatusPending NotificationStatus = "pending"
	NotificationStatusSent    NotificationStatus = "sent"
	NotificationStatusFailed  NotificationStatus = "failed"
)

// Notification represents a notification request
type Notification struct {
	ID        string             `json:"id" binding:"required"`
	Type      NotificationType   `json:"type" binding:"required,oneof=email sms push"`
	Recipient string             `json:"recipient" binding:"required"`
	Subject   string             `json:"subject,omitempty"`
	Message   string             `json:"message" binding:"required"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Status    NotificationStatus `json:"status"`
	CreatedAt time.Time          `json:"created_at"`
	SentAt    *time.Time         `json:"sent_at,omitempty"`
	Error     string             `json:"error,omitempty"`
}

// NotificationRequest represents a request to send a notification
type NotificationRequest struct {
	Type      NotificationType       `json:"type" binding:"required,oneof=email sms push"`
	Recipient string                 `json:"recipient" binding:"required"`
	Subject   string                 `json:"subject,omitempty"`
	Message   string                 `json:"message" binding:"required"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

// NotificationResponse represents the response after sending a notification
type NotificationResponse struct {
	Success bool          `json:"success"`
	Data    *Notification `json:"data,omitempty"`
	Message string        `json:"message,omitempty"`
	Error   string        `json:"error,omitempty"`
}

// EventData represents various event types that trigger notifications
type OrderCreatedEvent struct {
	OrderID    string  `json:"order_id"`
	CustomerID string  `json:"customer_id"`
	Total      float64 `json:"total"`
	Items      []OrderItem `json:"items"`
	CreatedAt  time.Time `json:"created_at"`
}

type OrderItem struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
}

type OrderStatusUpdatedEvent struct {
	OrderID   string `json:"order_id"`
	Status    string `json:"status"`
	UpdatedAt time.Time `json:"updated_at"`
}

type InventoryAlertEvent struct {
	ProductID       string `json:"product_id"`
	ProductName     string `json:"product_name"`
	CurrentQuantity int    `json:"current_quantity"`
	StockLevel      string `json:"stock_level"`
	Threshold       int    `json:"threshold"`
	Timestamp       time.Time `json:"timestamp"`
}

// HealthResponse represents health check response
type HealthResponse struct {
	Success   bool      `json:"success"`
	Service   string    `json:"service"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
}