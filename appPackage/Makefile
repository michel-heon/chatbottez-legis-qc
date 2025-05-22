# Nom du fichier PNG à vérifier
SHELL          := /usr/bin/env bash
# Fichiers d'entrée et de sortie
INPUT := balance-logo.png
OUTLINE := outline.png
COLOR := color.png

# Vérifie si ImageMagick est installé
check_imagemagick:
	@if ! command -v convert &> /dev/null; then \
		echo "ImageMagick n'est pas installé. Veuillez l'installer avec 'sudo apt install imagemagick'."; \
		exit 1; \
	fi
all: convert_image generate_outline

# convertir l'image en INPUT en image de 192x192
convert_image: check_imagemagick
	@echo "Conversion de $(INPUT) en image de 192x192..."
	@convert $(INPUT) -resize 192x192 $(COLOR)
	@convert $(INPUT) -resize 140X140 -gravity center -background white -extent 192x192 $(COLOR)
	@echo "Fichier $(INPUT) converti avec succès."

# Génère l'icône outline.png avec détection de contours
generate_outline: check_imagemagick
	@echo "Génération de $(OUTLINE) à partir de $(COLOR) avec détection de contours..."
	@convert $(COLOR) \
	    -gravity center -crop 130x130+0+0 +repage \
	    -reverse -opaque "#d4af37" \
	    -colorspace Gray \
	    -resize 32x32 \
	    -alpha set -fuzz 20% -transparent black \
	    -background white -flatten \
	    $(OUTLINE)
	@echo "Fichier $(OUTLINE) généré avec succès."

#	convert $(COLOR) -gravity center -crop 140x140+0+0  -fuzz 7% -fill white -opaque "#d4af37" -fill none -draw "color 0,0 floodfill" -transparent white -colorspace Gray -resize 32x32 -alpha set $(OUTLINE)

# -resize 32x32 -negate -colorspace Gray   -transparent black
# Vérifie la transparence et les dimensions de outline.png
check_outline: check_imagemagick
	@echo "Vérification de la transparence et des dimensions de $(OUTLINE)..."
	@identify -verbose $(OUTLINE) | grep -E "Geometry|Alpha"

# Nettoie les fichiers intermédiaires
clean:
	@rm -f gray_image.png edge_image.png negated_image.png resized_image.png
	@echo "Fichiers intermédiaires supprimés."

.PHONY: check_imagemagick generate_outline check_outline clean

