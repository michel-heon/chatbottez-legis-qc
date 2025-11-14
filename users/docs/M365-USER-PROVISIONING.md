# Système de Provisioning d'Utilisateurs Microsoft 365

> **Documentation complète du système de création et gestion d'utilisateurs Microsoft 365 avec email professionnel automatisé**

## 🎯 Vue d'ensemble

Ce système fournit une solution complète et automatisée pour :

- ✅ **Création d'utilisateurs Microsoft 365** avec profils complets
- ✅ **Attribution automatique de licences** (Business Premium + Teams)  
- ✅ **Activation MFA** (authentification multifacteurs)
- ✅ **Configuration du transfert email** vers email personnel
- ✅ **Envoi d'email de bienvenue** avec accès direct aux applications
- ✅ **Gestion centralisée** via Makefile avec workflow séquentiel

---

## 🚀 Démarrage rapide

### Provisioning complet d'un utilisateur (recommandé)

```bash
# Depuis la racine du projet
make -C users user-setup-complete \
    USER_EMAIL=nouvel.utilisateur@cotechnoe.com \
    PASSWORD='TempPassword123!' \
    FIRST_NAME='Jean' \
    LAST_NAME='Dupont' \
    NOTIFICATION_EMAIL=jean.dupont@gmail.com
```

Cette commande exécute automatiquement les 5 étapes :
1. 🏗️ Création du compte M365
2. 📋 Attribution des licences Business Premium + Teams  
3. 🔐 Activation de l'authentification multifacteurs (MFA)
4. 📧 Configuration du transfert email vers l'email personnel
5. ✉️ Envoi de l'email de bienvenue avec liens directs

---

## 📖 Référence des commandes

### Commandes principales (Makefile)

