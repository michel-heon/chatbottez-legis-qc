# Microsoft 365 User Provisioning System

> **🚀 Système automatisé de création et gestion d'utilisateurs Microsoft 365**

## Démarrage rapide

```bash
# Workflow complet (recommandé)
make user-setup-complete \
    USER_EMAIL=nouvel.utilisateur@cotechnoe.com \
    PASSWORD='TempPassword123!' \
    FIRST_NAME='Jean' \
    LAST_NAME='Dupont' \
    NOTIFICATION_EMAIL=jean.dupont@gmail.com
```

## Commandes principales

| Commande | Description |
|----------|-------------|
| `user-setup-complete` | 🚀 Workflow complet (création + licences + MFA + email) |
| `user-create` | 🏗️ Création du compte M365 |
| `user-license-assign` | 📋 Attribution licences Business Premium + Teams |
| `user-mfa-enable` | 🔐 Activation authentification multifacteurs |
| `email-forward-enable` | 📧 Configuration transfert email |
| `email-send` | ✉️ Envoi email de bienvenue |
| `email-test-send` | 🧪 Test email (vers administrateur) |
| `email-simulate` | 📋 Simulation email (pas d'envoi) |

## Email de bienvenue - Applications incluses

L'email contient une grille d'applications Microsoft 365 avec accès direct :

- 💬 **Microsoft Teams** - Collaboration et Chatbottez Légis Québec
- 📧 **Outlook** - Messagerie professionnelle  
- 💾 **OneDrive** - Stockage cloud personnel
- 📝 **OneNote** - Prise de notes et organisation
- 👤 **Mon Compte** - Gestion profil et sécurité
- 📱 **Télécharger Apps** - Applications de bureau à installer

*Tous les liens incluent le nom d'utilisateur pré-rempli pour faciliter la connexion.*

## Prérequis

```bash
# Installation des modules PowerShell requis
make powershell-modules-install

# Connexion Azure (requis avant utilisation)
az login

# Vérification de l'environnement
make graph-graph-quick-test
```

## Exemples d'usage

```bash
# Simulation pour tester
make email-simulate USER_EMAIL=test@cotechnoe.com

# Création utilisateur seul
make user-create USER_EMAIL=martin.durand@cotechnoe.com

# Attribution licences seule
make user-license-assign USER_EMAIL=martin.durand@cotechnoe.com

# Test email vers administrateur
make email-test-send USER_EMAIL=martin.durand@cotechnoe.com PASSWORD='Test123!'
```

## Configuration

### Variables d'environnement

```bash
USER_EMAIL=...                    # Email professionnel (requis)
PASSWORD=...                      # Mot de passe temporaire
FIRST_NAME=...                    # Prénom
LAST_NAME=...                     # Nom de famille
NOTIFICATION_EMAIL=...            # Email personnel pour transfert
```

### Configuration SMTP (optionnelle)

Créer `.smtp.env` :
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@cotechnoe.com
SMTP_PASSWORD=...
```

## Dépannage

```bash
# Diagnostic complet
make email-forward-diagnose

# Test connexion SMTP  
make smtp-connection-check

# Vérification accès Graph
make graph-graph-quick-test

# Logs détaillés
export DEBUG=1
make user-setup-complete USER_EMAIL=test@cotechnoe.com
```

## Architecture

- **Azure CLI** - Gestion utilisateurs
- **Microsoft Graph PowerShell SDK** - Attribution licences fiable
- **Exchange Online PowerShell** - Configuration email
- **Python 3 + SMTP** - Envoi emails HTML professionnels
- **GNU Make** - Orchestration workflows

## Documentation complète

Voir `../docs/M365-USER-PROVISIONING.md` pour la documentation technique complète.

---

*Système développé par Cotechnoe - Support : heon@cotechnoe.com*
