#!/bin/bash

# Frontend Setup Validation Script
# This script validates that the frontend is properly configured

echo "[INFO] Validating Frontend Setup..."
echo "================================"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "[ERROR] Not in frontend directory. Run this from src/frontend/"
    exit 1
fi

echo "[OK] In frontend directory"

# Check React package.json
if [[ -f "package.json" ]]; then
    echo "[OK] React package.json found"
    
    # Check for required dependencies
    if grep -q "react" package.json; then
        echo "[OK] React dependency found"
    else
        echo "[ERROR] React dependency missing"
    fi
    
    if grep -q "typescript" package.json; then
        echo "[OK] TypeScript dependency found"
    else
        echo "[ERROR] TypeScript dependency missing"
    fi
else
    echo "[ERROR] React package.json not found"
fi

# Check server package.json
if [[ -f "server/package.json" ]]; then
    echo "[OK] Server package.json found"
    
    # Check for required dependencies
    if grep -q "express" server/package.json; then
        echo "[OK] Express dependency found"
    else
        echo "[ERROR] Express dependency missing"
    fi
    
    if grep -q "axios" server/package.json; then
        echo "[OK] Axios dependency found"
    else
        echo "[ERROR] Axios dependency missing"
    fi
else
    echo "[ERROR] Server package.json not found"
fi

# Check server.js
if [[ -f "server/server.js" ]]; then
    echo "[OK] Server.js found"
    
    # Check for Dapr configuration
    if grep -q "DAPR_HTTP_PORT" server/server.js; then
        echo "[OK] Dapr configuration found"
    else
        echo "[ERROR] Dapr configuration missing"
    fi
    
    # Check for proxy routes
    if grep -q "/api/proxy/" server/server.js; then
        echo "[OK] API proxy routes found"
    else
        echo "[ERROR] API proxy routes missing"
    fi
else
    echo "[ERROR] Server.js not found"
fi

# Check Dockerfile
if [[ -f "Dockerfile" ]]; then
    echo "[OK] Dockerfile found"
    
    # Check for multi-stage build
    if grep -q "AS deps" Dockerfile && grep -q "AS builder" Dockerfile; then
        echo "[OK] Multi-stage build configured"
    else
        echo "[ERROR] Multi-stage build not properly configured"
    fi
    
    # Check for security (non-root user)
    if grep -q "USER frontend" Dockerfile; then
        echo "[OK] Non-root user configured"
    else
        echo "[ERROR] Non-root user not configured"
    fi
else
    echo "[ERROR] Dockerfile not found"
fi

# Check API service
if [[ -f "src/services/api.ts" ]]; then
    echo "[OK] API service found"
    
    # Check for proxy endpoints
    if grep -q "/api/proxy/" src/services/api.ts; then
        echo "[OK] Proxy endpoints configured in API service"
    else
        echo "[ERROR] Proxy endpoints not configured in API service"
    fi
else
    echo "[ERROR] API service not found"
fi

# Check for build directory (if exists)
if [[ -d "build" ]]; then
    echo "[OK] Build directory exists"
    if [[ -f "build/index.html" ]]; then
        echo "[OK] Built React app found"
    else
        echo "[WARN] Build directory exists but no built app found"
    fi
else
    echo "[INFO] Build directory not found (run 'npm run build' to create)"
fi

# Check node_modules
if [[ -d "node_modules" ]]; then
    echo "[OK] React dependencies installed"
else
    echo "[ERROR] React dependencies not installed (run 'npm install')"
fi

if [[ -d "server/node_modules" ]]; then
    echo "[OK] Server dependencies installed"
else
    echo "[ERROR] Server dependencies not installed (run 'cd server && npm install')"
fi

echo ""
echo "[SUCCESS] Setup Validation Complete!"
echo ""

# Summary
echo "Next Steps:"
echo "1. If dependencies missing: npm install && cd server && npm install"
echo "2. For development: npm run start:dev"
echo "3. For production build: npm run build && npm run start:server"
echo "4. For Dapr testing: ./start-with-dapr.sh"
echo "5. For Docker build: npm run docker:build"
