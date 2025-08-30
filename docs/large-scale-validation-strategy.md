# Stratégie de Validation et Correction à Grande Échelle

## Vue d'Ensemble

Cette stratégie traite la validation et correction de plus de 5000 documents législatifs dans votre base de connaissances, en utilisant une approche progressive et sécurisée.

## Phases d'Exécution

### Phase 1: Audit Complet (MAINTENANT)
```bash
# Analyser l'ensemble du corpus
./scripts/audit-legal-status.sh playground

# Examiner les résultats
cat audit-results-*.json | jq '.summary'
```

**Objectif**: Comprendre l'ampleur du problème
- Combien de documents ont des erreurs d'enrichissement IA ?
- Quels sont les patterns d'erreur les plus fréquents ?
- Estimation du taux de faux positifs

### Phase 2: Test de Validation Avancée (15 minutes)
```bash
# Exécuter la validation en mode dry-run
./scripts/legal-status-batch-correction.sh playground --dry-run

# Examiner le rapport détaillé
cat validation_report.md
```

**Objectif**: Valider la logique de correction
- Vérifier la précision des règles de détection
- Identifier les cas limites nécessitant une révision manuelle
- Confirmer que les corrections proposées sont appropriées

### Phase 3: Correction Progressive par Lots

#### 3a. Lot de Test (100 documents)
```bash
# Corriger un petit lot avec high confidence
./scripts/legal-status-batch-correction.sh playground --batch-size 100 --force
```

#### 3b. Validation du Lot de Test
```bash
# Vérifier les résultats
./scripts/index-status.sh playground
# Tester la recherche sur les documents corrigés
```

#### 3c. Lots Progressifs
```bash
# Augmenter graduellement la taille des lots
./scripts/legal-status-batch-correction.sh playground --batch-size 500
./scripts/legal-status-batch-correction.sh playground --batch-size 1000
# Continuer jusqu'à l'ensemble complet
```

### Phase 4: Monitoring et Validation Post-Correction

## Outils de Sécurité Intégrés

### 1. Système de Backup Automatique
- Backup complet avant toute modification
- Possibilité de rollback rapide si nécessaire

### 2. Validation par Confiance
- Corrections automatiques: confiance ≥ 70%
- Révision manuelle: confiance 50-70%
- Ignoré: confiance < 50%

### 3. Mode Dry-Run
- Test complet sans modification
- Rapport détaillé des actions proposées
- Validation de la logique avant exécution

### 4. Traitement par Lots
- Contrôle de la charge sur Azure AI Search
- Possibilité d'arrêter et reprendre le processus
- Monitoring en temps réel

## Règles de Validation Implémentées

### Patterns Détectés et Corrigés
1. **Références d'Articles**: `1996, c. 56, a. 32` ≠ abrogation de loi
2. **Modifications Récentes**: Dates post-2000 = probablement en vigueur
3. **Références Multiples**: Plusieurs articles = modifications partielles
4. **Mots-clés Explicites**: "modifié", "remplacé par" = non-abrogation

### Logique de Décision
```
SI document.enrichmentMethod == "Azure OpenAI LLM Analysis" 
   ET document.status == "abrogée"
   ET document.abrogatedBy CONTIENT pattern_article_reference
ALORS
   Corriger vers "en vigueur"
   Supprimer référence d'abrogation incorrecte
```

## Monitoring de Performance

### Métriques Clés
- Nombre de documents traités par minute
- Taux de réussite des corrections
- Performance de l'index Azure AI Search
- Temps de réponse des requêtes

### Points de Contrôle
- Validation après chaque lot de 1000 documents
- Test de recherche sur échantillon représentatif
- Vérification de l'intégrité de l'index

## Plan de Contingence

### En cas de Problème
1. **Arrêt Immédiat**: Ctrl+C pendant l'exécution
2. **Rollback**: Restauration depuis backup automatique
3. **Analyse Post-Mortem**: Logs détaillés disponibles
4. **Correction Manuelle**: Scripts pour cas spécifiques

### Validation Continue
- Script de monitoring quotidien
- Alertes sur nouvelles erreurs d'enrichissement
- Validation périodique de la cohérence

## Commandes de Démarrage Immédiat

```bash
# 1. Lancer l'audit complet
./scripts/audit-legal-status.sh playground

# 2. Analyser les résultats
echo "Vérifier les fichiers audit-results-*.json générés"

# 3. Tester la validation (sans modification)
./scripts/legal-status-batch-correction.sh playground --dry-run

# 4. Examiner le rapport
cat validation_report.md

# 5. Si satisfait, lancer la correction progressive
./scripts/legal-status-batch-correction.sh playground --batch-size 100
```

## Estimation de Temps

- **Audit complet**: 5-10 minutes
- **Validation dry-run**: 10-15 minutes  
- **Correction par lots de 100**: 2-3 minutes par lot
- **Correction complète (5000 docs)**: 2-3 heures en mode sécurisé

## Points de Validation Critiques

✅ **Avant de commencer**:
- Backup de l'index existant
- Test sur environnement playground
- Validation des règles de détection

✅ **Pendant l'exécution**:
- Monitoring des logs Azure AI Search
- Vérification de la performance de l'index
- Validation des corrections appliquées

✅ **Après completion**:
- Test de recherche sur échantillon représentatif
- Vérification de la cohérence des statuts législatifs
- Documentation des résultats pour audit futur
