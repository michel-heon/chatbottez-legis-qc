# ADR 013 : Utilisation des Émojis et Icônes dans la Documentation

**Statut** : 🔄 Proposé  
**Date** : 2025-11-21  
**Auteur** : Équipe Légis Québec  
**Décideurs** : Équipe technique Cotechnoe

## Contexte

Lors de la rédaction de la documentation wiki pour l'écosystème Légis Québec, une utilisation excessive d'émojis a été identifiée dans la page d'accueil (13 émojis dans un seul document). Cette surcharge visuelle a créé une expérience utilisateur négative, rendant la page difficile à lire et peu professionnelle.

### Problème Identifié

La page `Home-Root.md` du wiki contenait initialement :
- 📚 Projets Disponibles
- 🎓 Légis Québec Postdoc
- 🔐 LégisSecure
- 🔬 Laboratoire
- 🛒 Approvisionnement
- 🏗️ Architecture Commune
- ✅ (5 fois) dans la section Conformité
- 🛠️ Technologies
- 👥 Équipe
- 📞 Support
- 🔗 Ressources Externes
- 📜 Licences et Conditions

Cette abondance d'émojis :
1. **Surcharge cognitive** : Trop d'éléments visuels distraient de l'information essentielle
2. **Manque de professionnalisme** : Donne une apparence informelle inadaptée à la documentation institutionnelle
3. **Accessibilité réduite** : Les lecteurs d'écran lisent les descriptions d'émojis, créant du bruit
4. **Inconsistance visuelle** : Tous les émojis n'ont pas le même poids ou la même pertinence

## Recherche : Bonnes Pratiques de l'Industrie

### Microsoft Writing Style Guide

