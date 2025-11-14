/**
 * Content Moderation Module
 * Filters inappropriate content according to Microsoft Teams Store requirements
 */

export interface ModerationResult {
  isInappropriate: boolean;
  category?: string;
  message?: string;
}

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
 */
export function moderateContent(text: string): ModerationResult {
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
 */
export function getInappropriateContentMessage(): string {
  return `❌ Je ne peux pas vous aider avec ce type de question. / I cannot assist you with this type of query.

📧 Pour signaler du contenu inapproprié: support@cotechnoe.com
📧 To report inappropriate content: support@cotechnoe.com`;
}

/**
 * Get welcome message for greetings
 */
export function getWelcomeMessage(): string {
  return `👋 **Bonjour! Je suis Légis QC, votre conseiller juridique virtuel.**

Je peux vous aider avec:
✅ Questions sur les lois et règlements du Québec
✅ Droits au travail
✅ Protection du consommateur
✅ Vie privée et données personnelles
✅ Procédures juridiques

💡 **Tapez "Aide" ou "Help" pour voir toutes mes commandes.**

⚖️ **Avertissement:** Mes réponses sont à titre informatif seulement et ne constituent pas un avis juridique. Pour toute situation particulière, consultez un avocat.`;
}

/**
 * Get help message
 */
export function getHelpMessage(): string {
  return `📚 **Commandes disponibles / Available Commands**

🔍 **Recherche de lois / Legal Search**
• "Quelles lois sont disponibles?"
• "Cherche dans le Code civil"
• "Show available laws"

⚖️ **Droits et obligations / Rights and Obligations**
• "Mes droits au travail"
• "Protection du consommateur"
• "Protéger mes données personnelles"

📝 **Procédures / Procedures**
• "Rédiger une mise en demeure"
• "Contester une décision"
• "Comment déposer une plainte"

🗑️ **Autres commandes / Other Commands**
• "/clear" ou "/reset" - Effacer l'historique
• "/help" ou "/aide" - Afficher cette aide

📧 **Support:** support@cotechnoe.com
📚 **Documentation:** https://cotechnoe.com/legisqc/help

⚠️ **Important:** Les réponses sont à titre informatif seulement. Consultez un avocat pour un avis juridique.`;
}

/**
 * Get invalid command message
 */
export function getInvalidCommandMessage(): string {
  return `❌ **Désolé, je n'ai pas compris cette commande. / Sorry, I didn't understand this command.**

💡 **Suggestions:**
• Tapez "Aide" ou "Help" pour voir toutes les commandes
• Posez une question sur le droit québécois
• Type "Help" to see all available commands

📧 **Questions?** support@cotechnoe.com`;
}
