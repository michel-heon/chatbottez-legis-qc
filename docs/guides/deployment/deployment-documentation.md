# Guide de déploiement de la documentation - Légis Québec

**Auteur**: GitHub Copilot  
**Date**: 14 novembre 2024  
**Version**: 1.0

---

## 📋 Vue d'ensemble

Ce guide explique comment gérer et déployer la documentation web pour l'application **Légis Québec**, incluant les documents légaux et d'aide accessibles depuis Microsoft Teams.

---

## 🏗️ Architecture de la documentation

### Repositories Git

#### 1. **Repository principal** : `chatbottez-legis-qc`
- **Contenu** : Application Teams complète
- **Documentation** : Fichiers HTML de redirection dans `appPackage/`
- **Déploiement** : Via Makefile vers serveur web

#### 2. **Repository documentation** : `chatbottez-legis-quebec`
- **URL** : https://github.com/Cotechnoe/chatbottez-legis-quebec
- **Contenu** : Documents Markdown sources
- **Fichiers** :
  - `privacy.md` - Politique de confidentialité (48 lignes)
  - `terms.md` - Conditions d'utilisation (49 lignes)
  - `get-started.md` - Guide de démarrage rapide
  - `help.md` - Documentation d'aide complète
  - `README.md` - Introduction du repository

### Structure du serveur web

```
/var/www/html/
└── legisqc/
    ├── .htaccess              # URL rewriting
    ├── privacy.html           # Redirect → GitHub privacy.md
    ├── terms.html             # Redirect → GitHub terms.md
    ├── get-started.html       # Redirect → GitHub get-started.md
    └── help.html              # Redirect → GitHub help.md
```

### URLs publiques

| Document | URL publique | Destination GitHub |
|----------|-------------|-------------------|
| Confidentialité | `https://cotechnoe.com/legisqc/privacy` | `chatbottez-legis-quebec/privacy.md` |
| Conditions | `https://cotechnoe.com/legisqc/terms` | `chatbottez-legis-quebec/terms.md` |
| Démarrage | `https://cotechnoe.com/legisqc/get-started` | `chatbottez-legis-quebec/get-started.md` |
| Aide | `https://cotechnoe.com/legisqc/help` | `chatbottez-legis-quebec/help.md` |

---

## 📝 Workflow de mise à jour

### Étape 1 : Modifier les documents Markdown

```bash
# Cloner le repository de documentation (si nécessaire)
cd /media/psf/Developpement/00-GIT/
git clone git@github.com:Cotechnoe/chatbottez-legis-quebec.git

# Naviguer vers le repository
cd chatbottez-legis-quebec

# Modifier les fichiers .md
nano privacy.md
nano terms.md
nano get-started.md
nano help.md

# Committer et pusher
git add .
git commit -m "Update documentation"
git push
```

### Étape 2 : Déployer sur le serveur (si HTML modifié)

```bash
# Naviguer vers le projet principal
cd /media/psf/Developpement/00-GIT/chatbottez-legis-qc-app-gen/appPackage

# Exécuter le déploiement
make deploy-docs
```

**Note** : Le déploiement n'est nécessaire que si les fichiers HTML de redirection sont modifiés. Les modifications des fichiers `.md` sur GitHub sont automatiquement visibles via les URLs de redirection.

---

## 🛠️ Créer un nouveau document

### 1. Créer le fichier Markdown source

```bash
cd /media/psf/Developpement/00-GIT/chatbottez-legis-quebec

# Créer le nouveau document
cat > nouveau-doc.md << 'EOF'
# Titre du document - Légis Québec

**Cotechnoe inc.**  
Dernière mise à jour : [DATE]

---

## Contenu

[Votre contenu ici]

---

## 📧 Contact

**Support** : support@cotechnoe.com  
**Site web** : https://cotechnoe.com
EOF

# Committer
git add nouveau-doc.md
git commit -m "Add nouveau-doc documentation"
git push
```

### 2. Créer le fichier HTML de redirection

```bash
cd /media/psf/Developpement/00-GIT/chatbottez-legis-qc-app-gen/appPackage

# Créer le fichier HTML
cat > nouveau-doc.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=https://github.com/Cotechnoe/chatbottez-legis-quebec/blob/main/nouveau-doc.md">
    <title>Nouveau Doc - Légis Québec</title>
</head>
<body>
    <p>Redirection vers la documentation...</p>
</body>
</html>
EOF
```

### 3. Mettre à jour le Makefile

Éditer `appPackage/Makefile` et ajouter le nouveau fichier :

