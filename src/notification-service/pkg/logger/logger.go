package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

var Logger *logrus.Logger

func init() {
	Logger = logrus.New()
	
	// Set JSON formatter for structured logging
	Logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02T15:04:05.000Z",
	})
	
	// Set log level from environment variable
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}
	
	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		level = logrus.InfoLevel
	}
	Logger.SetLevel(level)
	
	// Output to stdout
	Logger.SetOutput(os.Stdout)
	
	Logger.WithFields(logrus.Fields{
		"service": "notification-service",
		"version": "1.0.0",
	}).Info("Logger initialized")
}

// GetLogger returns the configured logger instance
func GetLogger() *logrus.Logger {
	return Logger
}

// WithFields creates a new entry with the specified fields
func WithFields(fields logrus.Fields) *logrus.Entry {
	return Logger.WithFields(fields)
}