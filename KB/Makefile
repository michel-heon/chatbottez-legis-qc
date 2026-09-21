SHELL := /usr/bin/env bash

RCLONE ?= rclone
REMOTE_NAME ?= legisqc-sb
REMOTE ?= $(REMOTE_NAME):
REMOTE_PATH ?= 08-KB-LégisQuébec
MOUNT_NAME ?= legisqc-sb
MOUNT_POINT := $(CURDIR)/$(MOUNT_NAME)
SOURCE := $(REMOTE)$(REMOTE_PATH)
MOUNT_FLAGS ?= --read-only --vfs-cache-mode full --dir-cache-time 1m --poll-interval 1m
ONEDRIVE_USER ?= heon.michel@sb-01.cotechnoe.com
COTECHNOE_REMOTE_NAME ?= cotechnoe
COTECHNOE_REMOTE ?= $(COTECHNOE_REMOTE_NAME):
COTECHNOE_REMOTE_PATH ?= 08-KB-Copilot/01-KB-LégisQuébec
COTECHNOE_MOUNT_NAME ?= legisqc-cotechnoe
COTECHNOE_MOUNT_POINT := $(CURDIR)/$(COTECHNOE_MOUNT_NAME)
COTECHNOE_SOURCE := $(COTECHNOE_REMOTE)$(COTECHNOE_REMOTE_PATH)
COTECHNOE_ONEDRIVE_USER ?= heon@cotechnoe.net
COPY_FLAGS ?= --fast-list --server-side-across-configs --transfers 8 --checkers 16 --retries 5 --low-level-retries 20 --stats 30s --stats-one-line

.PHONY: help configure configure-sb configure-cotechnoe check check-cotechnoe check-copy copy-cotechnoe-to-sb verify-cotechnoe-to-sb mount mount-cotechnoe mount-all unmount unmount-cotechnoe unmount-all status status-cotechnoe status-all list list-cotechnoe
.DEFAULT_GOAL := help

help: ## Affiche les commandes disponibles
	@echo "make configure-sb        - Authentifie $(REMOTE) avec $(ONEDRIVE_USER)"
	@echo "make mount               - Monte $(SOURCE) dans $(MOUNT_POINT)"
	@echo "make unmount             - Démonte $(MOUNT_POINT)"
	@echo "make status              - Affiche l'état du montage sb-01"
	@echo "make list                - Liste le contenu distant sb-01"
	@echo "make configure-cotechnoe - Authentifie $(COTECHNOE_REMOTE) avec $(COTECHNOE_ONEDRIVE_USER)"
	@echo "make mount-cotechnoe     - Monte $(COTECHNOE_SOURCE) dans $(COTECHNOE_MOUNT_POINT)"
	@echo "make unmount-cotechnoe   - Démonte $(COTECHNOE_MOUNT_POINT)"
	@echo "make status-cotechnoe    - Affiche l'état du montage cotechnoe"
	@echo "make list-cotechnoe      - Liste le contenu distant cotechnoe"
	@echo "make copy-cotechnoe-to-sb - Copie la base cotechnoe vers sb-01"
	@echo "make verify-cotechnoe-to-sb - Vérifie les tailles après la copie"
	@echo "make mount-all           - Monte les deux bases"
	@echo "make unmount-all         - Démonte les deux bases"

configure: configure-sb ## Alias de configure-sb

configure-sb: ## Crée le remote OneDrive legisqc-sb et lance l'authentification OAuth
	@if $(RCLONE) listremotes | grep -Fxq "$(REMOTE)"; then \
		echo "Remote déjà configuré: $(REMOTE)"; \
	else \
		echo "Connectez-vous dans le navigateur avec le compte $(ONEDRIVE_USER)."; \
		$(RCLONE) config create "$(REMOTE_NAME)" onedrive --no-output; \
	fi

configure-cotechnoe: ## Crée le remote OneDrive cotechnoe et lance l'authentification OAuth
	@if $(RCLONE) listremotes | grep -Fxq "$(COTECHNOE_REMOTE)"; then \
		echo "Remote déjà configuré: $(COTECHNOE_REMOTE)"; \
	else \
		echo "Connectez-vous dans le navigateur avec le compte $(COTECHNOE_ONEDRIVE_USER)."; \
		$(RCLONE) config create "$(COTECHNOE_REMOTE_NAME)" onedrive --no-output; \
	fi

check: ## Vérifie rclone, FUSE et l'accès au dossier OneDrive
	@command -v "$(RCLONE)" > /dev/null || { echo "Erreur: rclone est introuvable."; exit 1; }
	@$(RCLONE) listremotes | grep -Fxq "$(REMOTE)" || { echo "Erreur: le remote rclone $(REMOTE) est introuvable."; exit 1; }
	@command -v fusermount3 > /dev/null || command -v fusermount > /dev/null || { echo "Erreur: FUSE est requis pour rclone mount."; exit 1; }
	@test -e /dev/fuse || { echo "Erreur: /dev/fuse est indisponible."; exit 1; }
	@$(RCLONE) lsd "$(SOURCE)" > /dev/null

check-cotechnoe: ## Vérifie rclone, FUSE et l'accès au dossier OneDrive cotechnoe
	@command -v "$(RCLONE)" > /dev/null || { echo "Erreur: rclone est introuvable."; exit 1; }
	@$(RCLONE) listremotes | grep -Fxq "$(COTECHNOE_REMOTE)" || { echo "Erreur: le remote rclone $(COTECHNOE_REMOTE) est introuvable."; exit 1; }
	@command -v fusermount3 > /dev/null || command -v fusermount > /dev/null || { echo "Erreur: FUSE est requis pour rclone mount."; exit 1; }
	@test -e /dev/fuse || { echo "Erreur: /dev/fuse est indisponible."; exit 1; }
	@$(RCLONE) lsd "$(COTECHNOE_SOURCE)" > /dev/null

