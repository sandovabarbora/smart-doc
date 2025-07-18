#!/bin/bash

set -e

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup in $BACKUP_DIR..."

# Database backup
echo "🗄️ Backing up PostgreSQL database..."
docker-compose exec postgres pg_dump -U postgres smart_doc_analyzer > "$BACKUP_DIR/database.sql"

# Vector store backup
echo "🔍 Backing up ChromaDB..."
if [ -d "backend/chroma_db" ]; then
    tar -czf "$BACKUP_DIR/chroma_db.tar.gz" -C backend chroma_db
fi

# Uploaded files backup
echo "📁 Backing up uploaded files..."
if [ -d "backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads.tar.gz" -C backend uploads
fi

# Configuration backup
echo "⚙️ Backing up configuration..."
cp .env "$BACKUP_DIR/" 2>/dev/null || echo "No .env file found"
cp docker-compose.yml "$BACKUP_DIR/"

echo "✅ Backup completed: $BACKUP_DIR"
echo "📦 Total size: $(du -sh $BACKUP_DIR | cut -f1)"
#!/bin/bash

set -e

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup in $BACKUP_DIR..."

# Database backup
echo "🗄️ Backing up PostgreSQL database..."
docker-compose exec postgres pg_dump -U postgres smart_doc_analyzer > "$BACKUP_DIR/database.sql"

# Vector store backup
echo "🔍 Backing up ChromaDB..."
if [ -d "backend/chroma_db" ]; then
    tar -czf "$BACKUP_DIR/chroma_db.tar.gz" -C backend chroma_db
fi

# Uploaded files backup
echo "📁 Backing up uploaded files..."
if [ -d "backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads.tar.gz" -C backend uploads
fi

# Configuration backup
echo "⚙️ Backing up configuration..."
cp .env "$BACKUP_DIR/" 2>/dev/null || echo "No .env file found"
cp docker-compose.yml "$BACKUP_DIR/"

echo "✅ Backup completed: $BACKUP_DIR"
echo "📦 Total size: $(du -sh $BACKUP_DIR | cut -f1)"
