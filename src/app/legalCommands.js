/**
 * Legal Commands Module
 * Specialized handlers for 6 custom legal commands
 * Per ADR-016: All user-facing messages are emoji-free
 */

/**
 * Handler for "Droits au travail" command
 * Optimizes RAG search and response for employment law questions
 * @returns {Object} Command configuration with enhanced instructions
 */
export function handleDroitsTravail() {
  return {
    name: 'droits_travail',
    enhancedInstructions: `
**CONTEXTE SPÉCIALISÉ: Droits au travail au Québec**

L'utilisateur cherche des informations sur les droits des travailleurs. Concentrez-vous sur:

1. **Lois et règlements prioritaires:**
   - Loi sur les normes du travail (L.R.Q., c. N-1.1)
   - Code du travail du Québec (L.R.Q., c. C-27)
   - Loi sur la santé et la sécurité du travail (L.R.Q., c. S-2.1)
   - Charte des droits et libertés de la personne (articles sur le travail)

2. **Thèmes à couvrir:**
   - Conditions minimales de travail (salaire minimum, heures, congés)
   - Santé et sécurité au travail
   - Discrimination et harcèlement
   - Congédiement et recours
   - Syndicalisation et négociation collective

3. **Procédures pratiques:**
   - Comment porter plainte à la CNESST
   - Délais de recours
   - Documents requis
   - Organismes de protection (CNESST, Commission des droits de la personne)

4. **Questions de suivi pertinentes:**
   - "Quels sont les délais pour contester un congédiement?"
   - "Comment calculer les heures supplémentaires selon la loi?"
   - "Quels sont mes recours en cas de harcèlement au travail?"
`,
    welcomeMessage: `**Droits au travail - Légis Québec**

Je vais vous aider à comprendre vos droits en tant que travailleur au Québec.

DOMAINES COUVERTS:
- Normes du travail (salaire, heures, congés)
- Santé et sécurité
- Discrimination et harcèlement
- Congédiement et recours
- Syndicalisation

Posez votre question ou choisissez un sujet...`
  };
}

/**
 * Handler for "Protection du consommateur" command
 * Optimizes RAG search for consumer protection law
 * @returns {Object} Command configuration with enhanced instructions
 */
export function handleProtectionConsommateur() {
  return {
    name: 'protection_consommateur',
    enhancedInstructions: `
**CONTEXTE SPÉCIALISÉ: Protection du consommateur au Québec**

L'utilisateur cherche des informations sur les droits des consommateurs. Concentrez-vous sur:

1. **Lois et règlements prioritaires:**
   - Loi sur la protection du consommateur (L.R.Q., c. P-40.1)
   - Règlement d'application de la Loi sur la protection du consommateur
   - Code civil du Québec (articles sur les contrats de consommation)

2. **Thèmes à couvrir:**
   - Garanties légales et garanties de qualité
   - Contrats de consommation (vente, crédit, réparation)
   - Pratiques de commerce interdites
   - Annulation de contrat et délais de résiliation
   - Recours en cas de problème

3. **Procédures pratiques:**
   - Comment porter plainte à l'Office de la protection du consommateur (OPC)
   - Rédiger une mise en demeure
   - Recours devant les tribunaux
   - Médiation et arbitrage

4. **Questions de suivi pertinentes:**
   - "Quel est le délai pour annuler un contrat signé à domicile?"
   - "Comment réclamer en vertu de la garantie légale?"
   - "Quelles pratiques commerciales sont interdites?"
`,
    welcomeMessage: `**Protection du consommateur - Légis Québec**

Je vais vous aider à comprendre vos droits en tant que consommateur au Québec.

DOMAINES COUVERTS:
- Garanties légales
- Contrats de consommation
- Pratiques commerciales interdites
- Annulation et résiliation
- Recours et plaintes

Posez votre question ou choisissez un sujet...`
  };
}

/**
 * Handler for "Protéger mes données personnelles" command
 * Optimizes RAG search for privacy and data protection law
 * @returns {Object} Command configuration with enhanced instructions
 */
