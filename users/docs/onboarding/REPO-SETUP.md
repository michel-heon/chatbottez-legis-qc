# Préparation du dépôt `chatbottez-users-onboarding`

Ce guide explique comment extraire l'outillage d'onboarding M365 présent dans ce monorepo pour créer un dépôt dédié nommé **`chatbottez-users-onboarding`**.

## 1. Arborescence recommandée

```
chatbottez-users-onboarding/
├── Makefile                 # Copie de users/Makefile
├── scripts/                 # Scripts bash et python
├── powershell/              # Modules et scripts PowerShell
├── templates/               # Modèles HTML ou autres assets
├── config/                  # Fichiers .template et exemples d'environnement
├── docs/                    # Documentation (docs/onboarding/)
└── tools/                   # Scripts auxiliaires (optionnel)
```

La configuration actuelle est déjà structurée pour faciliter ce découpage :

- `users/` contient tous les scripts exécutables et le `Makefile`.
- `docs/onboarding/` regroupe la documentation fonctionnelle et technique.

## 2. Étapes de migration

1. **Créer un nouveau dépôt local**
   ```bash
   mkdir chatbottez-users-onboarding
   cd chatbottez-users-onboarding
   git init
   ```

2. **Copier les fichiers essentiels**
   ```bash
   # Depuis la racine du monorepo actuel
   rsync -av users/ chatbottez-users-onboarding/ --exclude 'venv' --exclude '.env.user-account'
   rsync -av docs/onboarding/ chatbottez-users-onboarding/docs/
   ```

3. **Réorganiser les sous-dossiers (optionnel)**
   - Déplacer les scripts bash vers `scripts/`
   - Déplacer les scripts PowerShell vers `powershell/`
   - Déplacer `EMAIL_TEMPLATE.html` vers `templates/`
   - Déplacer `smtp.env.template` et `.env.user-account.template` vers `config/`
   - Mettre à jour les chemins dans le `Makefile` selon la nouvelle arborescence

4. **Nettoyer les fichiers locaux**
   - Supprimer `venv/`, `__pycache__/` et autres caches éventuels
   - Ne versionner que les fichiers `.template`

5. **Ajouter un README global**
   - Copier `docs/onboarding/README.md` à la racine ou créer un `README.md` synthétique pointant vers la documentation complète.

6. **Configurer `.gitignore`**
   ```gitignore
   .env
   .env.*
   .smtp.env*
   .env.user-account*
   venv/
   *.pyc
   email-generated-*.txt
   ```

7. **Valider le workflow**
   ```bash
   make help
   make user-create USER_EMAIL=demo.user@cotechnoe.com
   make user-license-assign USER_EMAIL=demo.user@cotechnoe.com
   make email-forward-enable
   make email-send USER_EMAIL=demo.user@cotechnoe.com PASSWORD='Temp123!'
   ```

8. **Premier commit et push**
   ```bash
   git status
   git add .
   git commit -m "feat: initial import of onboarding toolkit"
   git remote add origin git@github.com:YOUR-ORG/chatbottez-users-onboarding.git
   git push -u origin main
   ```

## 3. Points d'attention

- **Secrets** : ne versionnez jamais `.env.user-account` ni `.smtp.env`. Utilisez les fichiers `.template` comme référence.
- **Permissions Azure** : s'assurer que l'utilisateur qui exécute les scripts dispose des rôles nécessaires (Exchange Admin, User Admin).
- **Consistance des noms** : les commandes `make` ont été harmonisées (`user-create`, `user-license-assign`, `email-forward-enable`, `email-send`). Les documents s'y réfèrent déjà.

## 4. Checklist finale

- [ ] Documentation déplacée dans `docs/`
- [ ] Scripts temporaires supprimés
- [ ] `.gitignore` mis à jour
- [ ] Tests principaux exécutés (`make help`, `make email-simulate`)
- [ ] Dépôt initialisé avec l'historique propre

Une fois ces étapes réalisées, le dépôt `chatbottez-users-onboarding` est prêt à être partagé avec l'équipe. EOF
