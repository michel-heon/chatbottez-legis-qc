#!/usr/bin/env node
/**
 * Script de pré-processing pour résoudre les références Azure Key Vault
 * dans les fichiers .env avant le démarrage de l'application
 */

const fs = require('fs');
const path = require('path');
const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");

class KeyVaultPreprocessor {
  constructor() {
    this.keyVaults = {
      'kv-legis-shared-dev-ce': new SecretClient("https://kv-legis-shared-dev-ce.vault.azure.net/", new DefaultAzureCredential()),
      'kv-legis-bot-dev-ce': new SecretClient("https://kv-legis-bot-dev-ce.vault.azure.net/", new DefaultAzureCredential()),
      'kv-legis-shared-prod-ce': new SecretClient("https://kv-legis-shared-prod-ce.vault.azure.net/", new DefaultAzureCredential()),
      'kv-legis-bot-prod-ce': new SecretClient("https://kv-legis-bot-prod-ce.vault.azure.net/", new DefaultAzureCredential()),
      'kv-cotechnoe-central': new SecretClient("https://kv-cotechnoe-central.vault.azure.net/", new DefaultAzureCredential())
    };
    this.cache = new Map();
  }

  async getSecret(vaultName, secretName) {
    const cacheKey = `${vaultName}:${secretName}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const vault = this.keyVaults[vaultName];
      if (!vault) {
        throw new Error(`Unknown vault: ${vaultName}`);
      }

      console.log(`📥 Récupération du secret ${secretName} depuis ${vaultName}`);
      const secret = await vault.getSecret(secretName);
      const value = secret.value;
      
      this.cache.set(cacheKey, value);
      return value;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de ${secretName} depuis ${vaultName}:`, error.message);
      throw error;
    }
  }

  parseKeyVaultReference(value) {
    // Parse @Microsoft.KeyVault(VaultName=vault-name;SecretName=secret-name)
    const match = value.match(/@Microsoft\.KeyVault\(VaultName=([^;]+);SecretName=([^)]+)\)/);
    if (!match) {
      return null;
    }
    
    return {
      vaultName: match[1],
      secretName: match[2]
    };
  }

  async processEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Fichier ignoré (inexistant): ${filePath}`);
      return {};
    }

    console.log(`📄 Traitement du fichier: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const resolvedEnv = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ignorer les commentaires et lignes vides
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }
      
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      
      // Vérifier si c'est une référence Key Vault
      const kvRef = this.parseKeyVaultReference(value);
      if (kvRef) {
        try {
          const secretValue = await this.getSecret(kvRef.vaultName, kvRef.secretName);
          resolvedEnv[key] = secretValue;
          console.log(`  ✅ ${key}: Résolu depuis ${kvRef.vaultName}/${kvRef.secretName}`);
        } catch (error) {
          console.error(`  ❌ ${key}: Échec de résolution`);
          // Garder la référence originale en cas d'échec
          resolvedEnv[key] = value;
        }
      } else {
        // Valeur normale, la garder telle quelle
        resolvedEnv[key] = value;
      }
    }
    
    return resolvedEnv;
  }

  async processEnvironment(envName = 'dev') {
    console.log(`🔄 Résolution des secrets pour l'environnement: ${envName.toUpperCase()}`);
    console.log('='.repeat(60));

    // Gérer les noms d'environnement spéciaux
    let fileName = envName;
    if (envName === 'cotechnoe') {
      fileName = 'cotechnoe-com';
    }

    // Traiter le fichier principal .env.{envName}
    const mainEnvFilePath = path.join(process.cwd(), 'env', `.env.${fileName}`);
    // Traiter le fichier .user correspondant
    const userEnvFilePath = path.join(process.cwd(), 'env', `.env.${envName}.user`);
    
    try {
      let allResolvedEnv = {};
      let totalVariables = 0;

      // Traiter le fichier principal s'il existe
      if (fs.existsSync(mainEnvFilePath)) {
        console.log(`📂 Traitement du fichier principal: .env.${fileName}`);
        const mainResolvedEnv = await this.processEnvFile(mainEnvFilePath);
        allResolvedEnv = { ...allResolvedEnv, ...mainResolvedEnv };
        totalVariables += Object.keys(mainResolvedEnv).length;
      }

      // Traiter le fichier .user s'il existe
      if (fs.existsSync(userEnvFilePath)) {
        console.log(`📂 Traitement du fichier secrets: .env.${envName}.user`);
        const userResolvedEnv = await this.processEnvFile(userEnvFilePath);
        allResolvedEnv = { ...allResolvedEnv, ...userResolvedEnv };
        totalVariables += Object.keys(userResolvedEnv).length;
      }

      if (totalVariables === 0) {
        console.warn(`⚠️  Aucun fichier d'environnement trouvé pour ${envName}`);
        return false;
      }
      
      // Appliquer les variables d'environnement résolues
      Object.entries(allResolvedEnv).forEach(([key, value]) => {
        process.env[key] = value;
      });
      
      console.log(`\n✅ ${totalVariables} variables d'environnement résolues`);
      console.log('🚀 Prêt à démarrer l\'application\n');
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du traitement des variables d\'environnement:', error.message);
      return false;
    }
  }

  async generateResolvedEnvFile(envName = 'dev', outputPath = null) {
    // Gérer les noms d'environnement spéciaux
    let fileName = envName;
    if (envName === 'cotechnoe') {
      fileName = 'cotechnoe-com';
    }
    
    let allResolvedEnv = {};
    
    // Traiter le fichier principal s'il existe
    const mainEnvFilePath = path.join(process.cwd(), 'env', `.env.${fileName}`);
    if (fs.existsSync(mainEnvFilePath)) {
      const mainResolvedEnv = await this.processEnvFile(mainEnvFilePath);
      allResolvedEnv = { ...allResolvedEnv, ...mainResolvedEnv };
    }

    // Traiter le fichier .user s'il existe
    const userEnvFilePath = path.join(process.cwd(), 'env', `.env.${envName}.user`);
    if (fs.existsSync(userEnvFilePath)) {
      const userResolvedEnv = await this.processEnvFile(userEnvFilePath);
      allResolvedEnv = { ...allResolvedEnv, ...userResolvedEnv };
    }
    
    if (!outputPath) {
      outputPath = path.join(process.cwd(), `.env.resolved.${envName}`);
    }
    
    const envContent = Object.entries(allResolvedEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(outputPath, envContent);
    console.log(`📄 Fichier .env résolu généré: ${outputPath}`);
    
    return outputPath;
  }
}