| Commande | Description | Usage |
|----------|-------------|-------|
| `user-setup-complete` | 🚀 **Workflow complet** - Toutes les étapes | `make user-setup-complete USER_EMAIL=...` |
| `user-create` | Création du compte M365 | `make user-create USER_EMAIL=...` |
| `user-license-assign` | Attribution des licences (PowerShell SDK) | `make user-license-assign USER_EMAIL=...` |
| `user-mfa-enable` | Activation MFA | `make user-mfa-enable USER_EMAIL=...` |
| `email-forward-enable` | Configuration transfert email | `make email-forward-enable USER_EMAIL=...` |
| `email-send` | Envoi email de bienvenue | `make email-send USER_EMAIL=...` |
| `email-test-send` | Test email (vers administrateur) | `make email-test-send USER_EMAIL=...` |
| `email-simulate` | Simulation email (pas d'envoi) | `make email-simulate USER_EMAIL=...` |

### Variables d'environnement

```bash
# Variables principales
USER_EMAIL=nouvel.utilisateur@cotechnoe.com    # Email professionnel (requis)
PASSWORD=TempPassword123!                       # Mot de passe temporaire
FIRST_NAME=Jean                                 # Prénom
LAST_NAME=Dupont                                # Nom de famille
DISPLAY_NAME="Jean Dupont"                      # Nom d'affichage complet
NOTIFICATION_EMAIL=jean.dupont@gmail.com        # Email personnel pour transfert

# Configuration SMTP (optionnelle)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@cotechnoe.com
SMTP_PASSWORD=...
```

---

## 🛠️ Architecture technique

### Composants principaux

```
users/
├── 📋 Makefile                              # Orchestration des workflows
├── 🏗️ create-m365-user.sh                   # Création utilisateur Azure AD
├── ⚡ user-licenses-assign-powershell.ps1   # Attribution licences (PowerShell SDK)
├── 🔐 user-mfa-enable.ps1                   # Activation MFA
├── 📧 user-email-forward.sh                 # Configuration transfert email
├── ✉️ email-send.sh                         # Orchestrateur email
├── 🎨 EMAIL_TEMPLATE.html                   # Template email professionnel
├── 🐍 smtp_send.py                          # Envoi SMTP via Python
└── ⚙️ setup-ps-modules.sh                   # Installation modules PowerShell
```

### Technologies utilisées

- **Azure CLI** - Gestion des utilisateurs et authentification
- **Microsoft Graph PowerShell SDK** - Attribution fiable des licences
- **Exchange Online PowerShell** - Configuration transfert email
- **Python 3 + SMTP** - Envoi d'emails HTML
- **GNU Make** - Orchestration et workflows
- **HTML/CSS** - Templates email responsive

---

## 📧 Système d'email professionnel

### Template de bienvenue

L'email de bienvenue inclut :

- **Informations de connexion** avec mot de passe temporaire
- **Étapes prioritaires** (activation compte, connexion Teams, installation Légis Québec)
- **Grille d'applications Microsoft 365** avec accès direct :
  - 💬 **Microsoft Teams** - Collaboration et Chatbottez Légis Québec
  - 📧 **Outlook** - Messagerie professionnelle
  - 💾 **OneDrive** - Stockage cloud personnel
  - 📝 **OneNote** - Prise de notes et organisation
  - 👤 **Mon Compte** - Gestion profil et sécurité
  - 📱 **Télécharger Apps** - Applications de bureau à installer

### Fonctionnalités avancées

- ✅ **Pré-remplissage automatique** - Liens avec `?username={{USER_EMAIL}}`
- ✅ **Design responsive** - Compatible tous clients email
- ✅ **Branding Cotechnoe** - Couleurs et identité visuelle intégrés
- ✅ **Templates HTML professionnels** - Structure claire et moderne

### Modes d'envoi

```bash
# Simulation (génère l'email sans l'envoyer)
make email-simulate USER_EMAIL=test@cotechnoe.com

# Test (envoie vers l'administrateur)
make email-test-send USER_EMAIL=test@cotechnoe.com

# Production (envoie à l'utilisateur final)
make email-send USER_EMAIL=test@cotechnoe.com
```

---

## 🔧 Configuration et prérequis

### Prérequis système

```bash
# Outils requis
✅ Azure CLI (az) - Gestion utilisateurs Microsoft 365
✅ PowerShell Core (pwsh) - Modules Graph et Exchange
✅ Python 3.8+ - Envoi emails SMTP
✅ jq - Parsing JSON
✅ make - Orchestration workflows

# Installation rapide (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y jq make python3 python3-pip

# Installation Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Installation PowerShell Core
wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y powershell
```

### Configuration des modules PowerShell

```bash
# Installation automatique des modules requis
make powershell-modules-install
```

Modules installés :
- **Microsoft.Graph.Authentication** - Authentification Graph API
- **Microsoft.Graph.Users.Actions** - Gestion utilisateurs et licences
- **ExchangeOnlineManagement** - Configuration transfert email

### Configuration SMTP (optionnelle)

Créer le fichier `users/.smtp.env` :

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@cotechnoe.com
SMTP_PASSWORD=app_specific_password
EMAIL_TRANSPORT=smtp
```

---

## 🔐 Sécurité et authentification

### Authentification Azure

```bash
# Connexion Azure CLI (requis)
az login

# Vérification des permissions
az ad signed-in-user show

# Consentement pour les permissions Graph API
make graph-mail-consent
```

### Permissions Microsoft Graph requises

- **User.ReadWrite.All** - Création et modification utilisateurs
- **Directory.ReadWrite.All** - Gestion du répertoire
- **Mail.Send** - Envoi d'emails via Graph API

### Gestion des licences

Le système utilise le **Microsoft Graph PowerShell SDK** (méthode officiellement recommandée par Microsoft) plutôt que Azure CLI pour une attribution fiable des licences.

**Licences attribuées automatiquement :**
- `SPB` - Microsoft 365 Business Premium
- `TEAMS1` - Microsoft Teams (standalone si nécessaire)

---

## 📊 Monitoring et diagnostic

### Vérification des prérequis

```bash
# Validation de l'environnement
make graph-graph-quick-test

# Diagnostic transfert email
make email-forward-diagnose

# Test connexion SMTP
make smtp-connection-check
```

### Logs et débogage

```bash
# Activation des logs détaillés
export DEBUG=1
make user-setup-complete USER_EMAIL=test@cotechnoe.com

# Vérification état des licences
pwsh -Command "Get-MgUserLicenseDetail -UserId test@cotechnoe.com"

# Vérification état MFA
pwsh -Command "Get-MgUser -UserId test@cotechnoe.com -Property displayName,userPrincipalName,assignedLicenses"
```

---

## 🎯 Cas d'usage et exemples

### Scénario 1 : Nouvel employé standard

```bash
make -C users user-setup-complete \
    USER_EMAIL=marie.martin@cotechnoe.com \
    FIRST_NAME=Marie \
    LAST_NAME=Martin \
    NOTIFICATION_EMAIL=marie.martin@gmail.com \
    PASSWORD='BienvenueCotechnoe2024!'
```

### Scénario 2 : Utilisateur temporaire/consultant

```bash
# Création sans transfert email
make -C users user-create USER_EMAIL=consultant@cotechnoe.com
make -C users user-license-assign USER_EMAIL=consultant@cotechnoe.com
make -C users email-send USER_EMAIL=consultant@cotechnoe.com PASSWORD='TempAccess123!'
```

### Scénario 3 : Configuration par étapes (diagnostic)

```bash
# Étape par étape avec vérification
make -C users user-create USER_EMAIL=debug@cotechnoe.com
echo "✅ Utilisateur créé - Vérifiez dans Azure AD"

make -C users user-license-assign USER_EMAIL=debug@cotechnoe.com  
echo "✅ Licences attribuées - Vérifiez dans M365 Admin"

make -C users user-mfa-enable USER_EMAIL=debug@cotechnoe.com
echo "✅ MFA activé - Vérifiez dans Azure AD Security"

make -C users email-simulate USER_EMAIL=debug@cotechnoe.com
echo "✅ Email généré - Vérifiez le contenu"
```

---

## 🔄 Maintenance et mise à jour

### Nettoyage environnement

```bash
# Suppression environnement Python local
make project-clean

# Réinstallation complète
make env-setup
make powershell-modules-install
```

### Sauvegarde des configurations

```bash
# Sauvegarde des fichiers de configuration
cp users/.smtp.env users/.smtp.env.backup
cp users/.env.user-account users/.env.user-account.backup
```

### Mise à jour des templates

Les templates HTML sont dans `users/EMAIL_TEMPLATE.html`. Pour personnaliser :

1. **Modifier le template** avec votre éditeur préféré
2. **Tester les modifications** avec `make email-simulate`
3. **Valider le rendu** avec `make email-test-send`
4. **Déployer en production** avec `make email-send`

---

## ⚡ Performance et optimisation

### Temps d'exécution moyens

- **Création utilisateur** : 10-15 secondes
- **Attribution licences** : 30-45 secondes (propagation Microsoft)
- **Activation MFA** : 5-10 secondes
- **Configuration transfert** : 15-30 secondes (dépend de la propagation Exchange)
- **Envoi email** : 2-5 secondes

### Recommandations

- ⏰ **Attendre la propagation** - 15-30 minutes entre création et transfert email
- 🔄 **Utiliser les workflows complets** - `user-setup-complete` pour la cohérence
- 🧪 **Tester avant production** - `email-test-send` et `email-simulate`
- 📋 **Vérifier les prérequis** - `graph-graph-quick-test` avant usage

---

## 🆘 Dépannage

### Problèmes courants

#### "Utilisateur non trouvé"
```bash
# Vérifier la création
az ad user show --id utilisateur@cotechnoe.com
```

#### "Licences non disponibles"  
```bash
# Vérifier le stock de licences
pwsh -Command "Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, PrepaidUnits"
```

#### "Transfert email échoue"
```bash
# Diagnostic transfert
make email-forward-diagnose

# Vérification permissions Exchange
pwsh -Command "Get-Mailbox -Identity utilisateur@cotechnoe.com | Select-Object DisplayName, ForwardingAddress"
```

#### "Erreur envoi email"
```bash
# Test connexion SMTP
make smtp-connection-check

# Vérification authentification
export DEBUG=1
make email-simulate USER_EMAIL=test@cotechnoe.com
```

### Support et assistance

- 📧 **Email** : heon@cotechnoe.com
- 📁 **Issues** : Créer un ticket dans le repository
- 📖 **Documentation** : `docs/` pour guides détaillés
- 🛠️ **Logs** : Activer `DEBUG=1` pour diagnostics avancés

---

## 📝 Historique et versions

### Version actuelle : 2.0 (Septembre 2024)

**Nouveautés :**
- ✅ Migration vers Microsoft Graph PowerShell SDK
- ✅ Activation automatique MFA
- ✅ Templates email modernisés avec grille d'applications
- ✅ Workflow complet automatisé
- ✅ Support pré-remplissage utilisateur dans les liens
- ✅ Diagnostic avancé et monitoring

**Corrections :**
- 🔧 Problème couleurs ANSI dans emails
- 🔧 Fiabilité attribution licences
- 🔧 Gestion erreurs propagation Microsoft

### Roadmap

- 🔮 **v2.1** - Support groupes et équipes automatiques
- 🔮 **v2.2** - Intégration Azure AD B2B pour invités
- 🔮 **v2.3** - API REST pour intégration externe
- 🔮 **v3.0** - Interface web de gestion

---

*Documentation générée automatiquement - Dernière mise à jour : 27 septembre 2025*
