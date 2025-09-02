#!/bin/bash

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starte n8n mit Lexware-Modul in Docker...${NC}"

# Prüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker ist nicht gestartet. Bitte starten Sie Docker Desktop.${NC}"
    exit 1
fi

# Stoppe eventuell laufende Container
echo -e "${YELLOW}🛑 Stoppe eventuell laufende Container...${NC}"
docker-compose down

# Baue das Image neu
echo -e "${YELLOW}🔨 Baue Docker Image...${NC}"
docker-compose build --no-cache

# Starte die Container
echo -e "${YELLOW}🚀 Starte Container...${NC}"
docker-compose up -d

# Warte kurz und zeige Status
sleep 5
docker-compose ps

echo -e "${GREEN}✅ n8n ist gestartet!${NC}"
echo -e "${GREEN}🌐 Öffnen Sie http://localhost:5678 in Ihrem Browser${NC}"
echo -e "${GREEN}👤 Login: admin${NC}"
echo -e "${GREEN}🔑 Passwort: password123${NC}"
echo ""
echo -e "${YELLOW}📋 Nützliche Befehle:${NC}"
echo -e "  docker-compose logs -f     # Logs anzeigen"
echo -e "  docker-compose down        # Container stoppen"
echo -e "  docker-compose restart     # Container neu starten"
