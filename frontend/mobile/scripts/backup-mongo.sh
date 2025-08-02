#!/bin/bash

# MongoDB Backup Script for FridgeWiseAI
# This script creates automated backups of the MongoDB database

set -e

# Configuration
DB_NAME="fridgewiseai"
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fridgewiseai_backup_${DATE}"
RETENTION_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting MongoDB backup for FridgeWiseAI...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Perform the backup
echo -e "${YELLOW}📦 Creating backup: ${BACKUP_NAME}${NC}"
mongodump --db "${DB_NAME}" --out "${BACKUP_DIR}/${BACKUP_NAME}"

# Compress the backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

# Check backup size
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${GREEN}📁 Backup file: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})${NC}"

# Clean up old backups (keep only last 7 days)
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "fridgewiseai_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List current backups
echo -e "${GREEN}📋 Current backups:${NC}"
ls -lah "${BACKUP_DIR}"/fridgewiseai_backup_*.tar.gz 2>/dev/null || echo "No backups found"

echo -e "${GREEN}🎉 Backup process completed!${NC}"