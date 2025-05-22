###################################################################
# Nom du Script  : Makefile - Archivage du projet chatbottez-legis-qc
# Description    : Ce Makefile crée une archive tar.gz du projet en
#                  excluant les fichiers et répertoires inutiles.
# Auteur         : Michel Héon PhD
# Droits d'auteur: Cotechnoe inc. (c) 2025
###################################################################

ARCHIVE_NAME := ../chatbottez-legis-qc.tar.gz

archive:
	tar \
	  --exclude='./.git' \
	  --exclude='./node_modules' \
	  --exclude='./target' \
	  --exclude='./devTools' \
	  --exclude='*.zip' \
	  --exclude='*.gz' \
	  --exclude='*.png' \
	  -czvf $(ARCHIVE_NAME) .
	cp $(ARCHIVE_NAME) .

clean:
	rm -f $(ARCHIVE_NAME)
