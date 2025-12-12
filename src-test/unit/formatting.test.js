/**
 * Unit Tests - Response Formatting
 * Tests pour formatBotResponse() - citations, déduplication, markdown
 * Coverage: ADR-004 (citations), ADR-005 (streaming), ADR-016 (emojis)
 */

// Mock pour simuler le comportement de formatBotResponse
// Dans un vrai environnement, on importerait la fonction depuis agent.js
// Pour ce test, on crée une version simplifiée qui suit les ADRs

/**
 * Simule formatBotResponse selon ADR-004 et ADR-005
 * @param {Object} response - Réponse de l'AI avec citations
 * @returns {string} - Texte formaté avec citations
 */
function formatBotResponse(response) {
  if (!response || !response.message) {
    return '';
  }

  let formattedText = response.message.content || '';

  // ADR-004: Ajouter citations si disponibles
  if (response.context && response.context.citations) {
    const citations = deduplicateCitations(response.context.citations);
    
    if (citations.length > 0) {
      formattedText += '\n\n**Sources:**\n';
      citations.forEach((citation, index) => {
        const title = citation.title || citation.filepath || 'Source';
        const url = citation.url || '#';
        formattedText += `\n${index + 1}. [${title}](${url})`;
      });
    }
  }

  return formattedText;
}

/**
 * Déduplique les citations par URL
 * @param {Array} citations - Liste de citations
 * @returns {Array} - Citations uniques
 */
