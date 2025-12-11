/**
 * Content Moderation Module
 * Filters inappropriate content according to Microsoft Teams Store requirements
 * Note: All user-facing messages are emoji-free per ADR-016
 */

// Keywords and patterns for inappropriate content detection
const INAPPROPRIATE_PATTERNS = {
  weapons: [
    /\b(ak[-\s]?47|gun|rifle|pistolet|arme|weapon|bomb|bombe|explosive)\b/i,
    /\b(assault rifle|handgun|firearm|munitions?)\b/i
  ],
  violence: [
    /\b(kill|murder|attack|assault|threat|menace|tuer|attaquer)\b/i,
    /\b(violence|violent|terroris[mt])\b/i
  ],
  hateSpeech: [
    /\b(religion.*best|meilleure religion|worst religion)\b/i,
    /\b(race|racist|raciste|discrimination)\b/i
  ],
  sexual: [
    /\b(porn|porno|pornograph|sex[uy]|nude|naked)\b/i,
    /\b(prostitut|escort service)\b/i
  ],
  drugs: [
    /\b(cocaine|heroin|meth|marijuana|cannabis|drogue|drug dealing)\b/i,
    /\b(inject|snort|smoke.*drug)\b/i
  ],
  harmful: [
    /\b(suicide|self[-\s]?harm|overdose)\b/i,
    /\b(humiliate|reject.*candidate|discriminat)\b/i,
    /\b(threat.*letter|lettre.*menace)\b/i
  ],
  political: [
    /\b(war.*russia|ukraine.*war|political.*conflict)\b/i,
    /\b(president.*threat|prime minister.*threat)\b/i
  ],
  alcohol: [
    /\b(alcohol.*health|best.*alcohol|whiskey.*health)\b/i,
    /\b(drinking.*benefits|alcool.*santé)\b/i
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
  return `**Bonjour! Je suis Légis Québec, votre conseiller juridique virtuel.**

Je peux vous aider avec:
- Questions sur les lois et règlements du Québec
- Droits au travail
- Protection du consommateur
- Vie privée et données personnelles
- Procédures juridiques

**Tapez "Aide" ou "Help" pour voir toutes mes commandes.**

AVERTISSEMENT: Mes réponses sont à titre informatif seulement et ne constituent pas un avis juridique. Pour toute situation particulière, consultez un avocat.`;
}

/**
 * Get help message
 * @returns {string} Help message (emoji-free per ADR-016)
 */
export function getHelpMessage() {
  return `**Commandes disponibles / Available Commands**

RECHERCHE DE LOIS / LEGAL SEARCH
- "Quelles lois sont disponibles?"
- "Cherche dans le Code civil"
- "Show available laws"

DROITS ET OBLIGATIONS / RIGHTS AND OBLIGATIONS
- "Mes droits au travail"
- "Protection du consommateur"
- "Protéger mes données personnelles"

PROCÉDURES / PROCEDURES
- "Rédiger une mise en demeure"
- "Contester une décision"
- "Comment déposer une plainte"

AUTRES COMMANDES / OTHER COMMANDS
- "/clear" ou "/reset" - Effacer l'historique
- "/help" ou "/aide" - Afficher cette aide

Support: support@cotechnoe.com
Documentation: https://cotechnoe.com/legisqc/help

IMPORTANT: Les réponses sont à titre informatif seulement. Consultez un avocat pour un avis juridique.`;
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
