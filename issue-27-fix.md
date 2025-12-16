## Objectif

Compléter la documentation pour la migration Custom Engine Agent (Phase 6 - Partie 1).

## Tâches

### ADR-003: Architecture Custom Engine Agent
- [ ] Documenter architecture finale
- [ ] Détailler intégration RAG (Azure AI Search + OpenAI)
- [ ] Comparaison Teams AI Library vs. Agents SDK
- [ ] Diagramme architecture
- [ ] Justifications techniques
- [ ] Performance et scalabilité

### README Principal
- [ ] Mettre à jour description projet
- [ ] Documenter nouveau SDK (`@microsoft/agents-hosting`)
- [ ] Instructions setup développement
- [ ] Guide démarrage rapide
- [ ] Section architecture Custom Engine Agent
- [ ] 6 commandes juridiques disponibles
- [ ] Environnements supportés (Playground, Local, DEV, PROD)

### Guide Déploiement Production
- [ ] Créer `docs/guides/deployment/production-deployment.md`
- [ ] Prérequis Azure (subscription, ressources)
- [ ] Nomenclature Resource Group (ADR-021): `rg-bot-legisqc-prd-cae-01`
- [ ] Configuration secrets production
- [ ] Variables d'environnement PROD
- [ ] Procédure déploiement étape par étape
- [ ] Vérification post-déploiement
- [ ] Procédure rollback
- [ ] Monitoring et alertes
- [ ] Troubleshooting courant

### Documentation Complémentaire
- [ ] Mettre à jour `docs/README.md` avec nouveaux ADR
- [ ] Documenter structure projet
- [ ] Guide contribution mis à jour

## ✅ Critères de succès

- ✅ ADR-003 rédigé et validé
- ✅ README clair et complet
- ✅ Guide PROD utilisable par équipe ops
- ✅ Documentation architecture à jour
- ✅ Tous liens fonctionnels

## Contexte

- **Issue parent**: #17 (Phase 6)
- **Prérequis**: Phases 0-5 complètes ✅
- **Bloque**: Issue #28 (Mise en Production)
- **Timeline**: 0.5-1 jour

## Références

- ADR-002: Microsoft 365 Agents Toolkit
- ADR-019: Bonnes pratiques Toolkit
- ADR-021: Nomenclature Resource Groups
- [Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/create-deploy-agents-sdk)
