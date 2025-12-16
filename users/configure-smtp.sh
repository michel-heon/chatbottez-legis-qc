#!/bin/bash

# Script d'activation SMTP simple
# Usage: ./configure-smtp.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SMTP_CONFIG="${SCRIPT_DIR}/.smtp.env"

echo "=== Configuration SMTP pour envoi d'emails ==="

# Créer le fichier de configuration SMTP
cat > "$SMTP_CONFIG" << 'EOF'
# Configuration SMTP pour Office 365
SMTP_SERVER="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="heon@cotechnoe.com"
EMAIL_TRANSPORT="smtp"
SMTP_USE_TLS="true"
EOF

echo "📋 Fichier de configuration créé : $SMTP_CONFIG"

# Demander le mot de passe
echo ""
echo "🔐 Configuration du mot de passe..."
echo ""
echo "ℹ️  Pour Office 365 avec MFA activé :"
echo "   1. Allez sur https://account.activedirectory.windowsazure.com/AppPasswords.aspx"
echo "   2. Créez un mot de passe d'application 'EmailScript'"
echo "   3. Utilisez ce mot de passe ci-dessous"
echo ""

read -p "Entrez votre mot de passe Office 365 (ou mot de passe d'application) : " -s APP_PASSWORD
echo ""

if [ -z "$APP_PASSWORD" ]; then
    echo "❌ Mot de passe requis"
    exit 1
fi

# Ajouter le mot de passe au fichier
echo "SMTP_PASSWORD=\"$APP_PASSWORD\"" >> "$SMTP_CONFIG"

# Sécuriser le fichier
chmod 600 "$SMTP_CONFIG"

echo "✅ Configuration terminée !"
echo ""
echo "🧪 Test d'envoi..."

# Tester l'envoi
if "${SCRIPT_DIR}/send-email.sh" --test --user-email "heon@cotechnoe.com"; then
    echo ""
    echo "🎉 Succès ! Email envoyé"
    echo "📧 Vérifiez votre boîte mail"
else
    echo ""
    echo "❌ Échec du test"
    echo "💡 Vérifiez la configuration dans $SMTP_CONFIG"
fi