```makefile
deploy-docs:
	@echo "Déploiement des documents sur cotechnoe.com/legisqc/..."
	@scp -i ~/.ssh/cotechnoe-srv.pem privacy.html terms.html get-started.html help.html nouveau-doc.html michel@cotechnoe.com:~
	@ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "sudo mkdir -p /var/www/html/legisqc && sudo mv ~/privacy.html ~/terms.html ~/get-started.html ~/help.html ~/nouveau-doc.html /var/www/html/legisqc/ && sudo chown -R www-data:www-data /var/www/html/legisqc/"
	@echo "Documents déployés avec succès!"
	@echo "URLs:"
	@echo "  - https://cotechnoe.com/legisqc/privacy"
	@echo "  - https://cotechnoe.com/legisqc/terms"
	@echo "  - https://cotechnoe.com/legisqc/get-started"
	@echo "  - https://cotechnoe.com/legisqc/help"
	@echo "  - https://cotechnoe.com/legisqc/nouveau-doc"
```

### 4. Déployer

```bash
cd /media/psf/Developpement/00-GIT/chatbottez-legis-qc-app-gen/appPackage
make deploy-docs
```

### 5. Committer les changements

```bash
cd /media/psf/Developpement/00-GIT/chatbottez-legis-qc-app-gen
git add appPackage/nouveau-doc.html appPackage/Makefile
git commit -m "Add nouveau-doc HTML redirect and update Makefile"
git push
```

---

## 🔗 Référencer dans le manifest Teams

Si le document doit être accessible depuis le manifest Teams, éditer `appPackage/manifest.json` :

### Pour les URLs légales (developer section)

```json
"developer": {
  "name": "Cotechnoe inc.",
  "websiteUrl": "https://cotechnoe.com",
  "privacyUrl": "https://cotechnoe.com/legisqc/privacy",
  "termsOfUseUrl": "https://cotechnoe.com/legisqc/terms"
}
```

### Pour les URLs dans la description

```json
"description": {
  "full": "...\n\n📚 Nouveau Doc: https://cotechnoe.com/legisqc/nouveau-doc\n\n..."
}
```

Après modification du manifest :

```bash
cd /media/psf/Developpement/00-GIT/chatbottez-legis-qc-app-gen
git add appPackage/manifest.json
git commit -m "Add nouveau-doc URL to manifest"
git push
```

---

## 🔧 Configuration Apache

### Vérifier le .htaccess

Le fichier `/var/www/html/legisqc/.htaccess` doit contenir :

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]
```

Cela permet d'accéder aux URLs sans l'extension `.html`.

### Créer/Vérifier le .htaccess

```bash
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "cat /var/www/html/legisqc/.htaccess"
```

Si manquant, créer :

```bash
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "echo -e 'RewriteEngine On\nRewriteCond %{REQUEST_FILENAME}.html -f\nRewriteRule ^(.*)$ \$1.html [L]' | sudo tee /var/www/html/legisqc/.htaccess && sudo chown www-data:www-data /var/www/html/legisqc/.htaccess"
```

---

## ✅ Tests et validation

### Tester les URLs

```bash
# Test en masse
for path in privacy terms get-started help; do 
  echo "Testing https://cotechnoe.com/legisqc/$path"
  curl -I "https://cotechnoe.com/legisqc/$path" 2>/dev/null | head -1
done
```

**Résultat attendu** : `HTTP/1.1 200 OK` pour chaque URL.

### Tester la redirection GitHub

```bash
# Vérifier que la redirection fonctionne
curl -L "https://cotechnoe.com/legisqc/privacy" 2>/dev/null | grep -i "github"
```

### Vérifier les fichiers sur le serveur

```bash
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "ls -lh /var/www/html/legisqc/"
```

**Résultat attendu** :
```
-rw-rw-r-- 1 www-data www-data 327 Nov 14 21:36 get-started.html
-rw-rw-r-- 1 www-data www-data 297 Nov 14 21:36 help.html
-rw-rw-r-- 1 www-data www-data 514 Nov 14 21:36 privacy.html
-rw-rw-r-- 1 www-data www-data 501 Nov 14 21:36 terms.html
```

---

## 🚨 Dépannage

### Problème : URL retourne 404

**Causes possibles** :
1. Fichier HTML non déployé sur le serveur
2. `.htaccess` mal configuré
3. `mod_rewrite` désactivé dans Apache

**Solutions** :

```bash
# 1. Re-déployer
cd /media/psf/Developpement/00-GIT/chatbottez-legis-qc-app-gen/appPackage
make deploy-docs

# 2. Vérifier .htaccess
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "cat /var/www/html/legisqc/.htaccess"

# 3. Activer mod_rewrite
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "sudo a2enmod rewrite && sudo systemctl restart apache2"
```

### Problème : Redirection GitHub ne fonctionne pas

**Vérifier le contenu HTML** :

```bash
curl "https://cotechnoe.com/legisqc/privacy.html" 2>/dev/null | grep "meta http-equiv"
```

Doit contenir : `<meta http-equiv="refresh" content="0; url=https://github.com/..."`

### Problème : Permissions incorrectes

```bash
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "sudo chown -R www-data:www-data /var/www/html/legisqc/ && sudo chmod 755 /var/www/html/legisqc/ && sudo chmod 644 /var/www/html/legisqc/*"
```

---

## 📚 Conformité légale

### Documents requis par Microsoft Teams

1. **Privacy Policy (privacyUrl)** - ✅ Obligatoire
   - URL : `https://cotechnoe.com/legisqc/privacy`
   - Contenu minimal : Collecte, utilisation, conservation, sécurité, droits

