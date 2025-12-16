#!/bin/bash

# Script d'envoi d'email pour nouveaux utilisateurs M365 avec Python intégré
# Auteur: Michel Héon
# Date: $(date +%Y-%m-%d)

set -e  # Arrêter le script en cas d'erreur

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

strip_quotes() {
    # Supprime uniquement les guillemets simples/doubles au début et à la fin
    local value="$1"
    value="${value#\'}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value%\"}"
    printf '%s' "$value"
}

# Configuration par défaut
ADMIN_EMAIL="heon@cotechnoe.com"
ADMIN_NAME="Michel Héon"
TEMPLATE_FILE="${SCRIPT_DIR}/EMAIL_TEMPLATE.html"
VENV_DIR="${SCRIPT_DIR}/venv"
CREATE_USER_SCRIPT="${SCRIPT_DIR}/create-m365-user.sh"
SMTP_CONFIG_FILE_DEFAULT="${SCRIPT_DIR}/.smtp.env"

# Charger la configuration SMTP locale si présente
SMTP_CONFIG_FILE="${SMTP_CONFIG_FILE:-$SMTP_CONFIG_FILE_DEFAULT}"
if [ -f "$SMTP_CONFIG_FILE" ]; then
    set -a
    # shellcheck source=/dev/null
    source "$SMTP_CONFIG_FILE"
    set +a
fi

# Variables d'environnement pour le serveur SMTP
DEFAULT_SMTP_SERVER="smtp.gmail.com"
DEFAULT_SMTP_PORT="587"
SMTP_SERVER="${SMTP_SERVER:-$DEFAULT_SMTP_SERVER}"
SMTP_PORT="${SMTP_PORT:-$DEFAULT_SMTP_PORT}"
SMTP_USER="${SMTP_USER:-$ADMIN_EMAIL}"
SMTP_PASSWORD="${SMTP_PASSWORD:-}"

EMAIL_TRANSPORT="${EMAIL_TRANSPORT:-}"
if [ -z "$EMAIL_TRANSPORT" ]; then
    if [ -n "$SMTP_PASSWORD" ]; then
        EMAIL_TRANSPORT="smtp"
    else
        EMAIL_TRANSPORT="graph"
    fi
fi

export SMTP_SERVER SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_CONFIG_FILE

# Fonction pour installer les dépendances Python localement
install_python_deps() {
    echo -e "${BLUE}Installation des dépendances Python dans ${VENV_DIR}...${NC}"
    
    # Créer un environnement virtuel local si nécessaire
    if [ ! -d "$VENV_DIR" ]; then
        python3 -m venv "$VENV_DIR"
    fi
    
    # Activer l'environnement virtuel
    # shellcheck disable=SC1090
    source "$VENV_DIR/bin/activate"
    
    # Installer les dépendances nécessaires
    pip install --quiet requests azure-cli-core
    
    echo -e "${GREEN}✅ Dépendances Python installées${NC}"
}

# Fonction d'aide
show_help() {
    echo "=== Script d'envoi d'email - Nouveaux utilisateurs M365 ==="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --user-email EMAIL         Email M365 du nouvel utilisateur (obligatoire)"
    echo "  -p, --password PASSWORD        Mot de passe temporaire (optionnel - récupéré depuis le script de création si non fourni)"
    echo "  -t, --test                     Mode test: envoyer à Michel Héon (heon@videotron.ca)"
    echo "  -s, --simulate                 Simulation: afficher l'email sans l'envoyer"
    echo "  -h, --help                     Afficher cette aide"
    echo ""
    echo "Note: Les informations utilisateur (nom, prénom, email personnel) sont automatiquement"
    echo "      récupérées depuis Azure AD en utilisant l'email comme clé."
    echo ""
    echo "Exemples:"
    echo "  $0 --test --user-email martin.suzanne@cotechnoe.com --password TempPassword123!"
    echo "  $0 -u john.doe@cotechnoe.com -p MyTempPass456!"
    echo "  $0 --simulate -u test@cotechnoe.com"
    echo ""
    echo "SMTP : définissez SMTP_USER / SMTP_PASSWORD ou créez users/.smtp.env"
}

