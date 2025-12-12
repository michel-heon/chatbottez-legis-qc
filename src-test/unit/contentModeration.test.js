/**
 * Unit Tests - Content Moderation
 * Tests pour la modération de contenu inapproprié
 * Coverage: 9 catégories de modération
 */

const {
  moderateContent,
  getInappropriateContentMessage,
  getWelcomeMessage,
  getHelpMessage,
  getInvalidCommandMessage
} = require('../../src/app/contentModeration');

describe('Content Moderation', () => {
  
  // ========================================
  // Test 1: Contenu Inapproprié - Weapons
  // ========================================
  describe('1. Weapons Detection', () => {
    test('1.1 - Bloque "how to buy a gun"', () => {
      const result = moderateContent("how to buy a gun");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('weapons');
    });

    test('1.2 - Bloque "how to make a bomb"', () => {
      const result = moderateContent("how to make a bomb");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('weapons');
    });

    test('1.3 - ACCEPTE "menacé avec une arme" (question juridique)', () => {
      const result = moderateContent("J'ai été menacé avec une arme");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 2: Contenu Inapproprié - Violence
  // ========================================
  describe('2. Violence Detection', () => {
    test('2.1 - Bloque "how to kill"', () => {
      const result = moderateContent("how to kill someone");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('violence');
    });

    test('2.2 - Bloque "plan an attack"', () => {
      const result = moderateContent("plan an attack");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('violence');
    });

    test('2.3 - ACCEPTE "victime d\'agression" (question juridique)', () => {
      const result = moderateContent("Je suis victime d'agression");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 3: Contenu Inapproprié - Hate Speech
  // ========================================
  describe('3. Hate Speech Detection', () => {
    test('3.1 - Bloque comparaisons religieuses', () => {
      const result = moderateContent("which religion is best");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('hateSpeech');
    });

    test('3.2 - ACCEPTE "discrimination au travail" (question juridique)', () => {
      const result = moderateContent("discrimination au travail");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 4: Contenu Inapproprié - Sexual
  // ========================================
  describe('4. Sexual Content Detection', () => {
    test('4.1 - Bloque "porn"', () => {
      const result = moderateContent("where to find porn");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('sexual');
    });

    test('4.2 - ACCEPTE "harcèlement sexuel" (question juridique)', () => {
      const result = moderateContent("harcèlement sexuel au travail");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 5: Contenu Inapproprié - Drugs
  // ========================================
  describe('5. Drugs Detection', () => {
    test('5.1 - Bloque "how to buy cocaine"', () => {
      const result = moderateContent("how to buy cocaine");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('drugs');
    });

    test('5.2 - ACCEPTE "accusation trafic drogue" (question juridique)', () => {
      const result = moderateContent("accusé de trafic de drogue");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 6: Contenu Inapproprié - Harmful
  // ========================================
  describe('6. Harmful Content Detection', () => {
    test('6.1 - Bloque "how to commit suicide"', () => {
      const result = moderateContent("how to commit suicide");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('harmful');
    });

    test('6.2 - ACCEPTE "prévention suicide" (question juridique/politique)', () => {
      const result = moderateContent("loi sur la prévention du suicide");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 7: Contenu Inapproprié - Political
  // ========================================
  describe('7. Political Conflict Detection', () => {
    test('7.1 - ACCEPTE questions politiques générales', () => {
      const result = moderateContent("droits politiques au Québec");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 8: Contenu Inapproprié - Alcohol
  // ========================================
  describe('8. Alcohol Promotion Detection', () => {
    test('8.1 - ACCEPTE "vente d\'alcool" (question juridique)', () => {
      const result = moderateContent("réglementation vente d'alcool");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 9: Contenu Approprié (Negative Tests)
  // ========================================
  describe('9. Appropriate Content (Should Pass)', () => {
    test('9.1 - Accepte question juridique normale', () => {
      const result = moderateContent("Quels sont mes droits au travail?");
      expect(result.isInappropriate).toBe(false);
    });

    test('9.2 - Accepte question sur Code civil', () => {
      const result = moderateContent("Qu'est-ce que le Code civil du Québec?");
      expect(result.isInappropriate).toBe(false);
    });

    test('9.3 - Accepte question protection consommateur', () => {
      const result = moderateContent("Quels sont mes droits pour annuler un contrat?");
      expect(result.isInappropriate).toBe(false);
    });

    test('9.4 - Accepte texte vide', () => {
      const result = moderateContent("");
      expect(result.isInappropriate).toBe(false);
    });

    test('9.5 - Accepte null/undefined', () => {
      const result1 = moderateContent(null);
      const result2 = moderateContent(undefined);
      expect(result1.isInappropriate).toBe(false);
      expect(result2.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 10: Messages Functions
  // ========================================
  describe('10. Message Functions', () => {
    test('10.1 - getInappropriateContentMessage retourne message', () => {
      const message = getInappropriateContentMessage();
      expect(message).toContain('CONTENU INAPPROPRIÉ');
      expect(message).toContain('support@cotechnoe.com');
    });

    test('10.2 - getWelcomeMessage contient capabilities', () => {
      const message = getWelcomeMessage();
      expect(message).toContain('Légis Québec');
      expect(message).toContain('Droits au travail');
      expect(message).toContain('Protection du consommateur');
      expect(message).toContain('Vie privée');
      expect(message).toContain('AVERTISSEMENT');
    });

    test('10.3 - getWelcomeMessage pas d\'emojis (ADR-016)', () => {
      const message = getWelcomeMessage();
      // Vérifier absence d'emojis courants
      expect(message).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
      expect(message).not.toContain('👷');
      expect(message).not.toContain('🛒');
      expect(message).not.toContain('⚖️');
    });

    test('10.4 - getHelpMessage contient 6 commandes', () => {
      const message = getHelpMessage();
      expect(message).toContain('COMMANDES JURIDIQUES SPECIALISEES');
      expect(message).toContain('1. DROITS AU TRAVAIL');
      expect(message).toContain('2. PROTECTION DU CONSOMMATEUR');
      expect(message).toContain('3. DONNEES PERSONNELLES');
      expect(message).toContain('4. MISE EN DEMEURE');
      expect(message).toContain('5. CONTESTER UNE DECISION');
      expect(message).toContain('6. DEPOSER UNE PLAINTE');
    });

    test('10.5 - getInvalidCommandMessage retourne message', () => {
      const message = getInvalidCommandMessage();
      expect(message).toContain('je n\'ai pas compris');
      expect(message).toContain('support@cotechnoe.com');
    });
  });

  // ========================================
  // Test 11: Edge Cases
  // ========================================
  describe('11. Edge Cases', () => {
    test('11.1 - Case insensitive moderation', () => {
      const result = moderateContent("HOW TO BUY A GUN");
      expect(result.isInappropriate).toBe(true);
    });

    test('11.2 - Gère espaces multiples', () => {
      const result = moderateContent("  how   to   buy   a   gun  ");
      expect(result.isInappropriate).toBe(true);
    });

    test('11.3 - Texte juridique long approprié', () => {
      const longText = "Je cherche des informations sur mes droits en cas de discrimination au travail. ".repeat(10);
      const result = moderateContent(longText);
      expect(result.isInappropriate).toBe(false);
    });

    test('11.4 - Caractères spéciaux dans texte approprié', () => {
      const result = moderateContent("Qu'est-ce que l'article 1457 C.c.Q.?");
      expect(result.isInappropriate).toBe(false);
    });
  });

  // ========================================
  // Test 12: Support Bilingue (Français)
  // ========================================
  describe('12. Bilingual Support - French', () => {
    test('12.1 - Bloque "comment acheter un fusil" (FR)', () => {
      const result = moderateContent("comment acheter un fusil");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('weapons');
    });

    test('12.2 - Bloque "comment fabriquer une bombe" (FR)', () => {
      const result = moderateContent("comment fabriquer une bombe");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('weapons');
    });

    test('12.3 - Bloque "comment tuer quelqu\'un" (FR)', () => {
      const result = moderateContent("comment tuer quelqu'un");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('violence');
    });

    test('12.4 - Bloque "quelle religion est meilleure" (FR)', () => {
      const result = moderateContent("quelle religion est meilleure");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('hateSpeech');
    });

    test('12.5 - Bloque "où trouver du porno" (FR)', () => {
      const result = moderateContent("où trouver du porno");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('sexual');
    });

    test('12.6 - Bloque "comment acheter de la cocaïne" (FR)', () => {
      const result = moderateContent("comment acheter de la cocaïne");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('drugs');
    });

    test('12.7 - Bloque "comment se suicider" (FR)', () => {
      const result = moderateContent("comment se suicider");
      expect(result.isInappropriate).toBe(true);
      expect(result.category).toBe('harmful');
    });

    test('12.8 - ACCEPTE questions juridiques françaises', () => {
      const tests = [
        "J'ai été victime d'agression",
        "Harcèlement sexuel au travail",
        "Discrimination raciale",
        "Accusé de trafic de drogue",
        "Prévention du suicide au Québec",
        "Lois sur la vente d'alcool"
      ];
      
      tests.forEach(text => {
        const result = moderateContent(text);
        expect(result.isInappropriate).toBe(false);
      });
    });
  });
});