export function handleDonneesPersonnelles() {
  return {
    name: 'donnees_personnelles',
    enhancedInstructions: `
**CONTEXTE SPÉCIALISÉ: Protection des données personnelles au Québec**

L'utilisateur cherche des informations sur la protection de la vie privée et des données personnelles. Concentrez-vous sur:

1. **Lois et règlements prioritaires:**
   - Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25, L.R.Q., c. P-39.1)
   - Loi sur l'accès aux documents des organismes publics (L.R.Q., c. A-2.1)
   - Charte des droits et libertés de la personne (article 5 - vie privée)
   - Code civil du Québec (articles sur le respect de la vie privée)

2. **Thèmes à couvrir:**
   - Collecte, utilisation et communication de renseignements personnels
   - Consentement et retrait du consentement
   - Droit d'accès et de rectification
   - Sécurité des données et incidents de confidentialité
   - Obligations des entreprises (évaluation des facteurs relatifs à la vie privée)

3. **Procédures pratiques:**
   - Comment exercer son droit d'accès
   - Porter plainte à la Commission d'accès à l'information (CAI)
   - Retirer son consentement
   - Signaler un incident de confidentialité

4. **Questions de suivi pertinentes:**
   - "Comment retirer mon consentement à l'utilisation de mes données?"
   - "Quelles sont les obligations des entreprises en cas de fuite de données?"
   - "Puis-je demander la suppression de mes informations personnelles?"
`,
    welcomeMessage: `**Protection des données personnelles - Légis Québec**

Je vais vous aider à comprendre vos droits en matière de vie privée et protection des données au Québec.

DOMAINES COUVERTS:
- Collecte et utilisation des données
- Consentement
- Droit d'accès et rectification
- Sécurité des données
- Incidents de confidentialité

Posez votre question ou choisissez un sujet...`
  };
}

/**
 * Handler for "Rédiger une mise en demeure" command
 * Provides guidance on writing formal demand letters
 * @returns {Object} Command configuration with enhanced instructions
 */
export function handleMiseEnDemeure() {
  return {
    name: 'mise_en_demeure',
    enhancedInstructions: `
**CONTEXTE SPÉCIALISÉ: Rédaction d'une mise en demeure**

L'utilisateur souhaite rédiger une mise en demeure. Fournissez des informations complètes sur:

1. **Cadre juridique:**
   - Code civil du Québec (articles sur la mise en demeure et la responsabilité contractuelle)
   - Loi sur la protection du consommateur (contexte consommation)
   - Normes du travail (contexte emploi)

2. **Éléments essentiels d'une mise en demeure:**
   - En-tête (expéditeur, destinataire, date)
   - Objet de la mise en demeure
   - Description détaillée des faits
   - Fondements juridiques (lois et articles applicables)
   - Demande précise (réparation, paiement, action à poser)
   - Délai raisonnable pour agir (généralement 10-15 jours)
   - Conséquences en cas de non-respect
   - Signature

3. **Conseils pratiques:**
   - Utiliser un ton ferme mais professionnel
   - Conserver une copie et preuve d'envoi (recommandé, accusé de réception)
   - Documenter tous les faits avec dates précises
   - Joindre copies de documents pertinents

4. **Exemple de structure:**
   - Introduction: "La présente constitue une mise en demeure formelle..."
   - Faits: "Le [date], vous avez..."
   - Droit: "Selon l'article X de la Loi..."
   - Demande: "Par conséquent, je vous mets en demeure de..."
   - Délai: "Vous disposez d'un délai de X jours..."
   - Conclusion: "À défaut, je me verrai dans l'obligation de..."

5. **Questions de suivi pertinentes:**
   - "Quel délai accorder dans une mise en demeure?"
   - "Comment envoyer une mise en demeure (recommandé, huissier)?"
   - "Que faire si la mise en demeure est ignorée?"

IMPORTANT: Précisez que pour des situations complexes, il est recommandé de consulter un avocat.
`,
    welcomeMessage: `**Rédiger une mise en demeure - Légis Québec**

Je vais vous guider pour rédiger une mise en demeure conforme au droit québécois.

ÉLÉMENTS COUVERTS:
- Structure et contenu obligatoire
- Fondements juridiques
- Délais et modalités d'envoi
- Conséquences et suivi

Décrivez votre situation pour obtenir des conseils spécifiques...

AVERTISSEMENT: Pour les cas complexes ou importants, consultez un avocat.`
  };
}