# Fonction pour récupérer les informations utilisateur avec Python
get_user_info_with_python() {
    local user_email="$1"
    
    echo -e "${BLUE}Récupération des informations utilisateur via Python...${NC}"
    
    # Activer l'environnement virtuel Python
    # shellcheck disable=SC1090
    source "$VENV_DIR/bin/activate"
    
    # Exécuter le code Python intégré
    python3 << EOF
import subprocess
import json
import sys

def get_azure_user_info(user_email):
    """Récupère les informations utilisateur depuis Azure AD"""
    try:
        # Vérifier la connexion Azure CLI
        result = subprocess.run(['az', 'account', 'show'], 
                              capture_output=True, text=True, check=True)
        
        # Récupérer les informations utilisateur
        cmd = [
            'az', 'rest',
            '--method', 'GET',
            '--url', f'https://graph.microsoft.com/v1.0/users/{user_email}',
            '--query', json.dumps({
                'displayName': 'displayName',
                'givenName': 'givenName', 
                'surname': 'surname',
                'otherMails': 'otherMails',
                'userPrincipalName': 'userPrincipalName'
            })
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        user_data = json.loads(result.stdout)
        
        # Traitement des données
        display_name = user_data.get('displayName', '').strip()
        given_name = user_data.get('givenName', '').strip()
        other_mails = user_data.get('otherMails', [])
        personal_email = (other_mails[0] if other_mails else user_email).strip()

        if not given_name:
            given_name = display_name

        def clean(value):
            value = (value or '').strip("'\" ")
            return value.replace('"', '\\"')

        display_name = clean(display_name)
        given_name = clean(given_name)
        personal_email = clean(personal_email)
        
        # Exporter les variables pour bash
        print(f"export USER_NAME=\"{display_name}\"")
        print(f"export FIRST_NAME=\"{given_name}\"")
        print(f"export PERSONAL_EMAIL=\"{personal_email}\"")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Erreur Azure CLI: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Erreur: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    user_email = "$user_email"
    success = get_azure_user_info(user_email)
    sys.exit(0 if success else 1)
EOF

    # Capturer les variables exportées
    local python_output=$(python3 << EOF
import subprocess
import json
import sys

try:
    user_email = "$user_email"
    cmd = ['az', 'rest', '--method', 'GET', 
           '--url', f'https://graph.microsoft.com/v1.0/users/{user_email}',
           '--query', '{"displayName": "displayName", "givenName": "givenName", "surname": "surname", "otherMails": "otherMails"}']
    
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    user_data = json.loads(result.stdout)
    
    display_name = user_data.get('displayName', '').strip()
    given_name = user_data.get('givenName', '').strip()
    other_mails = user_data.get('otherMails', [])
    personal_email = (other_mails[0] if other_mails else user_email).strip()

    if not given_name:
        given_name = display_name

    for var_name in ('display_name', 'given_name', 'personal_email'):
        value = locals()[var_name].strip("\"' ")
        value = value.replace('"', '\\"')
        locals()[var_name] = value
    
    display_name = display_name.replace('"', '\\"')
    given_name = given_name.replace('"', '\\"')
    personal_email = personal_email.replace('"', '\\"')

    print(f"USER_NAME=\"{display_name}\"")
    print(f"FIRST_NAME=\"{given_name}\"")
    print(f"PERSONAL_EMAIL=\"{personal_email}\"")
    
except Exception as e:
    print(f"USER_NAME=''", file=sys.stderr)
    print(f"FIRST_NAME=''", file=sys.stderr)
    print(f"PERSONAL_EMAIL='{user_email}'", file=sys.stderr)
    print(f"Erreur: {e}", file=sys.stderr)
    sys.exit(1)
EOF
    )
    
    if [ $? -eq 0 ]; then
        eval "$python_output"

        USER_NAME="$(strip_quotes "$USER_NAME")"
        FIRST_NAME="$(strip_quotes "$FIRST_NAME")"
        PERSONAL_EMAIL="$(strip_quotes "$PERSONAL_EMAIL")"

        echo -e "${GREEN}✅ Informations utilisateur récupérées:${NC}"
        echo -e "${BLUE}  - Nom complet: $USER_NAME${NC}"
        echo -e "${BLUE}  - Prénom: $FIRST_NAME${NC}"
        echo -e "${BLUE}  - Email destinataire: $PERSONAL_EMAIL${NC}"
        return 0
    else
        echo -e "${RED}❌ Erreur lors de la récupération des informations utilisateur${NC}"
        return 1
    fi
}

# Fonction de vérification Azure CLI (simplifiée)
check_azure_cli() {
    echo -e "${BLUE}Vérification d'Azure CLI...${NC}"
    
    if ! command -v az &> /dev/null; then
        echo -e "${RED}❌ Azure CLI non trouvé${NC}"
        echo -e "${YELLOW}Veuillez installer Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
        exit 1
    fi
    
    # Vérifier la connexion Azure via Python
    # shellcheck disable=SC1090
    source "$VENV_DIR/bin/activate"
    python3 << 'EOF'
import subprocess
import sys

try:
    result = subprocess.run(['az', 'account', 'show'], 
                          capture_output=True, text=True, check=True)
    print("✓ Azure CLI connecté", file=sys.stderr)
    sys.exit(0)
except subprocess.CalledProcessError:
    print("✗ Non connecté à Azure - Exécutez: az login", file=sys.stderr)
    sys.exit(1)
EOF
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Non connecté à Azure${NC}"
        echo -e "${YELLOW}Veuillez vous connecter avec: az login${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Azure CLI disponible et connecté${NC}"
}

# Fonction pour générer l'email avec Python
generate_email_with_python() {
    local user_email="$1"
    local user_name="$2"
    local first_name="$3"
    local temp_password="$4"
    local personal_email="$5"
    
    echo -e "${BLUE}Génération de l'email avec Python...${NC}" >&2
    
    # Activer l'environnement virtuel Python
    # shellcheck disable=SC1090
    source "$VENV_DIR/bin/activate"
    
    # Générer l'email avec Python
    ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_NAME="$ADMIN_NAME" TEMPLATE_FILE="$TEMPLATE_FILE" python3 <<EOF
import os
import re
import html
from datetime import datetime

def generate_email_content(user_email, user_name, first_name, temp_password, personal_email):
    """Génère le contenu de l'email à partir du template"""
    template_file = os.environ.get('TEMPLATE_FILE', '')
    current_date = datetime.now().strftime("%d %B %Y")
    
    try:
        if not os.path.exists(template_file):
            template_content = '''<!DOCTYPE html><html><body style="font-family:Segoe UI,Arial,sans-serif;color:#202124;">
<h2>Bienvenue {{USER_FIRST_NAME}}</h2>
<p>Votre compte Microsoft 365 est prêt. Utilisez les informations ci-dessous pour vous connecter :</p>
<ul>
  <li><strong>Nom d'utilisateur :</strong> {{USER_EMAIL}}</li>
  <li><strong>Mot de passe temporaire :</strong> {{USER_TEMP_PASSWORD}}</li>
</ul>

<h3>🔗 Liens de connexion directs</h3>
<div style="margin:20px 0;">
  <p><strong>Première connexion (changement mot de passe requis) :</strong></p>
  <p style="margin-left:20px;">
    <a href="https://login.microsoftonline.com/?username={{USER_EMAIL}}" style="display:inline-block;background:#0078d4;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">
      🚀 Première connexion
    </a>
  </p>
</div>

<div style="margin:20px 0;">
  <p><strong>Applications Microsoft 365 :</strong></p>
  <ul style="list-style:none;padding:0;">
    <li style="margin:10px 0;">
      <a href="https://teams.microsoft.com?username={{USER_EMAIL}}" style="display:inline-block;background:#6264a7;color:white;padding:8px 12px;text-decoration:none;border-radius:3px;margin-right:10px;">
        💬 Microsoft Teams
      </a>
    </li>
    <li style="margin:10px 0;">
      <a href="https://outlook.office.com?username={{USER_EMAIL}}" style="display:inline-block;background:#0078d4;color:white;padding:8px 12px;text-decoration:none;border-radius:3px;margin-right:10px;">
        📧 Outlook
      </a>
    </li>
    <li style="margin:10px 0;">
      <a href="https://onedrive.live.com?username={{USER_EMAIL}}" style="display:inline-block;background:#0078d4;color:white;padding:8px 12px;text-decoration:none;border-radius:3px;margin-right:10px;">
        💾 OneDrive
      </a>
    </li>
    <li style="margin:10px 0;">
      <a href="https://admin.microsoft.com?username={{USER_EMAIL}}" style="display:inline-block;background:#ff6900;color:white;padding:8px 12px;text-decoration:none;border-radius:3px;margin-right:10px;">
        ⚙️ Admin M365
      </a>
    </li>
  </ul>
</div>

<div style="border:1px solid #d1d5db;padding:15px;margin:20px 0;border-radius:5px;background:#f9fafb;">
  <h4 style="margin-top:0;">📋 Instructions importantes :</h4>
  <ol>
    <li>Utilisez le lien "Première connexion" ci-dessus</li>
    <li>Changez votre mot de passe temporaire</li>
    <li>Configurez l'authentification multifacteurs (MFA)</li>
    <li>Explorez vos applications Microsoft 365</li>
  </ol>
</div>

<p>Besoin d'aide ? Contactez <a href="mailto:{{ADMIN_EMAIL}}">{{ADMIN_EMAIL}}</a>.</p>
<p style="font-size:12px;color:#6b7280;">Courriel généré automatiquement le {{CURRENT_DATE}}.</p>
</body></html>'''
        else:
            with open(template_file, 'r', encoding='utf-8') as f:
                template_content = f.read()
        user_name = (user_name or '').strip()
        first_name = (first_name or '').strip()
        if not first_name:
            first_name = user_name.split(' ')[0] if user_name else user_email.split('@')[0]
        if not user_name:
            user_name = first_name or user_email

        values = {
            'USER_EMAIL': user_email,
            'USER_FIRST_NAME': first_name,
            'USER_FULL_NAME': user_name,
            'USER_TEMP_PASSWORD': temp_password or '******',
            'USER_PERSONAL_EMAIL': personal_email,
            'ADMIN_EMAIL': os.environ.get('ADMIN_EMAIL', ''),
            'ADMIN_NAME': os.environ.get('ADMIN_NAME', 'Administrateur'),
            'CURRENT_DATE': current_date
        }

        replacements = {f'{{{{{key}}}}}': html.escape(str(value)) for key, value in values.items()}

        email_content = template_content
        for placeholder, value in replacements.items():
            email_content = email_content.replace(placeholder, value)

        print(email_content)
        return True
        
    except Exception as e:
        print(f"Erreur lors de la génération de l'email: {e}", file=sys.stderr)
        return False

# Exécuter la génération
success = generate_email_content("$user_email", "$user_name", "$first_name", "$temp_password", "$personal_email")
exit(0 if success else 1)
EOF

    return $?
}

# Fonction pour envoyer l'email avec Python
send_email_with_python() {
    local to_email="$1"
    local subject="$2"
    local email_content="$3"
    
    echo -e "${BLUE}Envoi de l'email via Python SMTP...${NC}"
    
    # Activer l'environnement virtuel Python
    # shellcheck disable=SC1090
    source "$VENV_DIR/bin/activate"
    
    # Envoyer l'email avec Python
    python3 << EOF
import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from html import unescape
import os
import getpass
import re

def send_email_smtp(to_email, subject, content, smtp_server="$SMTP_SERVER", smtp_port=int(os.environ.get('SMTP_PORT', $SMTP_PORT))):
    """Envoie un email en utilisant SMTP avec Python"""
    
    from_email = "$ADMIN_EMAIL"
    from_name = "$ADMIN_NAME"
    
    try:
        # Créer le message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = to_email
        msg['Subject'] = Header(subject, 'utf-8')

        plain_content = content
        plain_content = re.sub(r'<(br|BR)\s*/?>', '\n', plain_content)
        plain_content = re.sub(r'</p>', '\n\n', plain_content)
        plain_content = re.sub(r'</h[1-6]>', '\n\n', plain_content)
        plain_content = re.sub(r'<li[^>]*>', '\n• ', plain_content)
        plain_content = re.sub(r'</li>', '', plain_content)
        plain_content = re.sub(r'<table[^>]*>', '\n', plain_content)
        plain_content = re.sub(r'</tr>', '\n', plain_content)
        plain_content = re.sub(r'</td>', ' | ', plain_content)
        plain_content = re.sub(r'<[^>]+>', '', plain_content)
        plain_content = unescape(plain_content)
        plain_content = re.sub('\n{3,}', '\n\n', plain_content)
        plain_content = plain_content.strip()

        msg.attach(MIMEText(plain_content, 'plain', 'utf-8'))
        msg.attach(MIMEText(content, 'html', 'utf-8'))
        
        # Configuration SMTP
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Activer le chiffrement TLS
        
        # Authentification (si nécessaire)
        smtp_password = os.environ.get('SMTP_PASSWORD')
        smtp_user = os.environ.get('SMTP_USER') or from_email
        if smtp_password:
            server.login(smtp_user, smtp_password)
            print(f"✓ Authentifié avec succès en tant que {smtp_user}", file=sys.stderr)
        elif os.environ.get('SMTP_USER'):
            print("⚠ SMTP_USER défini sans mot de passe - authentification ignorée", file=sys.stderr)
        else:
            print("⚠ Aucun mot de passe SMTP fourni, tentative sans authentification", file=sys.stderr)
        
        # Envoyer l'email
        text = msg.as_string()
        server.sendmail(from_email, [to_email], text)
        server.quit()
        
        print(f"✓ Email envoyé avec succès à {to_email}", file=sys.stderr)
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"✗ Erreur d'authentification SMTP: {e}", file=sys.stderr)
        print("Conseil: Définissez SMTP_PASSWORD=votre_mot_de_passe", file=sys.stderr)
        return False
    except smtplib.SMTPException as e:
        print(f"✗ Erreur SMTP: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"✗ Erreur générale: {e}", file=sys.stderr)
        return False

# Lire le contenu de l'email depuis stdin si nécessaire
email_content = '''$email_content'''

# Envoyer l'email
success = send_email_smtp("$to_email", "$subject", email_content)
sys.exit(0 if success else 1)
EOF

    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Email envoyé avec succès !${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Échec SMTP, tentative avec les outils système...${NC}"
        # Fallback vers les outils système
        send_email_fallback "$to_email" "$subject" "$email_content"
        return $?
    fi
}

# Fonction de fallback pour l'envoi d'email
send_email_fallback() {
    local to_email="$1"
    local subject="$2"
    local email_content="$3"

    local plain_email_content
    plain_email_content=$(printf '%s' "$email_content" | python3 <<'EOF' 2>/dev/null || true
import re
import sys

html = sys.stdin.read()
text = re.sub('<[^<]+?>', '', html)
text = re.sub('\n{3,}', '\n\n', text)
print(text.strip())
EOF
    )
    if [ -z "$plain_email_content" ]; then
        plain_email_content="$email_content"
    fi

    echo -e "${BLUE}Tentative d'envoi avec les outils système...${NC}"
    
    # Utiliser mail si disponible
    if command -v mail &> /dev/null; then
        echo "$plain_email_content" | mail -s "$subject" "$to_email"
    # Sinon utiliser sendmail
    elif command -v sendmail &> /dev/null; then
        {
            echo "To: $to_email"
            echo "From: $ADMIN_EMAIL"
            echo "Subject: $subject"
            echo "Content-Type: text/plain; charset=UTF-8"
            echo ""
            echo "$plain_email_content"
        } | sendmail "$to_email"
    # Ou mutt
    elif command -v mutt &> /dev/null; then
        echo "$plain_email_content" | mutt -s "$subject" "$to_email"
    else
        echo -e "${RED}❌ Aucun client email disponible${NC}"
        echo -e "${YELLOW}Sauvegarde de l'email dans un fichier...${NC}"
        
        # Sauvegarder l'email dans un fichier
        local output_file="${SCRIPT_DIR}/email-to-send-$(date +%Y%m%d-%H%M%S).txt"
        cat > "$output_file" << EOF
À: $to_email
De: $ADMIN_EMAIL
Objet: $subject
Date: $(date)

$plain_email_content
EOF
        echo -e "${BLUE}📄 Email sauvegardé dans: $output_file${NC}"
        return 1
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Email envoyé avec succès !${NC}"
        return 0
    else
        echo -e "${RED}❌ Erreur lors de l'envoi de l'email${NC}"
        return 1
    fi
}

# Fonction pour envoyer l'email via Microsoft Graph
send_email_with_graph() {
    local to_email="$1"
    local subject="$2"
    local content_file="$3"
    local sender_email="${SMTP_USER:-$ADMIN_EMAIL}"

    echo -e "${BLUE}Envoi de l'email via Microsoft Graph...${NC}"

    if ! command -v az >/dev/null 2>&1; then
        echo -e "${RED}❌ Azure CLI requis pour l'envoi via Graph${NC}"
        return 1
    fi

    local access_token
    access_token=$(az account get-access-token --resource https://graph.microsoft.com --query accessToken -o tsv 2>/dev/null)
    if [ -z "$access_token" ]; then
        echo -e "${RED}❌ Impossible de récupérer un token Microsoft Graph (az login requis)${NC}"
        return 1
    fi

    # shellcheck disable=SC1090
    source "$VENV_DIR/bin/activate"

    GRAPH_ACCESS_TOKEN="$access_token" \
    GRAPH_SENDER="$sender_email" \
    GRAPH_TO="$to_email" \
    GRAPH_SUBJECT="$subject" \
    GRAPH_CONTENT_FILE="$content_file" \
    python3 <<'PYCODE'
import json
import os
import requests
import sys

token = os.environ.get("GRAPH_ACCESS_TOKEN")
sender = os.environ.get("GRAPH_SENDER")
to_email = os.environ.get("GRAPH_TO")
subject = os.environ.get("GRAPH_SUBJECT")
content_file = os.environ.get("GRAPH_CONTENT_FILE")

if not token or not sender:
    sys.exit("Token ou expéditeur absent pour Graph")

with open(content_file, 'r', encoding='utf-8') as fh:
    content = fh.read()

payload = {
    "message": {
        "subject": subject,
        "body": {
            "contentType": "Text",
            "content": content
        },
        "toRecipients": [
            {"emailAddress": {"address": to_email}}
        ]
    },
    "saveToSentItems": True
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

resp = requests.post(
    f"https://graph.microsoft.com/v1.0/users/{sender}/sendMail",
    headers=headers,
    data=json.dumps(payload),
    timeout=30
)

if resp.status_code >= 400:
    print("Erreur Graph:", resp.status_code, resp.text)
    sys.exit(1)

print("Email envoyé via Microsoft Graph.")
PYCODE

    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Email envoyé via Microsoft Graph${NC}"
        return 0
    fi

    echo -e "${RED}❌ Erreur lors de l'envoi Graph${NC}"
    return 1
}

# Variables
USER_EMAIL=""
USER_NAME=""
FIRST_NAME=""
LAST_NAME=""
TEMP_PASSWORD=""
PERSONAL_EMAIL=""
TEST_MODE=false
SIMULATE_MODE=false

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--user-email)
            USER_EMAIL="$2"
            shift 2
            ;;
        -p|--password)
            TEMP_PASSWORD="$2"
            shift 2
            ;;
        -t|--test)
            TEST_MODE=true
            shift
            ;;
        -s|--simulate)
            SIMULATE_MODE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Option inconnue: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Vérifier les paramètres obligatoires
