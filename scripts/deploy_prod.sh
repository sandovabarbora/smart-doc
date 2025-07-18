#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
DOMAIN=${2:-localhost}

echo "🚀 Deploying to $ENVIRONMENT environment..."

# Validation
if [ "$ENVIRONMENT" = "production" ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
    else
        echo "❌ .env.production file required for production deployment"
        exit 1
    fi
    
    # Check required production variables
    required_vars=("ANTHROPIC_API_KEY" "SECRET_KEY" "POSTGRES_PASSWORD")
    for var in "${required_vars[@]}"; do
        if ! grep -q "${var}=.*[^[:space:]]" .env; then
            echo "❌ $var not set in .env"
            exit 1
        fi
    done
fi

# Build production images
echo "📦 Building production images..."
docker-compose -f docker-compose.prod.yml build

# Deploy with zero downtime
echo "🔄 Performing rolling deployment..."
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
docker-compose -f docker-compose.prod.yml up -d

# Health check
echo "🔍 Running production health checks..."
timeout 60 bash -c "until curl -f http://${DOMAIN}/health; do sleep 5; done"

echo "✅ Production deployment complete!"
echo "🌐 Service available at: http://${DOMAIN}"
