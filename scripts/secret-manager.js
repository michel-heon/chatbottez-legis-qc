#!/usr/bin/env node
/**
 * Script d'automatisation pour la gestion des secrets Azure Key Vault
 * Permet de synchroniser et gérer les secrets entre différents environnements
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const ENVIRONMENTS = {
  dev: {
    shared: 'kv-legis-shared-dev-ce',
    bot: 'kv-legis-bot-dev-ce',
    central: 'kv-cotechnoe-central'
  },
  prod: {
    shared: 'kv-legis-shared-prod-ce',
    bot: 'kv-legis-bot-prod-ce',
    central: 'kv-cotechnoe-central'
  }
};

const SECRET_MAPPINGS = {
  shared: [
    'AZURE-OPENAI-API-KEY-DEV',
    'AZURE-OPENAI-API-KEY-PROD',
    'AZURE-OPENAI-ENDPOINT-DEV',
    'AZURE-OPENAI-ENDPOINT-PROD',
    'AZURE-OPENAI-DEPLOYMENT-NAME-DEV',
    'AZURE-OPENAI-DEPLOYMENT-NAME-PROD'
  ],
  bot: [
    'BOT-ID-DEV',
    'BOT-ID-PROD',
    'BOT-PASSWORD-DEV',
    'BOT-PASSWORD-PROD',
    'BOT-TENANT-ID-DEV',
    'BOT-TENANT-ID-PROD'
  ],
  central: [
    'AZURE-SUBSCRIPTION-ID',
    'AZURE-RESOURCE-GROUP-NAME-LEGIS',
    'BOT-DOMAIN-LEGIS',
    'TEAMS-APP-ID-DEV',
    'TEAMS-APP-ID-PROD',
    'TEAMS-APP-ID-COTECHNOE'
  ]
};

class SecretManager {
  async executeAzCommand(command) {
    try {
      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch (error) {
      throw new Error(`Azure CLI command failed: ${error.message}`);
    }
  }

  async listSecrets(vaultName) {
    try {
      const command = `az keyvault secret list --vault-name "${vaultName}" --query "[].name" -o tsv`;
      const result = await this.executeAzCommand(command);
      return result ? result.split('\n').filter(Boolean) : [];
    } catch (error) {
      console.error(`❌ Erreur lors de la liste des secrets pour ${vaultName}:`, error.message);
      return [];
    }
  }

  async getSecret(vaultName, secretName) {
    try {
      const command = `az keyvault secret show --name "${secretName}" --vault-name "${vaultName}" --query "value" -o tsv`;
      return await this.executeAzCommand(command);
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de ${secretName} depuis ${vaultName}:`, error.message);
      return null;
    }
  }

  async setSecret(vaultName, secretName, secretValue) {
    try {
      const command = `az keyvault secret set --vault-name "${vaultName}" --name "${secretName}" --value "${secretValue}" --output none`;
      await this.executeAzCommand(command);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la définition de ${secretName} dans ${vaultName}:`, error.message);
      return false;
    }
  }

  async auditSecrets() {
    console.log('🔍 Audit des secrets dans tous les Key Vaults');
    console.log('=============================================\n');

    for (const [envName, vaults] of Object.entries(ENVIRONMENTS)) {
      console.log(`📁 Environnement: ${envName.toUpperCase()}`);
      
      for (const [vaultType, vaultName] of Object.entries(vaults)) {
        console.log(`   🔐 Key Vault: ${vaultName}`);
        
        const secrets = await this.listSecrets(vaultName);
        const expectedSecrets = SECRET_MAPPINGS[vaultType] || [];
        
        // Secrets présents
        console.log(`      ✅ Secrets présents (${secrets.length}):`);
        secrets.forEach(secret => console.log(`         - ${secret}`));
        
        // Secrets manquants
        const missing = expectedSecrets.filter(expected => !secrets.includes(expected));
        if (missing.length > 0) {
          console.log(`      ⚠️  Secrets manquants (${missing.length}):`);
          missing.forEach(secret => console.log(`         - ${secret}`));
        }
        
        console.log('');
      }
    }
  }

  async validateEnvironment(env = 'dev') {
    console.log(`🔍 Validation de l'environnement ${env.toUpperCase()}`);
    console.log('===========================================\n');

    const vaults = ENVIRONMENTS[env];
    if (!vaults) {
      console.error(`❌ Environnement ${env} non reconnu`);
      return false;
    }

    let allValid = true;

    for (const [vaultType, vaultName] of Object.entries(vaults)) {
      console.log(`🔐 Validation du vault ${vaultName}...`);
      
      const expectedSecrets = SECRET_MAPPINGS[vaultType].filter(secret => 
        secret.endsWith(`-${env.toUpperCase()}`) || !secret.includes('-DEV') && !secret.includes('-PROD')
      );

      for (const secretName of expectedSecrets) {
        const value = await this.getSecret(vaultName, secretName);
        if (value && value !== 'PLACEHOLDER_VALUE') {
          console.log(`   ✅ ${secretName}: Configuré`);
        } else {
          console.log(`   ❌ ${secretName}: ${value ? 'Placeholder' : 'Manquant'}`);
          allValid = false;
        }
      }
      console.log('');
    }

    return allValid;
  }

  async syncSecrets(sourceEnv, targetEnv, force = false) {
    console.log(`🔄 Synchronisation ${sourceEnv.toUpperCase()} → ${targetEnv.toUpperCase()}`);
    console.log('==================================================\n');

    const sourceVaults = ENVIRONMENTS[sourceEnv];
    const targetVaults = ENVIRONMENTS[targetEnv];

    if (!sourceVaults || !targetVaults) {
      console.error('❌ Environnement source ou cible invalide');
      return false;
    }

    let syncCount = 0;

    for (const [vaultType, sourceVault] of Object.entries(sourceVaults)) {
      const targetVault = targetVaults[vaultType];
      console.log(`🔐 Synchronisation ${vaultType}: ${sourceVault} → ${targetVault}`);

      const expectedSecrets = SECRET_MAPPINGS[vaultType];
      
      for (const secretTemplate of expectedSecrets) {
        const sourceSecret = secretTemplate.replace('-DEV', `-${sourceEnv.toUpperCase()}`).replace('-PROD', `-${sourceEnv.toUpperCase()}`);
        const targetSecret = secretTemplate.replace('-DEV', `-${targetEnv.toUpperCase()}`).replace('-PROD', `-${targetEnv.toUpperCase()}`);

        if (sourceSecret === targetSecret) continue; // Skip non-environment specific secrets

        const value = await this.getSecret(sourceVault, sourceSecret);
        if (value && value !== 'PLACEHOLDER_VALUE') {
          const existing = await this.getSecret(targetVault, targetSecret);
          
          if (!existing || existing === 'PLACEHOLDER_VALUE' || force) {
            const success = await this.setSecret(targetVault, targetSecret, value);
            if (success) {
              console.log(`   ✅ ${sourceSecret} → ${targetSecret}`);
              syncCount++;
            }
          } else {
            console.log(`   ⏭️  ${targetSecret} existe déjà (utilisez --force pour remplacer)`);
          }
        }
      }
    }

    console.log(`\n🎉 Synchronisation terminée: ${syncCount} secrets synchronisés`);
    return true;
  }
}

// Interface CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const secretManager = new SecretManager();

  switch (command) {
    case 'audit':
      await secretManager.auditSecrets();
      break;

    case 'validate':
      const env = args[1] || 'dev';
      const isValid = await secretManager.validateEnvironment(env);
      process.exit(isValid ? 0 : 1);
      break;

    case 'sync':
      const sourceEnv = args[1];
      const targetEnv = args[2];
      const force = args.includes('--force');
      
      if (!sourceEnv || !targetEnv) {
        console.error('Usage: node scripts/secret-manager.js sync <source-env> <target-env> [--force]');
        process.exit(1);
      }
      
      await secretManager.syncSecrets(sourceEnv, targetEnv, force);
      break;

    default:
      console.log('🔐 Gestionnaire de Secrets Azure Key Vault');
      console.log('========================================\n');
      console.log('Commandes disponibles:');
      console.log('  audit                           - Audit de tous les secrets');
      console.log('  validate [env]                  - Valider un environnement (dev par défaut)');
      console.log('  sync <source> <target> [--force] - Synchroniser entre environnements');
      console.log('\nExemples:');
      console.log('  node scripts/secret-manager.js audit');
      console.log('  node scripts/secret-manager.js validate prod');
      console.log('  node scripts/secret-manager.js sync dev prod');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SecretManager };
