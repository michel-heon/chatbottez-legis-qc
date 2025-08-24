#!/bin/bash

# Validation des conventions simples
# Vérifie les 4 règles d'emplacement des fichiers

set -euo pipefail

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validation des conventions simples..."
echo ""

# Variables de comptage
ERRORS=0
WARNINGS=0

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ ERREUR:${NC} $1"
    ((ERRORS++))
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅${NC} $1"
}

# 1. Vérifier que les scripts sont dans scripts/
echo "📁 Vérification: Scripts dans scripts/..."
if [ -d "scripts" ]; then
    script_count=$(find scripts -name "*.sh" -type f | wc -l)
    success "Scripts trouvés dans scripts/: $script_count fichiers"
else
    error "Répertoire scripts/ manquant"
fi

# 2. Vérifier que les docs sont dans docs/
echo "� Vérification: Documents dans docs/..."
if [ -d "docs" ]; then
    doc_count=$(find docs -name "*.md" -type f | wc -l)
    success "Documents trouvés dans docs/: $doc_count fichiers"
else
    error "Répertoire docs/ manquant"
fi

# 3. Vérifier que les données sont dans src/indexers/data/
echo "� Vérification: Données dans src/indexers/data/..."
if [ -d "src/indexers/data" ]; then
    data_count=$(find src/indexers/data -type f | wc -l)
    success "Fichiers de données trouvés: $data_count fichiers"
else
    error "Répertoire src/indexers/data/ manquant"
fi

# 4. Vérifier que README.md est à la racine
echo "🏠 Vérification: README.md à la racine..."
if [ -f "README.md" ]; then
    success "README.md trouvé à la racine"
else
    error "README.md manquant à la racine"
fi

echo ""

# Résumé
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Toutes les conventions sont respectées !${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) trouvée(s)${NC}"
    echo ""
    echo "Conventions simples à respecter:"
    echo "📚 Documents projet (*.md) → ./docs/"
    echo "⚙️  Scripts (*.sh) → ./scripts/"
    echo "📄 Données index → ./src/indexers/data/"
    echo "🏠 README.md → ./ (racine)"
    exit 1
fi
