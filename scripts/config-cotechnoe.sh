#!/bin/bash

# Script de configuration des variables d'environnement pour Cotechnoe
# Usage: ./scripts/config-cotechnoe.sh

echo "🔧 Configuration de l'environnement Cotechnoe"
echo "============================================="

ENV_FILE="./env/.env.cotechnoe"
USER_ENV_FILE="./env/.env.cotechnoe.user"

echo ""
echo "📝 Configuration des variables publiques ($ENV_FILE):"

# Demander les variables principales
read -p "AZURE_SUBSCRIPTION_ID (ID de la souscription Cotechnoe): " AZURE_SUBSCRIPTION_ID
read -p "RESOURCE_SUFFIX (suffixe unique, ex: cot001): " RESOURCE_SUFFIX

# Mettre à jour le fichier .env.cotechnoe
sed -i "s/AZURE_SUBSCRIPTION_ID=.*/AZURE_SUBSCRIPTION_ID=$AZURE_SUBSCRIPTION_ID/" "$ENV_FILE"
sed -i "s/RESOURCE_SUFFIX=.*/RESOURCE_SUFFIX=$RESOURCE_SUFFIX/" "$ENV_FILE"

echo ""
echo "🔐 Configuration des variables secrètes ($USER_ENV_FILE):"

read -p "SECRET_AZURE_OPENAI_API_KEY: " OPENAI_KEY
read -p "SECRET_AZURE_OPENAI_ENDPOINT: " OPENAI_ENDPOINT
read -p "SECRET_AZURE_OPENAI_DEPLOYMENT_NAME: " OPENAI_DEPLOYMENT

# Mettre à jour le fichier .env.cotechnoe.user
sed -i "s/SECRET_AZURE_OPENAI_API_KEY=.*/SECRET_AZURE_OPENAI_API_KEY=$OPENAI_KEY/" "$USER_ENV_FILE"
sed -i "s/SECRET_AZURE_OPENAI_ENDPOINT=.*/SECRET_AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT/" "$USER_ENV_FILE"
sed -i "s/SECRET_AZURE_OPENAI_DEPLOYMENT_NAME=.*/SECRET_AZURE_OPENAI_DEPLOYMENT_NAME=$OPENAI_DEPLOYMENT/" "$USER_ENV_FILE"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Vérifiez que vous êtes connecté aux comptes Azure/M365 Cotechnoe"
echo "2. Exécutez: atk provision --env cotechnoe --config-file-path m365agents.cotechnoe.yml"
echo "3. Exécutez: atk deploy --env cotechnoe --config-file-path m365agents.cotechnoe.yml"
