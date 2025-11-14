# Guide de référence rapide - Makefile Microsoft 365

## 🚀 Commandes les plus utilisées

### Workflow complet (recommandé)
```bash
# Provisioning complet d'un utilisateur
make user-setup-complete \
    USER_EMAIL=nouvel.utilisateur@cotechnoe.com \
    PASSWORD='TempPassword123!' \
    FIRST_NAME='Marie' \
    LAST_NAME='Dubois' \
    NOTIFICATION_EMAIL=marie.dubois@gmail.com
```

### Tests et simulation
```bash
# Simulation email (sans envoi)
make email-simulate USER_EMAIL=test@cotechnoe.com

# Test email vers administrateur
make email-test-send USER_EMAIL=test@cotechnoe.com PASSWORD='Test123!'

# Envoi réel vers utilisateur
make email-send USER_EMAIL=test@cotechnoe.com PASSWORD='Test123!'
```

## 📋 Commandes par catégorie

### 👤 Gestion utilisateurs
```bash
# Création compte M365
make user-create USER_EMAIL=utilisateur@cotechnoe.com \
    FIRST_NAME=Jean LAST_NAME=Dupont

# Attribution licences (PowerShell SDK - recommandé)
make user-license-assign USER_EMAIL=utilisateur@cotechnoe.com

# Attribution licences (Azure CLI - legacy)
make user-license-assign-legacy USER_EMAIL=utilisateur@cotechnoe.com

# Activation MFA
make user-mfa-enable USER_EMAIL=utilisateur@cotechnoe.com
```

### 📧 Configuration email
```bash
# Configuration transfert email vers email personnel
make email-forward-enable USER_EMAIL=utilisateur@cotechnoe.com

# Activation transfert externe au niveau tenant
make email-forward-external-enable

# Diagnostic problèmes transfert
make email-forward-diagnose
```

### ✉️ Emails de bienvenue
```bash
# Simulation (génère sans envoyer)
make email-simulate USER_EMAIL=utilisateur@cotechnoe.com

# Test (envoie vers administrateur)
make email-test-send USER_EMAIL=utilisateur@cotechnoe.com PASSWORD='Test123!'

# Production (envoie vers utilisateur)
make email-send USER_EMAIL=utilisateur@cotechnoe.com PASSWORD='Test123!'

# Génération template Markdown
make email-template-generate USER_EMAIL=utilisateur@cotechnoe.com

# Génération brouillon texte
make email-draft-generate USER_EMAIL=utilisateur@cotechnoe.com
```

## 🔧 Configuration et diagnostic

### Installation et prérequis
```bash
# Installation modules PowerShell requis
make powershell-modules-install

# Préparation environnement Python
make env-setup

# Consentement permissions Graph API
make graph-mail-consent

# Test rapide accès Azure Graph
make graph-graph-quick-test
```

### Tests SMTP et connectivité
```bash
# Test connexion SMTP via Python
make smtp-connection-check

# Test envoi SMTP direct
make smtp-email-test-send

# Activation SMTP AUTH via Graph
make smtp-auth-activate
```

### Nettoyage
```bash
# Nettoyage complet (venv + artefacts)
make project-clean

# Suppression environnement Python
make env-clean

# Nettoyage emails générés
make email-artifacts-clean
```

## 🎯 Exemples par scénarios

### Nouvel employé permanent
```bash
make user-setup-complete \
    USER_EMAIL=marie.martin@cotechnoe.com \
    FIRST_NAME=Marie \
    LAST_NAME=Martin \
    DISPLAY_NAME="Marie Martin" \
    NOTIFICATION_EMAIL=marie.martin@gmail.com \
    PASSWORD='BienvenueCotechnoe2024!'
```

### Consultant temporaire (sans transfert)
```bash
make user-create USER_EMAIL=consultant@cotechnoe.com \
    FIRST_NAME=Pierre LAST_NAME=Consultant
make user-license-assign USER_EMAIL=consultant@cotechnoe.com
make email-send USER_EMAIL=consultant@cotechnoe.com PASSWORD='TempAccess123!'
```

### Debug étape par étape
```bash
# Étape 1: Création
make user-create USER_EMAIL=debug@cotechnoe.com

# Étape 2: Licences  
make user-license-assign USER_EMAIL=debug@cotechnoe.com

# Étape 3: MFA
make user-mfa-enable USER_EMAIL=debug@cotechnoe.com

# Étape 4: Test email
make email-simulate USER_EMAIL=debug@cotechnoe.com PASSWORD='Debug123!'

# Étape 5: Transfert (attendre 15-30 min après création)
make email-forward-enable USER_EMAIL=debug@cotechnoe.com
```

## 📊 Variables d'environnement

### Variables principales
```bash
USER_EMAIL=utilisateur@cotechnoe.com     # Email professionnel (REQUIS)
PASSWORD=TempPassword123!                # Mot de passe temporaire
FIRST_NAME=Jean                          # Prénom
LAST_NAME=Dupont                         # Nom de famille
DISPLAY_NAME="Jean Dupont"               # Nom d'affichage
NOTIFICATION_EMAIL=jean@gmail.com        # Email personnel pour transfert
TEMP_PASSWORD=TempPassword123!           # Mot de passe par défaut
```

### Configuration SMTP
```bash
SMTP_SERVER=smtp.gmail.com               # Serveur SMTP
SMTP_PORT=587                            # Port SMTP  
SMTP_USER=admin@cotechnoe.com            # Utilisateur SMTP
SMTP_PASSWORD=app_password               # Mot de passe SMTP
EMAIL_TRANSPORT=local                    # Mode transport (local/smtp/graph)
```

### Fichiers de configuration
```bash
# Configuration SMTP
users/.smtp.env

# Configuration compte utilisateur
users/.env.user-account

# Template exemple SMTP
users/.smtp.env.example
```

## 🔍 Diagnostic et résolution de problèmes

### Vérifications de base
```bash
# Test environnement complet
make graph-graph-quick-test

# Diagnostic transfert email
make email-forward-diagnose

# Vérification connexion SMTP
make smtp-connection-check
```

### Debugging avec logs détaillés
```bash
# Activation logs détaillés
export DEBUG=1

# Test avec logs
DEBUG=1 make email-simulate USER_EMAIL=test@cotechnoe.com

# Workflow complet avec logs
DEBUG=1 make user-setup-complete USER_EMAIL=test@cotechnoe.com
```

### Messages d'erreur courants

#### "Utilisateur non trouvé"
```bash
# Vérifier dans Azure AD
az ad user show --id utilisateur@cotechnoe.com
```

#### "Licences non disponibles"
```bash
# Vérifier stock licences
pwsh -Command "Get-MgSubscribedSku | Select SkuPartNumber, ConsumedUnits, PrepaidUnits"
```

#### "Erreur transfert email"
```bash
# Attendre propagation (15-30 min après création)
make email-forward-diagnose

# Réessayer transfert
make email-forward-enable USER_EMAIL=utilisateur@cotechnoe.com
```

## 📞 Aide et support

```bash
# Aide Makefile
make help

# Exemples détaillés
make help-examples

# Documentation complète
cat ../docs/M365-USER-PROVISIONING.md
```

---

*Guide de référence Makefile - Cotechnoe 2024*
