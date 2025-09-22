#!/usr/bin/env python3
"""
Script pour incrémenter automatiquement la version patch dans manifest.json
Usage: python3 increment_version.py [manifest_path]
"""

import json
import sys
import os

def increment_version(manifest_path='appPackage/manifest.json'):
    """Incrémente la version patch dans le fichier manifest.json"""
    try:
        # Vérifier que le fichier existe
        if not os.path.exists(manifest_path):
            print(f"Erreur: Le fichier {manifest_path} n'existe pas")
            return False
            
        # Lire le manifest
        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Récupérer la version actuelle
        current_version = data.get('version', '1.0.0')
        print(f"Version actuelle: {current_version}")
        
        # Parser la version (format: x.y.z)
        version_parts = current_version.split('.')
        if len(version_parts) != 3:
            print(f"Erreur: Format de version invalide: {current_version}")
            return False
            
        # Incrémenter la version patch
        try:
            major = int(version_parts[0])
            minor = int(version_parts[1])
            patch = int(version_parts[2]) + 1
        except ValueError:
            print(f"Erreur: Impossible de parser les numéros de version: {current_version}")
            return False
            
        # Créer la nouvelle version
        new_version = f"{major}.{minor}.{patch}"
        data['version'] = new_version
        
        # Écrire le fichier mis à jour
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        
        print(f"Nouvelle version: {new_version}")
        print(f"Version mise à jour: {current_version} -> {new_version}")
        return True
        
    except Exception as e:
        print(f"Erreur lors de l'incrémentation de version: {e}")
        return False

if __name__ == "__main__":
    manifest_path = sys.argv[1] if len(sys.argv) > 1 else 'appPackage/manifest.json'
    success = increment_version(manifest_path)
    sys.exit(0 if success else 1)
