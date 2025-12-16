# 🎯 Bonnes pratiques - Makefile ChatBotTez Légis Québec

## 🔒 Sécurité et Authentification

### Gestion des credentials
- Toujours utiliser `make auth-logout` avant de changer d'environnement
- Vérifier l'authentification avec `make auth-status` avant les opérations
- Ne jamais committer les fichiers `.env.*.user` (contenus secrets)

### Multi-tenant
- Le Makefile gère automatiquement le tenant ID Cotechnoe
- Pour d'autres tenants, modifier la variable `TENANT_ID` dans le Makefile

## 🏗️ Déploiement

### Ordre recommandé pour nouveaux environnements
1. `make validate-env ENV=<env>` - Validation des fichiers
2. `make auth-setup` - Configuration authentification
3. `make provision ENV=<env>` - Provisioning ressources
4. `make deploy ENV=<env>` - Déploiement application
5. `make publish ENV=<env>` - Publication Teams

### Mises à jour de code
```bash
# Pour changements dans le code source uniquement
make deploy ENV=cotechnoe

# Pour changements dans le manifest Teams
make publish ENV=cotechnoe

# Pour changements dans l'infrastructure
make provision ENV=cotechnoe
make deploy ENV=cotechnoe
```

## 🔧 Développement

### Environnement local
```bash
# Première fois
make local-deploy

# Développement quotidien
make dev-start
```

### Tests
```bash
# Test avec playground Microsoft
make playground-deploy
make dev-playground
```

## 🐛 Dépannage

### Erreurs communes

#### "ENV doit être spécifié"
```bash
# ❌ Incorrect
make provision

# ✅ Correct  
make provision ENV=cotechnoe
```

#### "Fichier introuvable"
```bash
# Vérifier les fichiers d'environnement
ls -la env/
ls -la *.yml

# Recréer si nécessaire
make validate-env ENV=cotechnoe
```

#### Erreurs d'authentification
```bash
# Reset complet
make auth-logout
make auth-setup
```

#### Échec de provisioning
```bash
# Nettoyer et recommencer
make clean-env ENV=cotechnoe
make provision ENV=cotechnoe
```

### Diagnostic étape par étape
1. `make status` - État général
2. `make auth-status` - Authentification
3. `make validate-env ENV=<env>` - Configuration
4. Opération spécifique avec verbosité

## 📊 Monitoring

### Vérifications régulières
```bash
# Status des environnements
make status

# Health check de l'application
make logs ENV=cotechnoe
```

### URLs importantes
- Bot deployed : https://botlegissb01.azurewebsites.net
- Teams Admin : https://aka.ms/teamsfx-mtac
- Azure Portal : https://portal.azure.com

## 🔄 Maintenance

### Mises à jour régulières
```bash
# Dépendances
make install

# Nettoyage
make clean
```

### Archivage
```bash
# Avant modifications majeures
make archive
```

### Remise à zéro
```bash
# En cas de problème majeur
make reset-env ENV=cotechnoe
```

## 🎨 Personnalisation

### Variables modifiables
```bash
# Changer le tenant
make cotechnoe-deploy TENANT_ID=nouveau-tenant-id

# Environnement custom
ENV=mon-env make provision
```

### Extension du Makefile
- Ajouter de nouvelles cibles dans la section appropriée
- Utiliser les couleurs définies pour l'affichage
- Respecter le format des commentaires d'aide (`##`)

## 📈 Performance

### Opérations rapides
- `make deploy` plus rapide que `make full-deploy`
- `make provision` uniquement si changements infrastructure
- Cache npm automatique avec `make install`

### Opérations lourdes
- `make full-deploy` : Complet mais lent
- `make clean-env` : Supprime toutes les ressources
- `make auth-setup` : Authentification complète

---

*💡 Conseil : Toujours commencer par `make help` et `make status` !*
