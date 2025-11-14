#!/bin/bash

# Script pour configurer le mot de passe Office 365 dans Postfix
# Usage: ./set-o365-password.sh

SASL_FILE="/etc/postfix/sasl_passwd"

echo "=== Configuration du mot de passe Office 365 ==="

# Vérifier si le script est exécuté en tant que root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté avec sudo"
    exit 1
fi

echo "ℹ️  Pour obtenir un mot de passe d'application Office 365 :"
echo "   1. Allez sur https://account.activedirectory.windowsazure.com/AppPasswords.aspx"
echo "   2. Créez un nouveau mot de passe d'application"
echo "   3. Nommez-le 'Postfix-Ubuntu-Server'"
echo "   4. Copiez le mot de passe généré"
echo ""

read -p "Avez-vous votre mot de passe d'application ? (o/n) : " -r
if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo "❌ Obtenez d'abord votre mot de passe d'application et relancez ce script"
    exit 1
fi

echo ""
echo "⚠️  ATTENTION : Le mot de passe sera affiché en clair pendant la saisie"
read -p "Entrez votre mot de passe d'application Office 365 : " APP_PASSWORD

if [ -z "$APP_PASSWORD" ]; then
    echo "❌ Mot de passe vide, annulation"
    exit 1
fi

# Configurer le fichier SASL
echo "[smtp.office365.com]:587 heon@cotechnoe.com:$APP_PASSWORD" > "$SASL_FILE"

# Générer la base de données hash
postmap "$SASL_FILE"
postmap /etc/postfix/generic

# Sécuriser les fichiers
chmod 600 "$SASL_FILE"
chmod 600 "$SASL_FILE.db"
chown root:root "$SASL_FILE" "$SASL_FILE.db"

echo "✅ Configuration terminée"
echo ""
echo "🔄 Rechargement de Postfix..."
systemctl reload postfix

echo ""
echo "🧪 Test de l'envoi d'email..."
echo "Test depuis le serveur Ubuntu configuré avec Office 365" | mail -s "Test SMTP Relay O365" heon@cotechnoe.com

echo ""
echo "✅ Email de test envoyé !"
echo "📧 Vérifiez votre boîte mail dans quelques minutes"
echo ""
echo "📊 Pour surveiller les logs :"
echo "   tail -f /var/log/mail.log"
