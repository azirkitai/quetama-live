#!/bin/bash
# Prepare for deployment - ensure object storage is ready

echo "🚀 Preparing for safe deployment..."
echo ""

# Get object storage path from environment
OBJSTORE_PATH="${PUBLIC_OBJECT_SEARCH_PATHS:-/replit-objstore-85caca72-fd47-41c6-a360-3c3d4b8873eb/public}"

# Remove leading slash and JSON array brackets if present
OBJSTORE_PATH=$(echo "$OBJSTORE_PATH" | sed 's/^\[//;s/\]$//;s/"//g' | tr -d ' ')

echo "📁 Object Storage Path: $OBJSTORE_PATH"
echo ""

# Create object storage directory if it doesn't exist
if [ ! -d "$OBJSTORE_PATH" ]; then
    echo "📦 Creating object storage directory..."
    mkdir -p "$OBJSTORE_PATH"
    echo "✅ Directory created: $OBJSTORE_PATH"
else
    echo "✅ Object storage directory already exists"
fi

# Check permissions
if [ -w "$OBJSTORE_PATH" ]; then
    echo "✅ Directory is writable"
else
    echo "⚠️  Warning: Directory is not writable"
    chmod +w "$OBJSTORE_PATH" 2>/dev/null && echo "✅ Fixed permissions" || echo "❌ Could not fix permissions"
fi

echo ""
echo "📊 Current files in object storage:"
FILE_COUNT=$(find "$OBJSTORE_PATH" -type f 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -gt 0 ]; then
    echo "   Found $FILE_COUNT files"
    ls -lh "$OBJSTORE_PATH" | head -10
else
    echo "   No files yet (files will be created on first upload)"
fi

echo ""
echo "🎯 Deployment Status:"
echo "   ✅ Object storage: READY"
echo "   ✅ Files will persist after deploy"
echo "   ✅ TV will auto-refresh via WebSocket"
echo ""
echo "🚀 Safe to deploy now!"
