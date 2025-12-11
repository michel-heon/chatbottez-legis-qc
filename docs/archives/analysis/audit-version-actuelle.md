# AUDIT VERSION ACTUELLE - M365 Agents Toolkit

## Analyse version courante (Septembre 2025)

### Dépendances actuelles
- `@microsoft/teams-ai`: ^1.5.3
- `botbuilder`: ^4.23.1
- Node.js: 18 || 20 || 22
- Schema Teams: v1.19

### Structure de fichiers actuelle
```
/
├── src/
│   ├── index.js (point d'entrée)
│   ├── config.js (configuration)
│   ├── adapter.js (Bot adapter)
│   └── app/
│       ├── app.js (logique principale)
│       ├── azureAISearchDataSource.js
│       └── customSayCommand.js
├── appPackage/
│   ├── manifest.json (v1.19, app v1.0.13)
│   ├── color.png
│   └── outline.png
├── m365agents.yml
├── m365agents.local.yml
├── m365agents.playground.yml
├── src/
│   ├── config.ts
│   ├── index.ts
│   └── app/
└── env/
    ├── .env.template
    ├── .env.dev
    ├── .env.prod
    ├── .env.cotechnoe
    └── .env.playground
```

### Architecture personnalisée
1. **Key Vault Integration** - Architecture complète avec 5 vaults
2. **Azure AI Search** - Configuration RAG avec prompts personnalisés
3. **Custom Commands** - customSayCommand.js
4. **Environment Management** - Scripts sophistiqués
5. **Security Layer** - Validation et preprocessing

### Points d'obsolescence potentiels
- Structure des fichiers de configuration
- Format des scripts de déploiement
- API Teams AI Library (possibles breaking changes)
- Schema manifest Teams (nouvelles versions disponibles)
- Architecture de sécurité (nouvelles pratiques)