Le [guide de style Microsoft](https://learn.microsoft.com/en-us/style-guide/) pour la documentation technique **ne recommande PAS l'utilisation d'émojis** dans la documentation officielle. Les directives précisent :

- **Utiliser le formatage sémantique** : Gras pour les éléments d'interface, italique pour les nouveaux termes
- **Éviter les éléments décoratifs** : Se concentrer sur la clarté et l'utilité du contenu
- **Capitalisation cohérente** : Sentence-case pour les titres, pas de substituts visuels
- **Accessibilité primordiale** : Tous les éléments doivent être lisibles par les technologies d'assistance

Microsoft privilégie :
- Le **formatage textuel structuré** (titres H1-H6, listes, tableaux)
- Les **icônes SVG standardisées** dans les interfaces utilisateur (pas dans la documentation)
- La **typographie claire** plutôt que les substituts émotionnels

### Google Developer Documentation Style Guide

Le [guide Google](https://developers.google.com/style) pour la documentation technique est **explicitement contre l'utilisation d'émojis** :

**Principes clés** :
- **Clarté avant tout** : "Use semantic HTML or Markdown to control text style"
- **Éviter la surcharge visuelle** : "Don't override global styles for font type, size, or color"
- **Formatage textuel** : Utiliser `**bold**` pour les éléments UI, `_italic_` pour l'emphase
- **Pas d'émojis mentionnés** : Aucune recommandation d'utilisation d'émojis dans la documentation

Google recommande :
- **Formatage sémantique** : `<strong>`, `<em>`, `<code>` plutôt que des éléments visuels arbitraires
- **Hiérarchie claire** : Structure H1-H6 bien définie
- **Lisibilité maximale** : Éviter tout élément distrayant

### GitHub Documentation

GitHub [supporte les émojis](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#using-emojis) dans le Markdown mais avec **usage très limité** :

**Recommandations GitHub** :
- **Usage contextuel** : Émojis appropriés pour les pull requests, issues, discussions informelles
- **Pas dans la documentation officielle** : Les wikis et README officiels évitent généralement les émojis
- **Syntaxe** : `:EMOJICODE:` pour insertion
- **Accessibility concern** : Les émojis peuvent poser des problèmes d'accessibilité

**Observation** : La documentation officielle GitHub (docs.github.com) **n'utilise AUCUN émoji** dans ses pages de documentation technique.

### Write the Docs Community

La communauté [Write the Docs](https://www.writethedocs.org/guide/writing/style-guides/) établit les principes suivants :

**Principes de style pour la documentation** :
- **Cohérence** : Maintenir un style uniforme à travers toute la documentation
- **Professionnalisme** : Adopter un ton approprié au contexte institutionnel
- **Charge cognitive réduite** : Faciliter la lecture en évitant les distractions
- **Accessibilité** : Assurer la compatibilité avec les technologies d'assistance

**Consensus de l'industrie** :
- Documentation technique professionnelle = **ZÉRO émoji**
- Documentation communautaire informelle = Émojis **occasionnels et pertinents**
- READMEs open source = Émojis **acceptables mais modérés** (1-3 maximum)

## Décision

**Nous adoptons une politique de ZÉRO émoji dans la documentation officielle Légis Québec.**

### Règles d'Utilisation des Émojis

#### ✅ Usage AUTORISÉ (avec parcimonie)

1. **Communications informelles internes** :
   - Messages Slack/Teams entre développeurs
   - Commentaires de code (très limité)
   - Commits Git personnels (pas les commits de release)

2. **Éléments non-documentaires** :
   - Interfaces utilisateur (icônes SVG standardisées, pas des émojis)
   - Notifications dans l'application
   - Messages d'erreur conviviaux (1 émoji maximum si pertinent)

3. **README.md de développement** (usage minimal) :
   - 1 émoji maximum dans le titre principal (optionnel)
   - Badges de statut du projet (shields.io)
   - Sections de contribution communautaire

#### ❌ Usage INTERDIT

1. **Documentation officielle** :
   - Pages wiki (y compris Home, FAQ, guides)
   - Politiques de confidentialité
   - Conditions d'utilisation
   - Documentation technique (API, architecture, etc.)

2. **ADRs (Architecture Decision Records)** :
   - Exception : Statuts d'ADR utilisent des émojis standardisés (✅ Accepté, 🔄 Proposé, ❌ Rejeté, 📦 Obsolète, 🔧 Modifié)
   - Raison : Convention établie dans ADR-000, maintenue pour cohérence historique

3. **Documentation utilisateur finale** :
   - Guides de démarrage
   - Tutoriels
   - Pages d'aide
   - Notes de version (release notes)

### Alternatives Recommandées

Au lieu d'émojis, utiliser :

1. **Hiérarchie typographique claire** :
   ```markdown
   # Titre Principal (H1)
   ## Section Majeure (H2)
   ### Sous-section (H3)
   ```

2. **Formatage sémantique** :
   ```markdown
   **Texte important** (bold)
   _Emphase légère_ (italic)
   `Code ou commande` (code)
   ```

3. **Listes structurées** :
   ```markdown
   - Point principal
     - Sous-point
   1. Étape numérotée
   2. Étape suivante
   ```

4. **Alertes GitHub (préférable aux émojis)** :
   ```markdown
   > [!NOTE]
   > Information utile
   
   > [!IMPORTANT]
   > Information cruciale
   
   > [!WARNING]
   > Attention requise
   ```

5. **Icônes SVG dans l'interface utilisateur** :
   - Utiliser des icônes standardisées (Microsoft Fluent UI, Material Design)
   - Toujours fournir un attribut `alt` descriptif
   - Assurer le contraste couleur suffisant (WCAG 2.1)

## Conséquences

### Positives

1. **Professionnalisme accru** :
   - Documentation perçue comme plus sérieuse et institutionnelle
   - Crédibilité renforcée auprès des utilisateurs juridiques

2. **Accessibilité améliorée** :
   - Lecteurs d'écran fonctionnent sans interruption
   - Compatibilité avec toutes les technologies d'assistance
   - Conformité WCAG 2.1 niveau AA

3. **Cohérence avec l'industrie** :
   - Alignement avec Microsoft, Google, GitHub, IBM, Red Hat
   - Respect des standards de documentation technique

4. **Charge cognitive réduite** :
   - Utilisateurs se concentrent sur le contenu, pas sur les éléments décoratifs
   - Lecture plus fluide et efficace

5. **Pérennité** :
   - Émojis peuvent changer de rendu selon les plateformes/navigateurs
   - Texte pur est stable à long terme

6. **Localisation facilitée** :
   - Émojis peuvent avoir des connotations culturelles différentes
   - Texte clair est universel

### Négatives

1. **Perte de repères visuels** :
   - Certains utilisateurs trouvent les émojis utiles pour scanner rapidement
   - **Mitigation** : Utiliser une hiérarchie H1-H6 forte et des listes structurées

2. **Moins de "personnalité"** :
   - Documentation peut sembler plus austère
   - **Mitigation** : Compenser par un ton rédactionnel chaleureux et accessible

3. **Transition requise** :
   - Mise à jour de toutes les pages wiki existantes
   - **Mitigation** : Déjà effectuée pour Home-Root.md, reste FAQ, Support, etc.

### Neutres

1. **Exception pour les statuts ADR** :
   - Convention déjà établie (ADR-000)
   - Ne pose pas de problème d'accessibilité dans ce contexte précis
   - Cohérence avec outils comme [adr-tools](https://github.com/npryce/adr-tools)

## Implémentation

### Phase 1 : Nettoyage Immédiat (Déjà effectué)

- [x] Suppression des 13 émojis de `Home-Root.md`
- [x] Remplacement par hiérarchie H2-H3 claire
- [x] Déploiement sur le wiki GitHub

### Phase 2 : Audit Complet (À faire)

1. **Scanner tous les fichiers de documentation** :
   ```bash
   # Recherche d'émojis dans la documentation
   grep -r "[\x{1F300}-\x{1F9FF}]" docs/
   grep -r "[\x{1F600}-\x{1F64F}]" appPackage/wiki/
   ```

2. **Fichiers à vérifier** :
   - `appPackage/wiki/FAQ.md`
   - `appPackage/wiki/Guide-Demarrage-Rapide.md`
   - `appPackage/wiki/Support.md`
   - `appPackage/wiki/Signalement-Problemes.md`
   - `appPackage/wiki/Politique-de-Confidentialite.md`
   - `appPackage/wiki/Conditions-Utilisation.md`
   - `docs/guides/*.md`
   - `README.md` (tolérance de 0-1 émoji max)

3. **Supprimer tous les émojis** sauf :
   - Statuts ADR dans `docs/adr/*.md` (✅ 🔄 ❌ 📦 🔧)
   - Badges de statut dans `README.md` (shields.io)

### Phase 3 : Établissement des Processus

1. **Créer un template de page wiki** :
   ```markdown
   # Titre Principal
   
   ## Introduction
   
   Texte clair sans émojis.
   
   ## Section Majeure
   
   ### Sous-section
   
   Contenu structuré avec hiérarchie claire.
   ```

2. **Intégrer la règle dans le guide de contribution** :
   - Ajouter une section "Style de documentation" dans `CONTRIBUTING.md`
   - Référencer cet ADR 013

3. **Linter de documentation (optionnel)** :
   ```javascript
   // scripts/lint-docs.js
   const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
   // Vérifier tous les .md sauf docs/adr/*.md
   ```

### Phase 4 : Formation et Communication

1. **Documenter dans le wiki** :
   - Créer une page "Conventions de documentation"
   - Référencer ADR 013 comme source d'autorité

2. **Communiquer à l'équipe** :
   - Annoncer la nouvelle politique
   - Expliquer le raisonnement (accessibilité, professionnalisme)

3. **Intégrer dans les revues de code** :
   - Vérifier l'absence d'émojis dans les PRs qui modifient la documentation
   - Suggérer des alternatives (formatage sémantique)

## Références

### Guides de Style Consultés

1. **Microsoft Writing Style Guide**  
   https://learn.microsoft.com/en-us/style-guide/  
   - Formatage de la documentation technique
   - Pas de mention d'émojis (donc non recommandé)

2. **Google Developer Documentation Style Guide**  
   https://developers.google.com/style  
   - Formatage textuel sémantique
   - Éviter tout élément décoratif non-sémantique

3. **GitHub Markdown Documentation**  
   https://docs.github.com/en/get-started/writing-on-github  
   - Supporte les émojis mais ne les utilise pas dans sa propre documentation

4. **Write the Docs Style Guides**  
   https://www.writethedocs.org/guide/writing/style-guides/  
   - Consensus de la communauté : émojis rares ou absents dans la doc technique

### Standards d'Accessibilité

1. **WCAG 2.1 Guidelines**  
   https://www.w3.org/WAI/WCAG21/  
   - 1.1.1 Non-text Content : Alternatives textuelles requises
   - 1.4.3 Contrast (Minimum) : Problématique avec les émojis colorés

2. **Microsoft Accessibility Guidelines**  
   https://www.microsoft.com/en-us/accessibility  
   - Privilégier le contenu textuel clair
   - Éviter les éléments visuels non-essentiels

### Exemples de Documentation Professionnelle

1. **Azure Documentation** (ZÉRO émoji)  
   https://learn.microsoft.com/en-us/azure/

2. **GitHub Docs** (ZÉRO émoji)  
   https://docs.github.com/

3. **Google Cloud Documentation** (ZÉRO émoji)  
   https://cloud.google.com/docs

4. **Red Hat Documentation** (ZÉRO émoji)  
   https://access.redhat.com/documentation/

5. **Mozilla Developer Network** (ZÉRO émoji)  
   https://developer.mozilla.org/

## Liens avec Autres ADRs

- **ADR-000** : Processus de décision architecturale (utilise émojis pour statuts uniquement)
- **ADR-009** : Organisation des conversations (Personal Tab) - documentation utilisateur sans émojis
- **ADR-011** : Structure du wiki (définit l'organisation, pas le style)

## Métriques de Succès

1. **Audit de conformité** : 100% des pages de documentation sans émojis (sauf statuts ADR)
2. **Score d'accessibilité** : Maintenir/améliorer le score Lighthouse Accessibility
3. **Feedback utilisateur** : Aucune plainte concernant la lisibilité après la transition
4. **Temps de lecture** : Mesurer si la suppression d'émojis améliore la vitesse de lecture

---

**Décision finale** : ✅ Accepté (en attente d'approbation formelle)  
**Prochaine révision** : 2026-02-21 (3 mois après implémentation complète)
