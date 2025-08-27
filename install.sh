#!/bin/bash

echo "🚀 Installation des N8N Lexware Moduls..."

# Prüfe ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert. Bitte installieren Sie Node.js zuerst."
    exit 1
fi

# Prüfe Node.js Version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js Version 16 oder höher ist erforderlich. Aktuelle Version: $(node -v)"
    exit 1
fi

echo "✅ Node.js Version: $(node -v)"

# Installiere Abhängigkeiten
echo "📦 Installiere Abhängigkeiten..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Fehler beim Installieren der Abhängigkeiten"
    exit 1
fi

# Baue das Modul
echo "🔨 Baue das Modul..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Fehler beim Bauen des Moduls"
    exit 1
fi

echo "✅ Installation erfolgreich abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Starten Sie N8N neu"
echo "2. Fügen Sie einen neuen Lexware-Node zu Ihrem Workflow hinzu"
echo "3. Konfigurieren Sie die Credentials mit Ihren Lexware API-Daten"
echo "4. Testen Sie die Integration"
echo ""
echo "📚 Dokumentation: README.md"
echo "🔧 Beispiele: examples/"
