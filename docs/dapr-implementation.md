# Dapr Implementation Guide

This document explains how Dapr features are implemented and used in the az-container-app-demo project.

## Overview

The application leverages Dapr (Distributed Application Runtime) for:
- **State Management**: Persistent storage using Redis state store
- **Pub/Sub Messaging**: Event-driven communication using Redis pub/sub
- **Service Invocation**: Direct service-to-service communication

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │ Backend Service │    │   Redis Cache   │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │    App    │  │    │  │  Order    │  │    │  │   State   │  │
│  │           │  │    │  │ Service   │◄─┼────┼─►│   Store   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │    │                 │
│                 │    │  ┌───────────┐  │    │  ┌───────────┐  │
│                 │    │  │Inventory  │  │    │  │  Pub/Sub  │  │
│                 │    │  │ Service   │◄─┼────┼─►│  Broker   │  │
│                 │    │  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │    │                 │
│                 │    │  ┌───────────┐  │    │                 │
│                 │    │  │Notification│  │    │                 │
│                 │    │  │ Service   │  │    │                 │
│                 │    │  └───────────┘  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Dapr Components

### 1. State Store Component (`statestore`)

**Purpose**: Persistent storage for orders, products, and notifications.

**Configuration**:
- Type: `state.redis`
- Backend: Azure Cache for Redis
- TLS: Enabled
- Scoped to: `backend-service`

**Usage Examples**:
```typescript
// Save order state
await daprService.saveState('statestore', `order-${orderId}`, orderData);

// Retrieve order state
const order = await daprService.getState<Order>('statestore', `order-${orderId}`);

// Delete state
await daprService.deleteState('statestore', `order-${orderId}`);
```

### 2. Pub/Sub Component (`pubsub`)

**Purpose**: Event-driven communication between services.

**Configuration**:
- Type: `pubsub.redis`
- Backend: Azure Cache for Redis
- TLS: Enabled
- Scoped to: `backend-service`

**Events Published**:
- `order-created`: When a new order is created
- `order-status-updated`: When order status changes
- `inventory-alert`: When product stock is low

**Event Handlers**:
- `/dapr/events/order-created`: Triggers notification emails
- `/dapr/events/order-status-updated`: Sends status update notifications
- `/dapr/events/inventory-alert`: Alerts administrators

### 3. Service Invocation

**Purpose**: Direct service-to-service communication.

**Available Endpoints**:
- `/dapr/service/health`: Health check endpoint
- `/dapr/service/notify`: Notification service invocation
- `/dapr/service/invoke-test`: Test service invocation

## Key Features Implemented

### State Management

1. **Order Persistence**: Orders are saved to and retrieved from the Redis state store
2. **Product Inventory**: Product data is cached and updated in the state store
3. **Notification History**: Notification records are persisted
4. **Bulk Operations**: Support for saving multiple state items efficiently
5. **Consistency**: ETag support for optimistic concurrency control

### Pub/Sub Messaging

1. **Event Publishing**: Services publish events when business operations occur
2. **Event Subscriptions**: Notification service subscribes to relevant events
3. **Error Handling**: Proper error responses trigger message retries
4. **Message Acknowledgment**: Explicit acknowledgment of processed messages

### Service Communication

1. **Health Checks**: Services can check each other's health via Dapr
2. **Notification Requests**: Direct service invocation for notifications
3. **Metadata Access**: Services can query Dapr configuration

## Azure Container Apps Integration

The infrastructure is configured to:

1. **Enable Dapr**: Each container app has Dapr enabled with appropriate app IDs
2. **Component Configuration**: Dapr components are configured at the environment level
3. **Security**: Redis connection uses managed secrets and TLS encryption
4. **Networking**: Components are accessible within the container apps environment

## Event Flow Example

### Order Creation Flow

1. **Frontend** → POST `/api/orders` → **Backend Service**
2. **Backend Service** validates order and updates inventory
3. **Backend Service** saves order to state store via Dapr
4. **Backend Service** publishes `order-created` event via Dapr pub/sub
5. **Notification Service** receives event and sends confirmation email
6. **Response** returned to frontend

### Inventory Update Flow

1. **Backend Service** updates product quantity in state store
2. If quantity below threshold:
   - **Backend Service** publishes `inventory-alert` event
   - **Notification Service** receives event and sends admin alert

## Monitoring and Debugging

### Health Endpoints

- `/health`: Application health check
- `/dapr/service/health`: Dapr-enabled health check
- `/dapr/service/dapr-metadata`: Dapr configuration information

### Logging

All Dapr operations are logged with appropriate context:
- State store operations (save, get, delete)
- Pub/sub operations (publish, receive)
- Service invocation operations
- Error conditions and retries

### Troubleshooting

1. **Check Dapr Sidecar**: Ensure Dapr sidecar is running
2. **Verify Components**: Check that Redis components are healthy
3. **Review Logs**: Application and Dapr sidecar logs
4. **Test Endpoints**: Use `/dapr/service/dapr-metadata` to verify configuration

## Best Practices Implemented

1. **Error Handling**: Comprehensive error handling with fallbacks
2. **Logging**: Detailed logging for all Dapr operations
3. **Graceful Degradation**: Application continues to function if Dapr is unavailable
4. **Security**: TLS encryption and scoped component access
5. **Performance**: Bulk operations and efficient state management
6. **Resilience**: Retry logic for transient failures

## Testing Dapr Features

### Test State Management
```bash
# Create an order (will save to state store)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId": "test", "items": [{"productId": "product-001", "quantity": 1}]}'

# Retrieve orders (will load from state store)
curl http://localhost:3001/api/orders
```

### Test Pub/Sub
Creating an order will automatically publish events that trigger notifications.

### Test Service Invocation
```bash
# Health check via Dapr
curl http://localhost:3001/dapr/service/health

# Get Dapr metadata
curl http://localhost:3001/dapr/service/dapr-metadata
```

## Future Enhancements

1. **Distributed Tracing**: Add OpenTelemetry for request tracing
2. **Circuit Breaker**: Implement circuit breaker pattern for external services
3. **Secrets Management**: Use Dapr secrets component for sensitive configuration
4. **Workflows**: Implement Dapr workflows for complex business processes
5. **Bindings**: Add external system bindings (e.g., email, file storage)
