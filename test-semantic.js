#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
const envFile = path.join(__dirname, 'env', '.env.playground.user');
const envContent = fs.readFileSync(envFile, 'utf8');

envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    }
});

console.log('🔧 Variables d\'environnement chargées');
console.log(`📍 Index: ${process.env.AZURE_SEARCH_INDEX_NAME}`);
console.log(`📂 TTL: ${process.env.TTL_METADATA_FILE}`);

// Lancer le setup avec 5 fichiers PDF TTL-driven
const setupPath = path.join(__dirname, 'lib', 'src', 'indexers', 'setup.js');
process.argv = [
    'node', 
    setupPath, 
    process.env.SECRET_AZURE_SEARCH_KEY, 
    process.env.SECRET_AZURE_OPENAI_API_KEY
];

console.log('🚀 Lancement du test sémantique TTL-driven...');
require(setupPath);
