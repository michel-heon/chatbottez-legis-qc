# 🚀 Makefile - ChatBotTez Légis QC

Ce Makefile simplifie la gestion du provisioning, déploiement et maintenance du bot Teams.

## ⚡ Commandes rapides

```bash
# Déploiement complet sur Cotechnoe
make cotechnoe-deploy

# Vérifier le statut
make status

# Aide complète
make help

# Exemples détaillés
make examples
```

## 📋 Environnements supportés

- **local** : Développement local avec tunnel
- **playground** : Environnement de test Microsoft 365
- **cotechnoe** : Environnement de production Cotechnoe

## 🔧 Workflows principaux

### Premier déploiement
```bash
make cotechnoe-deploy  # Tout-en-un
```

### Mise à jour du code
```bash
make deploy ENV=cotechnoe
```

### Développement
```bash
make local-deploy
make dev-start
```

### Diagnostic
```bash
make status
make auth-status
make logs ENV=cotechnoe
```

## 📚 Documentation complète

Voir [docs/MAKEFILE.md](./docs/MAKEFILE.md) pour la documentation détaillée.

## 🆘 Support

En cas de problème :
1. `make status` - Vérifier les environnements
2. `make auth-status` - Vérifier l'authentification  
3. `make auth-setup` - Reconfigurer l'auth si nécessaire
