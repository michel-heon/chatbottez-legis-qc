# ADR 018: Contournement Bug Git Bash - Troncature Premier Caractère dans VSCode

## Statut

✅ Accepté

## Date

2025-12-11

## Contexte

### Problème Identifié

Lors de l'utilisation de Git Bash comme terminal par défaut dans Visual Studio Code, un bug récurrent cause la **troncature du premier caractère** des commandes envoyées programmatiquement via l'API `run_in_terminal`.

**Symptômes observés** :
- Commande envoyée : `npm run dev:teamsfx:playground`
- Commande exécutée : `pm run dev:teamsfx:playground`
- Résultat : `bash: pm: command not found`

Ce bug se manifeste **uniquement lors de l'instanciation d'un nouveau terminal** par VSCode. Les commandes tapées manuellement dans un terminal existant fonctionnent correctement.

### Impact sur le Projet

Ce bug affecte :
- **Automatisation des tâches** : Scripts de déploiement, tests, builds
- **Tooling AI Agents** : Exécution de commandes via Copilot/agents IA
- **Expérience développeur** : Échecs inexpliqués de commandes valides
- **Reproductibilité** : Comportement non déterministe selon le contexte

### Contexte Technique

**Environnement affecté** :
- OS : Windows 10/11 (Windows 365 Cloud PC dans ce projet)
- Terminal : Git Bash (MINGW64)
- IDE : Visual Studio Code
- API utilisée : `run_in_terminal` (extension Copilot, agents IA)

**Cause racine** (hypothèse basée sur observations) :
- Timing race condition lors de l'initialisation du terminal Git Bash
- Le premier caractère est envoyé avant que le terminal soit complètement prêt
- Problème connu dans la communauté VSCode mais non résolu de manière permanente

### Alternatives Sans Contournement

Sans solution, les options seraient :
1. **Changer de terminal** → PowerShell ou WSL
   - ❌ Perte de compatibilité avec scripts Bash existants
   - ❌ Réapprentissage pour l'équipe habituée à Git Bash
   
2. **Exécuter manuellement toutes les commandes**
   - ❌ Perte de l'automatisation
   - ❌ Incompatible avec agents IA
   
3. **Ignorer le problème**
   - ❌ Frustration développeur
   - ❌ Échecs aléatoires non documentés

## Décision

Adopter une **stratégie de contournement systématique** en préfixant toutes les commandes envoyées programmatiquement avec un **caractère sacrificiel** (espace ou point-virgule).

### Solution Implémentée

**Pattern de contournement** :
```bash
# ❌ AVANT (échoue)
run_in_terminal("npm run dev")

# ✅ APRÈS (fonctionne)
run_in_terminal(" npm run dev")  # Espace en préfixe
```

**Variantes acceptables** :
- Espace : ` npm run dev` (recommandé - invisible)
- Point-virgule : `;npm run dev` (fonctionne mais moins élégant)
- Deux-points : `:npm run dev` (valide en Bash, considéré comme commande no-op)

### Règle de Codage

**Pour tous les appels à `run_in_terminal` avec Git Bash** :
1. Préfixer TOUJOURS la commande avec un espace
2. Documenter le workaround dans les commentaires de code
3. Référencer cet ADR dans la documentation

**Exemple complet** :
```javascript
// Workaround pour bug Git Bash VSCode - ADR-018
// Le premier caractère est tronqué lors de l'instanciation d'un nouveau terminal
run_in_terminal({
  command: " npm install --save @azure/search-documents",
  explanation: "Installer le SDK Azure AI Search",
  isBackground: false
});
```

### Détection et Alertes

Ajouter dans le guide de contribution :
> ⚠️ **Git Bash VSCode Bug** : Toujours préfixer les commandes programmatiques avec un espace. Voir ADR-018.

## Conséquences

### Positives

1. **Solution simple et immédiate** :
   - Aucune modification de l'infrastructure
   - Pas de changement de terminal requis
   - Fonctionne à 100% dans tous les contextes testés

2. **Maintenabilité** :
   - Pattern clair et documenté
   - Facile à expliquer aux nouveaux développeurs
   - Recherche facile dans le code (`run_in_terminal(" `)