/**
 * Handler for "Contester une décision" command
 * Provides guidance on contesting administrative or judicial decisions
 * @returns {Object} Command configuration with enhanced instructions
 */
export function handleContesterDecision() {
  return {
    name: 'contester_decision',
    enhancedInstructions: `
**CONTEXTE SPÉCIALISÉ: Contester une décision administrative ou judiciaire**

L'utilisateur souhaite contester une décision. Fournissez des informations détaillées sur:

1. **Types de décisions contestables:**
   - Décisions administratives (gouvernementales, municipales)
   - Décisions d'organismes (CNESST, TAQ, Régie du logement, CAI)
   - Décisions judiciaires (révision, appel)
   - Décisions de tribunaux administratifs

2. **Procédures de contestation:**
   - Révision administrative (demande de réexamen)
   - Appel devant tribunal administratif (TAQ, etc.)
   - Contrôle judiciaire (Cour supérieure)
   - Appel en Cour d'appel

3. **Délais critiques:**
   - Délais de contestation (généralement 30 jours, varie selon le tribunal)
   - Délais de prescription
   - Importance du respect des délais (délais de rigueur)

4. **Éléments requis:**
   - Formulaires spécifiques selon le tribunal
   - Motifs de contestation détaillés
   - Preuve et documents justificatifs
   - Frais de dépôt (le cas échéant)

5. **Organismes et tribunaux pertinents:**
   - Tribunal administratif du Québec (TAQ)
   - Commission d'accès à l'information (CAI)
   - Tribunal administratif du travail (TAT)
   - Régie du logement
   - Tribunaux de droit commun (Cour du Québec, Cour supérieure)

6. **Questions de suivi pertinentes:**
   - "Quel est le délai pour contester une décision de la CNESST?"
   - "Comment déposer un appel au Tribunal administratif du Québec?"
   - "Puis-je demander une révision de la décision au même organisme?"
   - "Ai-je besoin d'un avocat pour contester?"

IMPORTANT: Insistez sur l'importance de respecter les délais et de consulter un avocat pour les cas complexes.
`,
    welcomeMessage: `**Contester une décision - Légis Québec**

Je vais vous aider à comprendre les procédures pour contester une décision administrative ou judiciaire au Québec.

DOMAINES COUVERTS:
- Types de recours (révision, appel, contrôle judiciaire)
- Délais et procédures
- Tribunaux compétents
- Documents requis

Décrivez la décision que vous souhaitez contester...

IMPORTANT: Les délais de contestation sont souvent très courts. Consultez un avocat rapidement.`
  };
}

/**
 * Handler for "Comment déposer une plainte" command
 * Provides guidance on filing complaints with various Quebec agencies
 * @returns {Object} Command configuration with enhanced instructions
 */
