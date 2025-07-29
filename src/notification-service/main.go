package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dapr/go-sdk/client"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"notification-service/internal/handlers"
	"notification-service/internal/services"
	"notification-service/pkg/logger"
)

func main() {
	// Get logger
	log := logger.GetLogger()

	// Create Dapr client
	daprClient, err := client.NewClient()
	if err != nil {
		log.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Fatal("Failed to create Dapr client")
	}
	defer daprClient.Close()

	// Create services
	notificationService := services.NewNotificationService(daprClient)

	// Create handlers
	notificationHandler := handlers.NewNotificationHandler(notificationService)

	// Setup Gin router
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Middleware
	router.Use(gin.Recovery())
	router.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start)

		log.WithFields(logrus.Fields{
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"status":     c.Writer.Status(),
			"duration":   duration.String(),
			"user_agent": c.Request.UserAgent(),
		}).Info("HTTP Request")
	})

	// API routes
	api := router.Group("/api")
	{
		api.POST("/notify", notificationHandler.SendNotification)
		api.GET("/health", notificationHandler.HealthCheck)
	}

	// Dapr routes
	dapr := router.Group("/dapr")
	{
		dapr.GET("/subscribe", notificationHandler.GetDaprSubscriptions)
	}

	// Event routes for Dapr pub/sub
	events := router.Group("/events")
	{
		events.POST("/order-created", notificationHandler.HandleOrderCreated)
		events.POST("/order-status-updated", notificationHandler.HandleOrderStatusUpdated)
		events.POST("/inventory-alert", notificationHandler.HandleInventoryAlert)
	}

	// Root route
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"service": "notification-service",
			"message": "Notification Service is running",
			"version": "1.0.0",
		})
	})

	// Health check route
	router.GET("/health", notificationHandler.HealthCheck)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Start server in goroutine
	go func() {
		log.WithFields(logrus.Fields{
			"port":    port,
			"service": "notification-service",
		}).Info("Starting notification service")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.WithFields(logrus.Fields{
				"error": err.Error(),
			}).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down notification service...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Fatal("Server forced to shutdown")
	}

	log.Info("Notification service stopped")
}