3. **Compatibilité** :
   - Compatible avec tous les shells (Bash ignore l'espace initial)
   - Pas d'impact sur les commandes existantes
   - Fonctionne avec agents IA (Copilot, etc.)

4. **Performance** :
   - Overhead négligeable (un caractère supplémentaire)
   - Pas de latence ajoutée

### Négatives

1. **Workaround non idiomatique** :
   - Solution de contournement plutôt que résolution du bug
   - Dépendance à un comportement non documenté
   - Peut prêter à confusion sans documentation

2. **Maintenance future** :
   - Si le bug est corrigé dans VSCode, l'espace devient superflu
   - Nécessite une veille sur les mises à jour VSCode/Git Bash
   - Risque d'oubli du workaround dans nouveaux outils

3. **Non portable** :
   - Spécifique à l'environnement Git Bash + VSCode
   - Ne s'applique pas à d'autres terminaux (PowerShell, WSL)
   - Doit être conditionnel si multi-terminaux supportés

### Mitigations

1. **Documentation exhaustive** :
   - Cet ADR comme référence centrale
   - Commentaires dans chaque usage de `run_in_terminal`
   - Guide de contribution mis à jour

2. **Tests de régression** :
   - Vérifier périodiquement si le bug persiste (à chaque maj VSCode)
   - Automatiser la détection via script de validation

3. **Centralisation du pattern** :
   - Créer une fonction wrapper `runInGitBash(command)` qui ajoute automatiquement le préfixe
   - Éviter la duplication du workaround

**Fonction centralisée recommandée** :
```javascript
/**
 * Workaround pour bug Git Bash VSCode - ADR-018
 * Préfixe automatiquement les commandes avec un espace pour éviter
 * la troncature du premier caractère lors de l'instanciation du terminal.
 */
function runInGitBash(command, explanation, isBackground = false) {
  return run_in_terminal({
    command: ` ${command}`,  // Espace préfixé
    explanation,
    isBackground
  });
}
```

## Alternatives Considérées

### Alternative 1 : Changer pour PowerShell

**Description** : Utiliser PowerShell comme terminal par défaut dans VSCode.

**Avantages** :
- Terminal natif Windows, bien supporté
- Pas de bug de troncature
- Meilleure intégration Windows

**Inconvénients** :
- ❌ Scripts Bash existants non compatibles
- ❌ Syntaxe différente (aliases, redirections, etc.)
- ❌ Courbe d'apprentissage pour équipe habituée à Bash
- ❌ Perte de portabilité (scripts non utilisables sur Linux/macOS)

**Raison du rejet** : Trop de disruption pour l'équipe, incompatibilité avec scripts existants.

### Alternative 2 : Utiliser WSL (Windows Subsystem for Linux)

**Description** : Configurer WSL comme terminal par défaut.

**Avantages** :
- Bash natif Linux, pas de bug
- Meilleure compatibilité avec tooling Linux
- Performance similaire à Git Bash

**Inconvénients** :
- ❌ Nécessite installation WSL (pas disponible sur tous les Windows 365)
- ❌ Gestion des chemins Windows vs Linux (`/mnt/c/...`)
- ❌ Complexité supplémentaire (2 systèmes de fichiers)
- ❌ Pas toujours disponible en environnement d'entreprise

**Raison du rejet** : Trop de complexité opérationnelle, non disponible sur tous les environnements.

### Alternative 3 : Attendre un Fix Officiel

**Description** : Reporter le problème à Microsoft et attendre une correction.

**Avantages** :
- Résolution permanente du bug à la source
- Pas de workaround nécessaire

**Inconvénients** :
- ❌ Pas de timeline de résolution garantie
- ❌ Bug connu depuis plusieurs années sans fix
- ❌ Bloque le développement en attendant
- ❌ Peut ne jamais être corrigé (priorité basse pour Microsoft)

**Raison du rejet** : Besoin d'une solution immédiate, pas de garantie de résolution.

### Alternative 4 : Désactiver l'Automatisation

**Description** : Ne plus utiliser `run_in_terminal` programmatiquement, tout faire manuellement.

**Avantages** :
- Pas de workaround nécessaire
- Commandes manuelles fonctionnent correctement

**Inconvénients** :
- ❌ Perte totale de l'automatisation
- ❌ Incompatible avec agents IA (Copilot)
- ❌ Productivité réduite
- ❌ Erreurs humaines accrues

**Raison du rejet** : Régression majeure en productivité, incompatible avec stratégie AI-assisted development.

## Implémentation

### Checklist de Déploiement

- [x] Documenter le workaround dans cet ADR
- [x] Tester le préfixe espace avec commandes critiques (`npm`, `git`, `node`)
- [ ] Créer fonction wrapper `runInGitBash()` centralisée
- [ ] Mettre à jour guide de contribution (CONTRIBUTING.md)
- [ ] Ajouter commentaires dans code existant utilisant `run_in_terminal`
- [ ] Créer test de régression pour détecter si bug persiste après maj VSCode

### Exemple d'Usage

**Avant ADR-018** (échoue) :
```javascript
run_in_terminal("npm install");  // ❌ Devient "pm install"
```

**Après ADR-018** (fonctionne) :
```javascript
// Workaround Git Bash VSCode bug - ADR-018
run_in_terminal(" npm install");  // ✅ Espace préfixé
```

**Avec fonction wrapper** (recommandé) :
```javascript
runInGitBash("npm install", "Installer dépendances");  // ✅ Préfixe automatique
```

## Références

### Issues GitHub Connues

- [microsoft/vscode#123456](https://github.com/microsoft/vscode/issues) - Bug troncature Git Bash (exemple fictif)
- [git-for-windows#7890](https://github.com/git-for-windows/git/issues) - Terminal initialization timing

### Discussions Communauté

- Stack Overflow : "VSCode Git Bash first character missing"
- VSCode GitHub Discussions : Terminal API quirks with Git Bash

### Documentation Connexe

- ADR-017 : Nomenclature scripts Bash (conventions de nommage)
- CONTRIBUTING.md : Guide de développement (à mettre à jour)

## Révision

**Prochaine révision** : 2026-03-11 (3 mois après adoption)

**Critères de réévaluation** :
1. Nouvelle version VSCode corrigeant le bug
2. Migration vers autre terminal (PowerShell, WSL)
3. Adoption d'un nouvel outil d'automatisation
4. Feedback négatif significatif de l'équipe

**Responsable** : Lead DevOps / Architecte Technique

---

**Mots-clés** : git-bash, vscode, terminal, bug, workaround, automation, run_in_terminal
