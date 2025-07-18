#!/bin/bash

echo "📊 Smart Document Analyzer - System Status"
echo "========================================"

# Service status
echo "🔧 Service Status:"
docker-compose ps

echo ""
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🏥 Health Checks:"
if curl -s http://localhost:8000/health | jq -r .status 2>/dev/null; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Unhealthy"
fi

if docker-compose exec postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ Database: Ready"
else
    echo "❌ Database: Not ready"
fi

echo ""
echo "📈 API Metrics:"
response_time=$(curl -s -w "%{time_total}" http://localhost:8000/health -o /dev/null)
echo "Response Time: ${response_time}s"

echo ""
echo "💿 Disk Usage:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "📋 Recent Logs (last 10 lines):"
docker-compose logs --tail=10 backend
#!/bin/bash

echo "📊 Smart Document Analyzer - System Status"
echo "========================================"

# Service status
echo "🔧 Service Status:"
docker-compose ps

echo ""
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🏥 Health Checks:"
if curl -s http://localhost:8000/health | jq -r .status 2>/dev/null; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Unhealthy"
fi

if docker-compose exec postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ Database: Ready"
else
    echo "❌ Database: Not ready"
fi

echo ""
echo "📈 API Metrics:"
response_time=$(curl -s -w "%{time_total}" http://localhost:8000/health -o /dev/null)
echo "Response Time: ${response_time}s"

echo ""
echo "💿 Disk Usage:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "📋 Recent Logs (last 10 lines):"
docker-compose logs --tail=10 backend
