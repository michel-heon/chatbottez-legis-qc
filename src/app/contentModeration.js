/**
 * Content Moderation Module
 * Filters inappropriate content according to Microsoft Teams Store requirements
 * Note: All user-facing messages are emoji-free per ADR-016
 */

// Keywords and patterns for inappropriate content detection
// NOTE: Patterns are designed to be PERMISSIVE for legal context
// Block only clearly inappropriate requests, not legitimate legal questions
// Supports both English and French
const INAPPROPRIATE_PATTERNS = {
  weapons: [
    // Block: How to acquire/make weapons (EN + FR)
    /\bhow\s+to\s+(buy|make|build|get|obtain)\s*(a\s+)?(gun|bomb|weapon|explosive)/i,
    /\bcomment\s+(acheter|fabriquer|construire|obtenir)\s*(un\s+|une\s+)?(fusil|pistolet|arme|bombe|explosif)/i,
    /\bwhere\s+to\s+(buy|find)\s*(an?\s+)?(ak[-\s]?47|rifle|firearm)/i,
    /\bo[uù]\s+(acheter|trouver)\s*(un\s+|une\s+)?(ak[-\s]?47|fusil|arme)/i,
    // Allow: "J'ai été menacé avec une arme" (legal question about being threatened)
  ],
  violence: [
    // Block: Instructions for violence (EN + FR)
    /\bhow\s+to\s+(kill|murder|attack|hurt)/i,
    /\bcomment\s+(tuer|assassiner|attaquer|blesser)/i,
    /\bplan\s+(an attack|violence|terroris)/i,
    /\bplanifier\s+(une attaque|violence|terroris)/i,
    // Allow: "J'ai été victime d'agression" (victim seeking legal help)
  ],
  hateSpeech: [
    // Block: Comparative hate speech (EN + FR)
    /\bwhich\s+(religion|race)\s*(is\s+)?(best|worst|better|superior)/i,
    /\bquelle\s+(religion|race)\s*(est\s+)?(meilleure|pire|sup[ée]rieure)/i,
    /\b(religions?|races?)\s+(best|worst|better|superior)/i,
    /\b(religions?|races?)\s+(meilleure|pire|sup[ée]rieure)/i,
    // Allow: "discrimination au travail" (legal question about discrimination)
  ],
  sexual: [
    // Block: Pornography requests (EN + FR)
    /\bporn|porno|pornograph|where.*nude/i,
    /\bo[uù]\s+(trouver|voir)\s+(du\s+)?(porno|pornographie)/i,
    /\bhow\s+to\s*.*(sex[uy]|nude|prostitut)/i,
    /\bcomment\s+.*(sexe|nu|prostitut)/i,
    // Allow: "harcèlement sexuel" (legal question about harassment)
  ],
  drugs: [
    // Block: How to obtain illegal drugs (EN + FR)
    /\bhow\s+to\s+(buy|get|obtain|make)\s*.*(cocaine|heroin|meth)/i,
    /\bcomment\s+(acheter|obtenir|fabriquer)\s*.*(coca[iï]ne|h[ée]ro[iï]ne|m[ée]th)/i,
    /\bwhere\s+to\s+(buy|find)\s*.*(drug|cocaine|heroin)/i,
    /\bo[uù]\s+(acheter|trouver)\s*.*(drogue|coca[iï]ne|h[ée]ro[iï]ne)/i,
    // Allow: "accusation de trafic de drogue" (legal defense question)
  ],
  harmful: [
    // Block: How to harm self or others (EN + FR)
    /\bhow\s+to\s+(commit\s+suicide|self[-\s]?harm|overdose)/i,
    /\bcomment\s+(se\s+suicider|s'auto[-\s]?mutiler|faire\s+une\s+overdose)/i,
    /\bmethods?\s+(of|for)\s+(suicide|self[-\s]?harm)/i,
    /\bm[ée]thodes?\s+(de|pour)\s+(suicide|auto[-\s]?mutilation)/i,
    // Allow: "prévention du suicide" (legal/policy questions)
  ],
  political: [
    // Block: Calls for political violence (very limited, EN + FR)
    /\b(overthrow|assassinate)\s*.*(government|president|ministre)/i,
    /\b(renverser|assassiner)\s*.*(gouvernement|pr[ée]sident|premier\s+ministre)/i,
    // Allow: Most political questions are legitimate
  ],
  alcohol: [
    // Block: False health claims about alcohol (very limited, EN + FR)
    /\balcohol\s+(cures|treats|heals)/i,
    /\balcool\s+(gu[ée]rit|soigne|traite)/i,
    // Allow: "vente d'alcool" (legal question about alcohol sales)
  ]
};

/**
 * Check if content contains inappropriate material
 * @param {string} text - The text to moderate
 * @returns {Object} Moderation result with isInappropriate flag, category, and message
 */
export function moderateContent(text) {
  if (!text || text.trim().length === 0) {
    return { isInappropriate: false };
  }

  const lowerText = text.toLowerCase();

  // Check each category
  for (const [category, patterns] of Object.entries(INAPPROPRIATE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        return {
          isInappropriate: true,
          category,
          message: getInappropriateContentMessage()
        };
      }
    }
  }

  return { isInappropriate: false };
}

