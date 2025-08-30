// test-c242-fix.js
// Test rapide pour vérifier que C-24.2 a maintenant le bon statut

const { TTLMetadataParser } = require('./lib/src/indexers/ttlParser.js');

async function testC242StatusFix() {
    try {
        console.log('🔍 Test du statut C-24.2 après correction...');
        
        const parser = new TTLMetadataParser();
        await parser.loadTTL();
        
        const doc = await parser.getDocumentByIdentifier('C-24.2');
        
        if (doc) {
            console.log(`📋 C-24.2 trouvé:`);
            console.log(`   Identifiant: ${doc.legalIdentifier}`);
            console.log(`   Titre: ${doc.title}`);
            console.log(`   Statut: ${doc.status}`);
            console.log(`   Langue du statut: ${doc.statusLang}`);
            
            if (doc.status === 'en vigueur') {
                console.log('✅ SUCCESS: C-24.2 a maintenant le statut correct "en vigueur"');
                return true;
            } else {
                console.log(`❌ FAIL: C-24.2 a toujours le statut incorrect "${doc.status}"`);
                return false;
            }
        } else {
            console.log('❌ FAIL: C-24.2 non trouvé');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        return false;
    }
}

testC242StatusFix().then(success => {
    console.log(success ? '\n🎉 CORRECTION RÉUSSIE!' : '\n❌ Correction échouée');
    process.exit(success ? 0 : 1);
});