if [ -z "$USER_EMAIL" ]; then
    echo -e "${RED}❌ Email utilisateur obligatoire${NC}"
    show_help
    exit 1
fi

echo "=== Envoi d'email - Nouvel utilisateur M365 (Python intégré) ==="

# Installer les dépendances Python si nécessaire
if [ ! -d "$VENV_DIR" ]; then
    install_python_deps
fi

# Récupérer les informations utilisateur avec Python
get_user_info_with_python "$USER_EMAIL"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Impossible de récupérer les informations utilisateur${NC}"
    exit 1
fi

# Récupérer le mot de passe si non fourni
if [ -z "$TEMP_PASSWORD" ]; then
    echo -e "${BLUE}Récupération du mot de passe depuis le script de création...${NC}"
    if [ -f "$CREATE_USER_SCRIPT" ]; then
        TEMP_PASSWORD=$(grep "^USER_TEMP_PASSWORD=" "$CREATE_USER_SCRIPT" | cut -d'"' -f2)
    fi
    
    if [ -z "$TEMP_PASSWORD" ]; then
        echo -e "${RED}❌ Mot de passe obligatoire (utilisez -p ou --password)${NC}"
        exit 1
    fi
fi

# Mode test: remplacer l'email de destination
if [ "$TEST_MODE" = true ]; then
    PERSONAL_EMAIL="heon@videotron.ca"
    echo -e "${YELLOW}🧪 Mode test activé - Email sera envoyé à: $PERSONAL_EMAIL${NC}"