2. **Terms of Use (termsOfUseUrl)** - ✅ Obligatoire
   - URL : `https://cotechnoe.com/legisqc/terms`
   - Contenu minimal : Service, usages interdits, responsabilité, droit applicable

### Documents recommandés

3. **Get Started** - Démarrage rapide
   - URL : `https://cotechnoe.com/legisqc/get-started`
   - Référencé dans le manifest (description complète)

4. **Help** - Documentation d'aide
   - URL : `https://cotechnoe.com/legisqc/help`
   - Référencé dans le manifest (description complète)

### Conformité LPRPDE et Loi 25 (Québec)

Les documents `privacy.md` et `terms.md` sont conformes à :
- **LPRPDE** (Loi fédérale canadienne)
- **Loi 25** (Protection des renseignements personnels, Québec)

**Coordonnées de contact obligatoires** :
- Email : support@cotechnoe.com
- Commissaire à la vie privée (Canada) : 1-800-282-1376
- Commission d'accès à l'information (Québec) : 1-888-528-7741

---

## 🔐 Accès SSH et sécurité

### Clé SSH

**Emplacement** : `~/.ssh/cotechnoe-srv.pem`

**Permissions requises** :
```bash
chmod 600 ~/.ssh/cotechnoe-srv.pem
```

### Connexion SSH

```bash
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com
```

### Commandes sudo

Sur le serveur, l'utilisateur `michel` a les droits sudo pour :
- `mv` vers `/var/www/html/`
- `chown` sur `/var/www/html/`
- `mkdir` dans `/var/www/html/`
- `a2enmod` et `systemctl restart apache2`

---

## 📦 Commandes rapides

### Déploiement complet

```bash
# 1. Mettre à jour les documents Markdown
cd /media/psf/Developpement/00-GIT/chatbottez-legis-quebec
git pull
# [Modifier les fichiers .md]
git add .
git commit -m "Update documentation"
git push

# 2. Déployer les HTML (si modifiés)
cd /media/psf/Developpement/00-GIT/chatbottez-legis-qc-app-gen/appPackage
make deploy-docs

# 3. Tester
for path in privacy terms get-started help; do 
  curl -I "https://cotechnoe.com/legisqc/$path" 2>/dev/null | head -1
done
```

### Vérification rapide

```bash
# Voir les fichiers sur le serveur
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "ls -lh /var/www/html/legisqc/"

# Voir le .htaccess
ssh -i ~/.ssh/cotechnoe-srv.pem michel@cotechnoe.com "cat /var/www/html/legisqc/.htaccess"

# Tester une URL
curl -I "https://cotechnoe.com/legisqc/privacy" 2>/dev/null | head -1
```

---

## 📋 Checklist de déploiement

### Nouveau document

- [ ] Créer `nouveau-doc.md` dans `chatbottez-legis-quebec`
- [ ] Committer et pusher sur GitHub
- [ ] Créer `nouveau-doc.html` dans `appPackage/`
- [ ] Mettre à jour `appPackage/Makefile`
- [ ] Exécuter `make deploy-docs`
- [ ] Tester l'URL : `https://cotechnoe.com/legisqc/nouveau-doc`
- [ ] Mettre à jour `manifest.json` si nécessaire
- [ ] Committer et pusher les changements du projet principal

### Mise à jour d'un document existant

- [ ] Modifier le fichier `.md` dans `chatbottez-legis-quebec`
- [ ] Committer et pusher sur GitHub
- [ ] Vérifier que l'URL affiche les changements (GitHub cache ~5 min)
- [ ] **Pas besoin de re-déployer les HTML** (redirection automatique)

---

## 🔗 Liens utiles

- **Repository docs** : https://github.com/Cotechnoe/chatbottez-legis-quebec
- **Repository principal** : https://github.com/michel-heon/chatbottez-legis-qc
- **Serveur web** : https://cotechnoe.com/legisqc/
- **Microsoft Teams App Manifest** : https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema

---

## 📝 Notes importantes

1. **Les fichiers `.md` sont la source de vérité** - Toute modification doit être faite dans le repository `chatbottez-legis-quebec`.

2. **Les fichiers HTML sont des redirections** - Ils ne contiennent pas le contenu, seulement une balise `<meta refresh>`.

3. **URL rewriting Apache** - Permet d'utiliser `/privacy` au lieu de `/privacy.html`.

4. **Cache GitHub** - Les modifications sur GitHub peuvent prendre quelques minutes avant d'être visibles.

5. **Conformité légale** - Ne jamais supprimer `privacy.md` ou `terms.md`, requis par Microsoft Teams.

6. **Backup** - Les documents sont versionnés sur Git, aucun backup serveur nécessaire.

---

**Version du guide** : 1.0  
**Dernière mise à jour** : 14 novembre 2024  
**Auteur** : GitHub Copilot  
**Contact** : support@cotechnoe.com
