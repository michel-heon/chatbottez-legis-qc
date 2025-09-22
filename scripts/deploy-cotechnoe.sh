#!/bin/bash

echo "🚀 Script de déploiement pour Cotechnoe"
echo "======================================"

echo ""
echo "📋 Étapes restantes:"
echo "1. Vous connecter à Azure et M365 Cotechnoe"
echo "2. Configurer les variables d'environnement"
echo "3. Provisionner les ressources Azure"
echo "4. Déployer l'application"

echo ""
echo "🔐 Étape 1: Authentification"
echo "Veuillez vous connecter aux comptes Azure et Microsoft 365:"
echo "- Tenant: cotechnoe01.onmicrosoft.com"
echo "- Subscription Azure associée à Cotechnoe"

echo ""
echo "⚙️ Étape 2: Variables à configurer dans .env.cotechnoe:"
echo "- AZURE_SUBSCRIPTION_ID: [ID de la souscription Cotechnoe]"
echo "- RESOURCE_SUFFIX: [suffixe unique, ex: cot001]"

echo ""
echo "🔑 Variables à configurer dans .env.cotechnoe.user:"
echo "- SECRET_AZURE_OPENAI_API_KEY: [Clé API OpenAI]"
echo "- SECRET_AZURE_OPENAI_ENDPOINT: [Endpoint OpenAI]"
echo "- SECRET_AZURE_OPENAI_DEPLOYMENT_NAME: [Nom du déploiement]"

echo ""
echo "🚀 Commandes à exécuter après configuration:"
echo "atk provision --env cotechnoe --config-file-path m365agents.cotechnoe.yml"
echo "atk deploy --env cotechnoe --config-file-path m365agents.cotechnoe.yml"

echo ""
echo "✅ Fichiers créés/modifiés:"
echo "- ✅ src/app/app.js (API OpenAI mise à jour)"
echo "- ✅ appPackage/manifest.json (URLs corrigées)"
echo "- ✅ env/.env.cotechnoe (environnement Cotechnoe)"
echo "- ✅ env/.env.cotechnoe.user (secrets)"
echo "- ✅ m365agents.cotechnoe.yml (configuration)"