check-copy: ## Vérifie l'accès aux deux dossiers OneDrive avant la copie
	@command -v "$(RCLONE)" > /dev/null || { echo "Erreur: rclone est introuvable."; exit 1; }
	@$(RCLONE) listremotes | grep -Fxq "$(REMOTE)" || { echo "Erreur: le remote rclone $(REMOTE) est introuvable."; exit 1; }
	@$(RCLONE) listremotes | grep -Fxq "$(COTECHNOE_REMOTE)" || { echo "Erreur: le remote rclone $(COTECHNOE_REMOTE) est introuvable."; exit 1; }
	@$(RCLONE) lsd "$(COTECHNOE_SOURCE)" > /dev/null
	@$(RCLONE) lsd "$(SOURCE)" > /dev/null

copy-cotechnoe-to-sb: check-copy ## Copie la base cotechnoe vers sb-01 sans supprimer de fichiers destination
	@$(RCLONE) copy "$(COTECHNOE_SOURCE)" "$(SOURCE)" $(COPY_FLAGS)

verify-cotechnoe-to-sb: check-copy ## Vérifie tailles et chemins après la copie
	@$(RCLONE) check "$(COTECHNOE_SOURCE)" "$(SOURCE)" --size-only --fast-list

mount: check ## Monte le dossier OneDrive en lecture seule dans KB/legisqc-sb
	@mkdir -p "$(MOUNT_POINT)"
	@if mountpoint -q "$(MOUNT_POINT)"; then \
		echo "Déjà monté: $(MOUNT_POINT)"; \
	else \
		$(RCLONE) mount "$(SOURCE)" "$(MOUNT_POINT)" $(MOUNT_FLAGS) --daemon; \
		echo "Monté: $(SOURCE) -> $(MOUNT_POINT)"; \
	fi

mount-cotechnoe: check-cotechnoe ## Monte le dossier OneDrive cotechnoe dans KB/legisqc-cotechnoe
	@mkdir -p "$(COTECHNOE_MOUNT_POINT)"
	@if mountpoint -q "$(COTECHNOE_MOUNT_POINT)"; then \
		echo "Déjà monté: $(COTECHNOE_MOUNT_POINT)"; \
	else \
		$(RCLONE) mount "$(COTECHNOE_SOURCE)" "$(COTECHNOE_MOUNT_POINT)" $(MOUNT_FLAGS) --daemon; \
		echo "Monté: $(COTECHNOE_SOURCE) -> $(COTECHNOE_MOUNT_POINT)"; \
	fi

mount-all: mount mount-cotechnoe ## Monte les deux dossiers OneDrive

unmount: ## Démonte KB/legisqc-sb
	@if mountpoint -q "$(MOUNT_POINT)"; then \
		if command -v fusermount3 > /dev/null; then fusermount3 -u "$(MOUNT_POINT)" || fusermount3 -uz "$(MOUNT_POINT)"; else fusermount -u "$(MOUNT_POINT)" || fusermount -uz "$(MOUNT_POINT)"; fi; \
		if mountpoint -q "$(MOUNT_POINT)"; then echo "Erreur: impossible de démonter $(MOUNT_POINT)."; exit 1; fi; \
		echo "Démonté: $(MOUNT_POINT)"; \
	else \
		echo "Non monté: $(MOUNT_POINT)"; \
	fi

unmount-cotechnoe: ## Démonte KB/legisqc-cotechnoe
	@if mountpoint -q "$(COTECHNOE_MOUNT_POINT)"; then \
		if command -v fusermount3 > /dev/null; then fusermount3 -u "$(COTECHNOE_MOUNT_POINT)" || fusermount3 -uz "$(COTECHNOE_MOUNT_POINT)"; else fusermount -u "$(COTECHNOE_MOUNT_POINT)" || fusermount -uz "$(COTECHNOE_MOUNT_POINT)"; fi; \
		if mountpoint -q "$(COTECHNOE_MOUNT_POINT)"; then echo "Erreur: impossible de démonter $(COTECHNOE_MOUNT_POINT)."; exit 1; fi; \
		echo "Démonté: $(COTECHNOE_MOUNT_POINT)"; \
	else \
		echo "Non monté: $(COTECHNOE_MOUNT_POINT)"; \
	fi

unmount-all: unmount-cotechnoe unmount ## Démonte les deux dossiers OneDrive

status: ## Affiche l'état du point de montage
	@if mountpoint -q "$(MOUNT_POINT)"; then \
		findmnt -T "$(MOUNT_POINT)"; \
	else \
		echo "Non monté: $(MOUNT_POINT)"; \
	fi

status-cotechnoe: ## Affiche l'état du point de montage cotechnoe
	@if mountpoint -q "$(COTECHNOE_MOUNT_POINT)"; then \
		findmnt -T "$(COTECHNOE_MOUNT_POINT)"; \
	else \
		echo "Non monté: $(COTECHNOE_MOUNT_POINT)"; \
	fi

status-all: status status-cotechnoe ## Affiche l'état des deux points de montage

list: check ## Liste le contenu de la racine OneDrive ciblée
	@$(RCLONE) lsf "$(SOURCE)"

list-cotechnoe: check-cotechnoe ## Liste le contenu de la racine OneDrive cotechnoe
	@$(RCLONE) lsf "$(COTECHNOE_SOURCE)"