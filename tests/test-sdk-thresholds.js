// Test des nouveaux seuils avec les scores SDK
function getStrictnessThreshold(strictness = 3) {
    const thresholds = {
        1: 0.005, // Very permissive
        2: 0.010, // Permissive  
        3: 0.020, // Default (balanced)
        4: 0.030, // Strict
        5: 0.040  // Very strict
    };
    return thresholds[Math.max(1, Math.min(5, strictness))] || 0.020;
}

console.log('🔧 Test des seuils SDK avec scores observés:');

// Scores observés dans l'application
const sdkResults = [
    { score: 0.0317540317773819, legalIdentifier: 'A-3', title: 'Loi sur les accidents du travail' },
    { score: 0.029, legalIdentifier: 'J-0.1.2' },
    { score: 0.029, legalIdentifier: 'T-15.1' },
    { score: 0.027, legalIdentifier: 'S-2.1' },
    { score: 0.026, legalIdentifier: 'E-15' },
    { score: 0.016, legalIdentifier: 'C-14' }
];

for (let strictness = 1; strictness <= 5; strictness++) {
    const threshold = getStrictnessThreshold(strictness);
    const filtered = sdkResults.filter(r => r.score >= threshold);
    
    console.log(`\n🎯 Strictness ${strictness} = seuil ${threshold}`);
    console.log(`  📊 ${filtered.length}/${sdkResults.length} documents passent:`);
    filtered.forEach(doc => {
        console.log(`    ✅ ${doc.legalIdentifier} (${doc.score.toFixed(4)})`);
    });
}