/**
 * Get the standardized inappropriate content rejection message
 * @returns {string} Rejection message (emoji-free per ADR-016)
 */
export function getInappropriateContentMessage() {
  return `[CONTENU INAPPROPRIÉ] Je ne peux pas vous aider avec ce type de question. / I cannot assist you with this type of query.

Pour signaler du contenu inapproprié: support@cotechnoe.com
To report inappropriate content: support@cotechnoe.com`;
}

/**
 * Get welcome message for greetings
 * @returns {string} Welcome message (emoji-free per ADR-016)
 */
export function getWelcomeMessage() {
  return `Bonjour! Je suis Légis Québec, votre conseiller juridique virtuel.

Je peux vous aider avec:
• Questions sur les lois et règlements du Québec
• Droits au travail
• Protection du consommateur
• Vie privée et données personnelles
• Procédures juridiques

Tapez "Aide" ou "Help" pour voir toutes mes commandes.

AVERTISSEMENT: Mes réponses sont à titre informatif seulement et ne constituent pas un avis juridique. Pour toute situation particulière, consultez un avocat.`;
}

/**
 * Get help message
 * @returns {string} Help message (emoji-free per ADR-016)
 */
export function getHelpMessage() {
  return `**Commandes disponibles / Available Commands**

COMMANDES JURIDIQUES SPECIALISEES / SPECIALIZED LEGAL COMMANDS
---------------------------------------------------------------
Ces commandes activent des contextes spécialisés pour des réponses optimisées:

1. DROITS AU TRAVAIL
   - "Mes droits au travail"
   - "Normes du travail"
   - Couvre: salaire, congés, congédiement, CNESST

2. PROTECTION DU CONSOMMATEUR
   - "Protection du consommateur"
   - "Droits des consommateurs"
   - Couvre: garanties, contrats, recours, OPC

3. DONNEES PERSONNELLES
   - "Protéger mes données personnelles"
   - "Vie privée et confidentialité"
   - Couvre: Loi 25, consentement, CAI

4. MISE EN DEMEURE
   - "Rédiger une mise en demeure"
   - "Comment écrire une mise en demeure"
   - Couvre: structure, contenu, procédures

5. CONTESTER UNE DECISION
   - "Contester une décision"
   - "Faire appel d'une décision"
   - Couvre: recours, délais, tribunaux

6. DEPOSER UNE PLAINTE
   - "Comment déposer une plainte"
   - "Porter plainte"
   - Couvre: organismes, procédures, délais

RECHERCHE GENERALE / GENERAL SEARCH
------------------------------------
- Posez toute question sur les lois du Québec
- "Quelles lois sont disponibles?"
- "Cherche dans le Code civil"

AUTRES COMMANDES / OTHER COMMANDS
----------------------------------
- "/clear" ou "/reset" - Effacer l'historique
- "/help" ou "/aide" - Afficher cette aide

CONTACT & SUPPORT
-----------------
Email: support@cotechnoe.com
Documentation: https://cotechnoe.com/legisqc/help

AVERTISSEMENT LEGAL
-------------------
Les réponses sont à titre informatif seulement et ne constituent pas un avis juridique.
Pour toute situation particulière, consultez un avocat.

Legal information is for general purposes only and does not constitute legal advice.
Consult a lawyer for specific situations.`;
}

/**
 * Get invalid command message
 * @returns {string} Invalid command message (emoji-free per ADR-016)
 */
export function getInvalidCommandMessage() {
  return `**Désolé, je n'ai pas compris cette commande. / Sorry, I didn't understand this command.**

SUGGESTIONS:
- Tapez "Aide" ou "Help" pour voir toutes les commandes
- Posez une question sur le droit québécois
- Type "Help" to see all available commands

Questions? support@cotechnoe.com`;
}
