# Multi-stage build for React frontend with Dapr-enabled Express server
# This Dockerfile creates a production-ready container that:
# 1. Builds the React application 
# 2. Serves it via an Express server with Dapr integration
# 3. Proxies API calls to backend services through Dapr sidecar

FROM node:18-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package files for React app and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy server package files and install dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# Build stage - Create React production build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev dependencies for building)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage - Lightweight server container
FROM node:18-alpine

WORKDIR /app

# Install security updates
RUN apk --no-cache add dumb-init && \
    apk --no-cache upgrade

# Copy server dependencies
COPY --from=deps /app/server/node_modules ./node_modules

# Copy server code
COPY server/server.js ./
COPY server/package*.json ./

# Copy built React application
COPY --from=builder /app/build ./build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001 -G nodejs

# Change ownership of application files
RUN chown -R frontend:nodejs /app

# Switch to non-root user
USER frontend

# Expose port (documentation only - Container Apps controls actual port mapping)
EXPOSE 3000

# Add environment variables for runtime configuration
ENV NODE_ENV=production \
    PORT=3000 \
    DAPR_HTTP_PORT=3500

# Health check - ensures container is responding correctly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signal forwarding and zombie reaping
ENTRYPOINT ["dumb-init", "--"]

# Start the Express server
CMD ["node", "server.js"]