export function handleDeposerPlainte() {
  return {
    name: 'deposer_plainte',
    enhancedInstructions: `
**CONTEXTE SPÉCIALISÉ: Déposer une plainte auprès d'organismes québécois**

L'utilisateur souhaite déposer une plainte. Fournissez des informations complètes sur:

1. **Organismes de plainte selon le domaine:**

   **Travail:**
   - CNESST (Commission des normes, de l'équité, de la santé et de la sécurité du travail)
   - Commission des droits de la personne et des droits de la jeunesse
   - Tribunal administratif du travail

   **Consommation:**
   - Office de la protection du consommateur (OPC)
   - Autorité des marchés financiers (AMF)
   
   **Données personnelles:**
   - Commission d'accès à l'information (CAI)
   
   **Logement:**
   - Tribunal administratif du logement (TAL, anciennement Régie du logement)
   
   **Discrimination:**
   - Commission des droits de la personne et des droits de la jeunesse
   
   **Services gouvernementaux:**
   - Protecteur du citoyen

2. **Procédure générale de plainte:**
   - Identifier l'organisme compétent
   - Vérifier les délais de plainte
   - Rassembler les documents et preuves
   - Remplir le formulaire de plainte (en ligne ou papier)
   - Soumettre la plainte
   - Conserver une copie et un numéro de référence
   - Suivre l'évolution de la plainte

3. **Documents généralement requis:**
   - Description détaillée des faits avec dates
   - Noms et coordonnées des parties
   - Copies de contrats, factures, correspondances
   - Photos ou documents justificatifs
   - Témoignages si applicable

4. **Délais de plainte courants:**
   - CNESST (congédiement): 45 jours
   - Commission des droits de la personne: 2 ans (discrimination)
   - OPC: variable selon le type de plainte
   - CAI: 3 ans (accès à l'information)

5. **Processus après le dépôt:**
   - Enquête ou examen de la plainte
   - Médiation (si applicable)
   - Audition ou décision
   - Recours possibles en cas de rejet

6. **Questions de suivi pertinentes:**
   - "Où déposer une plainte pour congédiement injuste?"
   - "Quel est le délai pour porter plainte pour discrimination?"
   - "Comment suivre l'évolution de ma plainte à la CNESST?"
   - "Que faire si ma plainte est rejetée?"

CONSEILS PRATIQUES:
- Agir rapidement (les délais sont souvent courts et de rigueur)
- Documenter tous les échanges et événements
- Conserver tous les documents originaux
- Ne pas hésiter à demander de l'aide (centres communautaires, aide juridique)
`,
    welcomeMessage: `**Déposer une plainte - Légis Québec**

Je vais vous aider à comprendre comment déposer une plainte auprès des organismes québécois compétents.

DOMAINES COUVERTS:
- Identifier l'organisme approprié
- Procédures de dépôt
- Délais et documents requis
- Suivi de la plainte

Décrivez le type de plainte que vous souhaitez déposer...

IMPORTANT: Respectez les délais de plainte. Ils sont souvent courts et stricts.`
  };
}

/**
 * Detect if a message matches one of the legal commands
 * @param {string} text - User message
 * @returns {Object|null} Matched command or null
 */
export function detectLegalCommand(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const lowerText = text.toLowerCase().trim();

  // Pattern matching for each legal command
  const commandPatterns = [
    {
      patterns: [
        /\b(mes )?droits? (au |de )travail/i,
        /\b(normes? du travail|emploi|employeur|salaire|cong[eé]diement)/i,
        /\bcnesst\b/i
      ],
      handler: handleDroitsTravail
    },
    {
      patterns: [
        /\bprotection du consommateur/i,
        /\bdroits? (du |des )?consommateur/i,
        /\b(garantie l[eé]gale|contrat de consommation|opc)\b/i,
        /\boffice de la protection/i
      ],
      handler: handleProtectionConsommateur
    },
    {
      patterns: [
        /\b(prot[eé]ger|protection) (mes |de(s)? )donn[eé]es personnelles/i,
        /\bvie priv[eé]e/i,
        /\b(renseignements personnels|loi 25|confidentialit[eé])/i,
        /\b(cai|commission d'acc[eè]s)/i
      ],
      handler: handleDonneesPersonnelles
    },
    {
      patterns: [
        /\br[eé]diger (une )?mise en demeure/i,
        /\bmise en demeure/i,
        /\blettre de mise en demeure/i,
        /\bcomment [eé]crire une mise en demeure/i
      ],
      handler: handleMiseEnDemeure
    },
    {
      patterns: [
        /\bcontester (une )?d[eé]cision/i,
        /\bappel (d'une |de la )?d[eé]cision/i,
        /\br[eé]vision (d'une |de la )?d[eé]cision/i,
        /\bcontr[oô]le judiciaire/i
      ],
      handler: handleContesterDecision
    },
    {
      patterns: [
        /\b(d[eé]poser|porter|faire) (une )?plainte/i,
        /\bcomment porter plainte/i,
        /\bplainte (aupr[eè]s|[aà]|contre)/i,
        /\bformulaire de plainte/i
      ],
      handler: handleDeposerPlainte
    }
  ];

  // Check each command pattern
  for (const command of commandPatterns) {
    for (const pattern of command.patterns) {
      if (pattern.test(lowerText)) {
        return command.handler();
      }
    }
  }

  return null;
}
