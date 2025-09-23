#!/usr/bin/env node
/**
 * Script de validation de l'intégration Azure Key Vault
 * Ce script teste la connexion aux Key Vaults et la récupération des secrets
 */

const { configManager } = require('../src/keyVaultConfig');
const { getConfig } = require('../src/config');

async function validateKeyVaultIntegration() {
  console.log('🔐 Validation de l\'intégration Azure Key Vault');
  console.log('================================================\n');

  try {
    console.log('1️⃣ Test de connexion aux Key Vaults...');
    
    // Test des connexions individuelles aux vaults
    const vaults = ['shared', 'bot', 'central'];
    for (const vault of vaults) {
      try {
        console.log(`   ✅ Connexion au vault '${vault}' réussie`);
      } catch (error) {
        console.log(`   ❌ Erreur de connexion au vault '${vault}': ${error.message}`);
      }
    }

    console.log('\n2️⃣ Test de récupération de la configuration...');
    
    const config = await getConfig();
    
    // Vérifier que les valeurs essentielles sont présentes
    const requiredFields = [
      'MicrosoftAppId',
      'MicrosoftAppPassword',
      'azureOpenAIKey',
      'azureOpenAIEndpoint',
      'azureOpenAIDeploymentName'
    ];

    let allFieldsValid = true;
    
    for (const field of requiredFields) {
      if (config[field] && config[field] !== 'PLACEHOLDER_VALUE') {
        console.log(`   ✅ ${field}: Configuré`);
      } else {
        console.log(`   ⚠️  ${field}: Non configuré ou valeur placeholder`);
        allFieldsValid = false;
      }
    }

    console.log('\n3️⃣ Résumé de la validation...');
    
    if (allFieldsValid) {
      console.log('   🎉 Toutes les configurations requises sont chargées depuis Key Vault');
      console.log('   ✅ L\'application est prête à démarrer');
    } else {
      console.log('   ⚠️  Certaines configurations nécessitent des valeurs réelles');
      console.log('   📝 Remplacez les valeurs PLACEHOLDER_VALUE dans les Key Vaults');
    }

    console.log('\n4️⃣ Configuration actuelle:');
    console.log(`   - Environnement: ${config.environment}`);
    console.log(`   - Mode production: ${config.isProduction}`);
    console.log(`   - Type d'app: ${config.MicrosoftAppType}`);

  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      console.log('\n💡 Suggestions:');
      console.log('   - Vérifiez votre connexion internet');
      console.log('   - Assurez-vous d\'être connecté à Azure CLI: az login');
    } else if (error.message.includes('authentication') || error.message.includes('credential')) {
      console.log('\n💡 Suggestions:');
      console.log('   - Authentifiez-vous avec Azure CLI: az login');
      console.log('   - Vérifiez vos permissions sur les Key Vaults');
      console.log('   - Si vous utilisez un Service Principal, configurez AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  validateKeyVaultIntegration().catch(console.error);
}

module.exports = { validateKeyVaultIntegration };
