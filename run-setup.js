#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Charger le fichier .env.playground.user
const envPath = path.join(__dirname, 'env', '.env.playground.user');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').trim();
                // Enlever les guillemets si présents
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        }
    }
    console.log('✅ Variables d\'environnement chargées depuis .env.playground.user');
} else {
    console.log('❌ Fichier .env.playground.user introuvable');
    process.exit(1);
}

// Lancer le script setup
const searchKey = process.env.SECRET_AZURE_SEARCH_KEY;
const openaiKey = process.env.SECRET_AZURE_OPENAI_API_KEY;

if (!searchKey || !openaiKey) {
    console.log('❌ Clés API manquantes dans l\'environnement');
    process.exit(1);
}

console.log('🚀 Lancement du script setup avec configuration sémantique...');

// Importer et exécuter le script setup
const setupPath = path.join(__dirname, 'lib', 'src', 'indexers', 'setup.js');
process.argv = ['node', setupPath, searchKey, openaiKey];

require(setupPath);
