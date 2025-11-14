#!/bin/bash

# Exemples d'utilisation du script email-send.sh
# Ce fichier contient des exemples pratiques pour utiliser le script d'envoi d'email

echo "=== Exemples d'utilisation - Script email-send.sh ==="
echo ""

echo "1️⃣ Mode simulation (recommandé pour tester) :"
echo "./users/email-send.sh --simulate --user-email martin.suzanne@cotechnoe.com"
echo ""

echo "2️⃣ Mode test (envoie à Michel Héon) :"
echo "./users/email-send.sh --test --user-email martin.suzanne@cotechnoe.com"
echo ""

echo "3️⃣ Envoi normal (récupère automatiquement les infos depuis Azure AD) :"
echo "./users/email-send.sh --user-email martin.suzanne@cotechnoe.com"
echo ""

echo "4️⃣ Avec mot de passe personnalisé :"
echo "./users/email-send.sh --user-email martin.suzanne@cotechnoe.com --password MonMotDePasse123!"
echo ""

echo "5️⃣ Simulation avec mot de passe personnalisé :"
echo "./users/email-send.sh --simulate --user-email martin.suzanne@cotechnoe.com --password Test123!"
echo ""

echo "ℹ️  Le script récupère automatiquement :"
echo "   - Le nom complet depuis Azure AD (displayName)"
echo "   - Le prénom depuis Azure AD (givenName)"
echo "   - L'email personnel depuis Azure AD (otherMails)"
echo "   - Le mot de passe depuis users/create-m365-user.sh si non fourni"
echo ""

echo "⚠️  Prérequis :"
echo "   - Azure CLI installé et connecté (az login)"
echo "   - jq installé pour le parsing JSON"
echo "   - Client email (mail, sendmail, ou mutt)"
echo ""