// Interface CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'resolve';
  const envName = args[1] || 'dev';
  
  const processor = new KeyVaultPreprocessor();

  switch (command) {
    case 'resolve':
      // Résoudre et charger dans process.env
      const success = await processor.processEnvironment(envName);
      process.exit(success ? 0 : 1);
      break;
      
    case 'generate':
      // Générer un fichier .env résolu
      const outputPath = args[2] || `.env.resolved.${envName}`;
      await processor.generateResolvedEnvFile(envName, outputPath);
      break;

    case 'validate':
      // Valider tous les environnements ou un spécifique
      if (args[1] && args[1] !== '--all') {
        // Valider un environnement spécifique
        console.log(`🔍 Validation de l'environnement ${envName.toUpperCase()}`);
        const isValid = await processor.processEnvironment(envName);
        console.log(isValid ? '✅ Validation réussie' : '❌ Validation échouée');
        process.exit(isValid ? 0 : 1);
      } else {
        // Valider tous les environnements
        console.log('🔍 Validation de tous les environnements');
        console.log('='.repeat(50));
        const environments = ['dev', 'local', 'cotechnoe', 'playground'];
        let allValid = true;
        
        for (const env of environments) {
          console.log(`\n📋 Test de l'environnement: ${env.toUpperCase()}`);
          try {
            const isValid = await processor.processEnvironment(env);
            if (isValid) {
              console.log(`✅ ${env.toUpperCase()}: OK`);
            } else {
              console.log(`❌ ${env.toUpperCase()}: ERREUR`);
              allValid = false;
            }
          } catch (error) {
            console.log(`❌ ${env.toUpperCase()}: ERREUR - ${error.message}`);
            allValid = false;
          }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(allValid ? '✅ Tous les environnements sont valides' : '❌ Certains environnements ont des erreurs');
        process.exit(allValid ? 0 : 1);
      }
      break;
      
    case 'start':
      // Résoudre puis démarrer l'application
      const resolved = await processor.processEnvironment(envName);
      if (resolved) {
        console.log('🚀 Démarrage de l\'application...');
        require('../src/index.js');
      } else {
        process.exit(1);
      }
      break;
      
    default:
      console.log('🔐 Préprocesseur Azure Key Vault');
      console.log('==============================');
      console.log('Usage:');
      console.log('  node keyvault-preprocessor.js resolve [env]     - Résoudre les secrets dans process.env');
      console.log('  node keyvault-preprocessor.js generate [env]    - Générer fichier .env résolu');
      console.log('  node keyvault-preprocessor.js validate [env]    - Valider la résolution des secrets');
      console.log('  node keyvault-preprocessor.js validate --all    - Valider tous les environnements');
      console.log('  node keyvault-preprocessor.js start [env]       - Résoudre et démarrer l\'app');
      console.log('');
      console.log('Environnements: dev, local, cotechnoe, playground');
      console.log('');
      console.log('Le préprocesseur traite automatiquement les fichiers .env.{env} et .env.{env}.user');
      break;
  }
}

module.exports = { KeyVaultPreprocessor };

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}