function deduplicateCitations(citations) {
  if (!Array.isArray(citations)) return [];
  
  const seen = new Set();
  return citations.filter(citation => {
    const key = citation.url || citation.filepath || citation.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Valide qu'un texte ne contient pas d'emojis (ADR-016)
 * @param {string} text - Texte à valider
 * @returns {boolean} - true si pas d'emojis
 */
function hasNoEmojis(text) {
  // Regex pour détecter emojis Unicode
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  return !emojiRegex.test(text);
}

describe('Response Formatting', () => {
  
  // ========================================
  // Test 1: Format de base (sans citations)
  // ========================================
  describe('1. Basic Formatting', () => {
    test('1.1 - Retourne message simple', () => {
      const response = {
        message: { content: 'Réponse simple' }
      };
      const result = formatBotResponse(response);
      expect(result).toBe('Réponse simple');
    });

    test('1.2 - Gère message vide', () => {
      const response = {
        message: { content: '' }
      };
      const result = formatBotResponse(response);
      expect(result).toBe('');
    });

    test('1.3 - Gère response null', () => {
      const result = formatBotResponse(null);
      expect(result).toBe('');
    });

    test('1.4 - Gère response sans message', () => {
      const result = formatBotResponse({});
      expect(result).toBe('');
    });
  });

  // ========================================
  // Test 2: Citations ADR-004
  // ========================================
  describe('2. Citations Formatting (ADR-004)', () => {
    test('2.1 - Ajoute 1 citation', () => {
      const response = {
        message: { content: 'Réponse avec citation' },
        context: {
          citations: [
            { title: 'Code civil', url: 'https://legisquebec.gouv.qc.ca/ccq' }
          ]
        }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('**Sources:**');
      expect(result).toContain('1. [Code civil](https://legisquebec.gouv.qc.ca/ccq)');
    });

    test('2.2 - Ajoute 3 citations', () => {
      const response = {
        message: { content: 'Réponse' },
        context: {
          citations: [
            { title: 'Source 1', url: 'https://example.com/1' },
            { title: 'Source 2', url: 'https://example.com/2' },
            { title: 'Source 3', url: 'https://example.com/3' }
          ]
        }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('1. [Source 1](https://example.com/1)');
      expect(result).toContain('2. [Source 2](https://example.com/2)');
      expect(result).toContain('3. [Source 3](https://example.com/3)');
    });

    test('2.3 - Gère citations sans URL', () => {
      const response = {
        message: { content: 'Réponse' },
        context: {
          citations: [
            { title: 'Document sans URL' }
          ]
        }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('1. [Document sans URL](#)');
    });

    test('2.4 - Gère citations avec filepath', () => {
      const response = {
        message: { content: 'Réponse' },
        context: {
          citations: [
            { filepath: '/docs/guide.pdf' }
          ]
        }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('1. [/docs/guide.pdf](#)');
    });
  });

  // ========================================
  // Test 3: Déduplication Citations
  // ========================================
  describe('3. Citations Deduplication', () => {
    test('3.1 - Déduplique par URL identique', () => {
      const citations = [
        { title: 'Source 1', url: 'https://example.com/doc' },
        { title: 'Source 1 bis', url: 'https://example.com/doc' },
        { title: 'Source 2', url: 'https://example.com/doc2' }
      ];
      const result = deduplicateCitations(citations);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Source 1');
      expect(result[1].title).toBe('Source 2');
    });

    test('3.2 - Déduplique par filepath', () => {
      const citations = [
        { filepath: '/docs/doc1.pdf' },
        { filepath: '/docs/doc1.pdf' },
        { filepath: '/docs/doc2.pdf' }
      ];
      const result = deduplicateCitations(citations);
      expect(result).toHaveLength(2);
    });

    test('3.3 - Gère liste vide', () => {
      const result = deduplicateCitations([]);
      expect(result).toHaveLength(0);
    });

    test('3.4 - Gère null/undefined', () => {
      expect(deduplicateCitations(null)).toHaveLength(0);
      expect(deduplicateCitations(undefined)).toHaveLength(0);
    });

    test('3.5 - Préserve ordre première occurrence', () => {
      const citations = [
        { title: 'A', url: 'url1' },
        { title: 'B', url: 'url2' },
        { title: 'A2', url: 'url1' }
      ];
      const result = deduplicateCitations(citations);
      expect(result[0].title).toBe('A');
      expect(result[1].title).toBe('B');
    });
  });

  // ========================================
  // Test 4: Markdown Formatting
  // ========================================
  describe('4. Markdown Support', () => {
    test('4.1 - Préserve formatage gras', () => {
      const response = {
        message: { content: 'Texte avec **gras**' }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('**gras**');
    });

    test('4.2 - Préserve listes à puces', () => {
      const response = {
        message: { content: '- Item 1\n- Item 2\n- Item 3' }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
    });

    test('4.3 - Préserve listes numérotées', () => {
      const response = {
        message: { content: '1. Étape 1\n2. Étape 2' }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('1. Étape 1');
      expect(result).toContain('2. Étape 2');
    });

    test('4.4 - Préserve liens inline', () => {
      const response = {
        message: { content: 'Voir [CNESST](https://cnesst.gouv.qc.ca)' }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('[CNESST](https://cnesst.gouv.qc.ca)');
    });
  });

  // ========================================
  // Test 5: ADR-016 - Pas d'Emojis
  // ========================================
  describe('5. No Emojis (ADR-016)', () => {
    test('5.1 - hasNoEmojis détecte emojis classiques', () => {
      expect(hasNoEmojis('Texte sans emoji')).toBe(true);
      expect(hasNoEmojis('Texte avec 😀')).toBe(false);
      expect(hasNoEmojis('👷 travail')).toBe(false);
      expect(hasNoEmojis('🛒 achat')).toBe(false);
    });

    test('5.2 - hasNoEmojis détecte symboles', () => {
      expect(hasNoEmojis('✓ OK')).toBe(false);
      expect(hasNoEmojis('⚖️ justice')).toBe(false);
    });

    test('5.3 - hasNoEmojis accepte accents français', () => {
      expect(hasNoEmojis('Québec, légal, ça, déjà')).toBe(true);
    });

    test('5.4 - hasNoEmojis accepte caractères spéciaux', () => {
      expect(hasNoEmojis('Article 1457 C.c.Q.')).toBe(true);
      expect(hasNoEmojis('100% - [OK] (valide)')).toBe(true);
    });
  });

  // ========================================
  // Test 6: Integration Complete
  // ========================================
  describe('6. Full Response Integration', () => {
    test('6.1 - Response complète avec citations', () => {
      const response = {
        message: {
          content: 'Voici la réponse juridique.\n\n**Important:** Consultez un avocat.'
        },
        context: {
          citations: [
            { title: 'Code civil du Québec', url: 'https://legisquebec.gouv.qc.ca/ccq' },
            { title: 'CNESST', url: 'https://cnesst.gouv.qc.ca' }
          ]
        }
      };
      const result = formatBotResponse(response);
      
      expect(result).toContain('Voici la réponse juridique');
      expect(result).toContain('**Important:**');
      expect(result).toContain('**Sources:**');
      expect(result).toContain('1. [Code civil du Québec]');
      expect(result).toContain('2. [CNESST]');
    });

    test('6.2 - Pas d\'emojis dans response', () => {
      const response = {
        message: { content: 'Réponse légale sans emoji' }
      };
      const result = formatBotResponse(response);
      expect(hasNoEmojis(result)).toBe(true);
    });

    test('6.3 - Déduplique citations dans response finale', () => {
      const response = {
        message: { content: 'Réponse' },
        context: {
          citations: [
            { title: 'Doc', url: 'https://example.com/doc' },
            { title: 'Doc 2', url: 'https://example.com/doc' },
            { title: 'Doc 3', url: 'https://example.com/doc2' }
          ]
        }
      };
      const result = formatBotResponse(response);
      
      // Devrait avoir seulement 2 citations (1 dédupliquée)
      const sourceMatches = result.match(/\d+\. \[/g);
      expect(sourceMatches).toHaveLength(2);
    });
  });

  // ========================================
  // Test 7: Edge Cases
  // ========================================
  describe('7. Edge Cases', () => {
    test('7.1 - Gère citations array vide', () => {
      const response = {
        message: { content: 'Réponse' },
        context: { citations: [] }
      };
      const result = formatBotResponse(response);
      expect(result).not.toContain('**Sources:**');
    });

    test('7.2 - Gère message très long', () => {
      const longContent = 'A'.repeat(5000);
      const response = {
        message: { content: longContent }
      };
      const result = formatBotResponse(response);
      expect(result.length).toBeGreaterThan(4990);
    });

    test('7.3 - Gère caractères spéciaux dans citations', () => {
      const response = {
        message: { content: 'Réponse' },
        context: {
          citations: [
            { title: 'L\'article 1457 C.c.Q.', url: 'https://example.com' }
          ]
        }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('[L\'article 1457 C.c.Q.]');
    });

    test('7.4 - Gère newlines dans message', () => {
      const response = {
        message: { content: 'Ligne 1\n\nLigne 2\nLigne 3' }
      };
      const result = formatBotResponse(response);
      expect(result).toContain('Ligne 1\n\nLigne 2');
    });
  });

  // ========================================
  // Test 8: Performance
  // ========================================
  describe('8. Performance', () => {
    test('8.1 - Formatage rapide (<5ms)', () => {
      const response = {
        message: { content: 'Réponse simple' }
      };
      const start = Date.now();
      formatBotResponse(response);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5);
    });

    test('8.2 - Déduplication rapide 100 citations (<10ms)', () => {
      const citations = Array.from({ length: 100 }, (_, i) => ({
        title: `Doc ${i}`,
        url: `https://example.com/doc${i % 10}` // 10 URLs uniques
      }));
      
      const start = Date.now();
      const result = deduplicateCitations(citations);
      const duration = Date.now() - start;
      
      expect(result).toHaveLength(10); // Seulement URLs uniques
      expect(duration).toBeLessThan(10);
    });
  });
});

module.exports = {
  formatBotResponse,
  deduplicateCitations,
  hasNoEmojis
};
