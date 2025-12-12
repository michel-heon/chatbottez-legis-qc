/**
 * Unit Tests - Legal Commands Detection
 * Tests pour les 6 commandes juridiques personnalisées
 * Coverage: 18 tests des patterns de détection
 */

const {
  detectLegalCommand,
  handleDroitsTravail,
  handleProtectionConsommateur,
  handleDonneesPersonnelles,
  handleMiseEnDemeure,
  handleContesterDecision,
  handleDeposerPlainte
} = require('../../src/app/legalCommands');

describe('Legal Commands Detection', () => {
  
  // ========================================
  // Test 1: Droits au Travail
  // ========================================
  describe('1. Droits au Travail', () => {
    test('1.1 - Détecte "Mes droits au travail"', () => {
      const result = detectLegalCommand("Mes droits au travail");
      expect(result).toBeTruthy();
      expect(result.name).toBe('droits_travail');
      expect(result.welcomeMessage).toContain('Droits au travail');
      expect(result.enhancedInstructions).toContain('Loi sur les normes du travail');
    });

    test('1.2 - Détecte "normes du travail"', () => {
      const result = detectLegalCommand("Quelles sont les normes du travail?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('droits_travail');
    });

    test('1.3 - Détecte "CNESST"', () => {
      const result = detectLegalCommand("Comment contacter la CNESST?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('droits_travail');
    });

    test('1.4 - Variation: "droits de travailleur"', () => {
      const result = detectLegalCommand("Je veux savoir mes droits de travailleur");
      expect(result).toBeTruthy();
      expect(result.name).toBe('droits_travail');
    });
  });

  // ========================================
  // Test 2: Protection du Consommateur
  // ========================================
  describe('2. Protection du Consommateur', () => {
    test('2.1 - Détecte "Protection du consommateur"', () => {
      const result = detectLegalCommand("Protection du consommateur");
      expect(result).toBeTruthy();
      expect(result.name).toBe('protection_consommateur');
      expect(result.welcomeMessage).toContain('Protection du consommateur');
    });

    test('2.2 - Détecte "OPC"', () => {
      const result = detectLegalCommand("Comment porter plainte à l'OPC?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('protection_consommateur');
    });

    test('2.3 - Détecte "garantie légale"', () => {
      const result = detectLegalCommand("Qu'est-ce que la garantie légale?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('protection_consommateur');
    });

    test('2.4 - Détecte "droits des consommateurs"', () => {
      const result = detectLegalCommand("Quels sont mes droits des consommateurs?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('protection_consommateur');
    });
  });

  // ========================================
  // Test 3: Données Personnelles
  // ========================================
  describe('3. Données Personnelles', () => {
    test('3.1 - Détecte "Protéger mes données personnelles"', () => {
      const result = detectLegalCommand("Comment protéger mes données personnelles?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('donnees_personnelles');
      expect(result.welcomeMessage).toContain('Protection des données personnelles');
    });

    test('3.2 - Détecte "Loi 25"', () => {
      const result = detectLegalCommand("C'est quoi la Loi 25?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('donnees_personnelles');
    });

    test('3.3 - Détecte "vie privée"', () => {
      const result = detectLegalCommand("Mes droits à la vie privée");
      expect(result).toBeTruthy();
      expect(result.name).toBe('donnees_personnelles');
    });

    test('3.4 - Détecte "CAI"', () => {
      const result = detectLegalCommand("Porter plainte à la CAI");
      expect(result).toBeTruthy();
      expect(result.name).toBe('donnees_personnelles');
    });
  });

  // ========================================
  // Test 4: Mise en Demeure
  // ========================================
  describe('4. Mise en Demeure', () => {
    test('4.1 - Détecte "Rédiger une mise en demeure"', () => {
      const result = detectLegalCommand("Rédiger une mise en demeure");
      expect(result).toBeTruthy();
      expect(result.name).toBe('mise_en_demeure');
      expect(result.welcomeMessage).toContain('Rédiger une mise en demeure');
    });

    test('4.2 - Détecte "mise en demeure"', () => {
      const result = detectLegalCommand("J'ai besoin d'une mise en demeure");
      expect(result).toBeTruthy();
      expect(result.name).toBe('mise_en_demeure');
    });

    test('4.3 - Détecte "lettre de mise en demeure"', () => {
      const result = detectLegalCommand("Comment écrire une lettre de mise en demeure?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('mise_en_demeure');
    });
  });

  // ========================================
  // Test 5: Contester une Décision
  // ========================================
  describe('5. Contester une Décision', () => {
    test('5.1 - Détecte "Contester une décision"', () => {
      const result = detectLegalCommand("Contester une décision");
      expect(result).toBeTruthy();
      expect(result.name).toBe('contester_decision');
      expect(result.welcomeMessage).toContain('Contester une décision');
    });

    test('5.2 - Détecte "faire appel"', () => {
      const result = detectLegalCommand("Comment faire appel d'une décision?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('contester_decision');
    });

    test('5.3 - Détecte "révision d\'une décision"', () => {
      const result = detectLegalCommand("révision d'une décision");
      expect(result).toBeTruthy();
      expect(result.name).toBe('contester_decision');
    });

    test('5.4 - Détecte "contrôle judiciaire"', () => {
      const result = detectLegalCommand("Qu'est-ce qu'un contrôle judiciaire?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('contester_decision');
    });
  });

  // ========================================
  // Test 6: Déposer une Plainte
  // ========================================
  describe('6. Déposer une Plainte', () => {
    test('6.1 - Détecte "Déposer une plainte"', () => {
      const result = detectLegalCommand("Comment déposer une plainte?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('deposer_plainte');
      expect(result.welcomeMessage).toContain('Déposer une plainte');
    });

    test('6.2 - Détecte "porter plainte"', () => {
      const result = detectLegalCommand("Je veux porter plainte");
      expect(result).toBeTruthy();
      expect(result.name).toBe('deposer_plainte');
    });

    test('6.3 - Détecte "faire une plainte"', () => {
      const result = detectLegalCommand("Comment faire une plainte?");
      expect(result).toBeTruthy();
      expect(result.name).toBe('deposer_plainte');
    });
  });

  // ========================================
  // Test 7: Edge Cases
  // ========================================
  describe('7. Edge Cases & Negative Tests', () => {
    test('7.1 - Ne détecte PAS une question générale', () => {
      const result = detectLegalCommand("Qu'est-ce que le Code civil du Québec?");
      expect(result).toBeNull();
    });

    test('7.2 - Ne détecte PAS un message vide', () => {
      const result = detectLegalCommand("");
      expect(result).toBeNull();
    });

    test('7.3 - Ne détecte PAS null/undefined', () => {
      expect(detectLegalCommand(null)).toBeNull();
      expect(detectLegalCommand(undefined)).toBeNull();
    });

    test('7.4 - Gère les espaces en début/fin', () => {
      const result = detectLegalCommand("  Mes droits au travail  ");
      expect(result).toBeTruthy();
      expect(result.name).toBe('droits_travail');
    });

    test('7.5 - Case insensitive', () => {
      const result = detectLegalCommand("MES DROITS AU TRAVAIL");
      expect(result).toBeTruthy();
      expect(result.name).toBe('droits_travail');
    });

    test('7.6 - Détecte commande dans phrase longue', () => {
      const result = detectLegalCommand(
        "Bonjour, j'ai besoin d'aide pour rédiger une mise en demeure à mon propriétaire"
      );
      expect(result).toBeTruthy();
      expect(result.name).toBe('mise_en_demeure');
    });
  });

  // ========================================
  // Test 8: Handler Functions
  // ========================================
  describe('8. Handler Functions Return Correct Structure', () => {
    test('8.1 - handleDroitsTravail retourne structure valide', () => {
      const result = handleDroitsTravail();
      expect(result).toHaveProperty('name', 'droits_travail');
      expect(result).toHaveProperty('enhancedInstructions');
      expect(result).toHaveProperty('welcomeMessage');
      expect(result.enhancedInstructions).toContain('CNESST');
    });

    test('8.2 - handleProtectionConsommateur retourne structure valide', () => {
      const result = handleProtectionConsommateur();
      expect(result).toHaveProperty('name', 'protection_consommateur');
      expect(result.enhancedInstructions).toContain('OPC');
    });

    test('8.3 - handleDonneesPersonnelles retourne structure valide', () => {
      const result = handleDonneesPersonnelles();
      expect(result).toHaveProperty('name', 'donnees_personnelles');
      expect(result.enhancedInstructions).toContain('Loi 25');
    });

    test('8.4 - handleMiseEnDemeure retourne structure valide', () => {
      const result = handleMiseEnDemeure();
      expect(result).toHaveProperty('name', 'mise_en_demeure');
      expect(result.enhancedInstructions).toContain('10-15 jours');
    });

    test('8.5 - handleContesterDecision retourne structure valide', () => {
      const result = handleContesterDecision();
      expect(result).toHaveProperty('name', 'contester_decision');
      expect(result.enhancedInstructions).toContain('TAQ');
    });

    test('8.6 - handleDeposerPlainte retourne structure valide', () => {
      const result = handleDeposerPlainte();
      expect(result).toHaveProperty('name', 'deposer_plainte');
      expect(result.enhancedInstructions).toContain('CNESST');
    });
  });

  // ========================================
  // Test 9: Performance
  // ========================================
  describe('9. Performance Tests', () => {
    test('9.1 - Détection commande < 10ms', () => {
      const start = performance.now();
      detectLegalCommand("Mes droits au travail");
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10);
    });

    test('9.2 - Détection null rapide < 1ms', () => {
      const start = performance.now();
      detectLegalCommand("Question générale sans commande juridique spécifique ici");
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1);
    });
  });
});