fi

echo -e "${BLUE}Utilisateur: $USER_NAME ($USER_EMAIL)${NC}"
echo -e "${BLUE}Destinataire: $PERSONAL_EMAIL${NC}"

# Générer le contenu de l'email avec Python
EMAIL_CONTENT=$(generate_email_with_python "$USER_EMAIL" "$USER_NAME" "$FIRST_NAME" "$TEMP_PASSWORD" "$PERSONAL_EMAIL")
EMAIL_SUBJECT="Création de votre compte Microsoft 365 - Accès à l'application Chatbottez Legis QC"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la génération de l'email${NC}"
    exit 1
fi

# Mode simulation
if [ "$SIMULATE_MODE" = true ]; then
    echo -e "${YELLOW}🎭 Mode simulation - Aperçu de l'email:${NC}"
    echo "=============================================="
    echo "To: $PERSONAL_EMAIL"
    echo "Subject: $EMAIL_SUBJECT"
    echo "=============================================="
    echo "$EMAIL_CONTENT"
    echo "=============================================="
    echo -e "${GREEN}✅ Simulation terminée - Aucun email envoyé${NC}"
    exit 0
fi

SEND_STATUS=1
case "$EMAIL_TRANSPORT" in
  graph)
    TEMP_EMAIL_FILE=$(mktemp)
    printf "%s" "$EMAIL_CONTENT" > "$TEMP_EMAIL_FILE"
    send_email_with_graph "$PERSONAL_EMAIL" "$EMAIL_SUBJECT" "$TEMP_EMAIL_FILE"
    SEND_STATUS=$?
    rm -f "$TEMP_EMAIL_FILE"
    ;;
  local)
    send_email_fallback "$PERSONAL_EMAIL" "$EMAIL_SUBJECT" "$EMAIL_CONTENT"
    SEND_STATUS=$?
    ;;
  *)
    send_email_with_python "$PERSONAL_EMAIL" "$EMAIL_SUBJECT" "$EMAIL_CONTENT"
    SEND_STATUS=$?
    ;;
esac

if [ $SEND_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Processus terminé avec succès !${NC}"
    echo -e "${BLUE}📧 Email de bienvenue envoyé à: $PERSONAL_EMAIL${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  L'email n'a pas pu être envoyé automatiquement${NC}"
    echo -e "${BLUE}📄 Vérifiez le fichier généré dans ${SCRIPT_DIR}/ pour envoi manuel${NC}"
fi
