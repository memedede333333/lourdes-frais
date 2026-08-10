# ⛪ Partage des Frais – Lourdes

Application web de partage des frais pour le pèlerinage familial à Lourdes.
Chaque famille saisit ses dépenses ; l'application répartit le coût **au prorata
du nombre de personnes** et calcule les **virements optimisés** (nombre minimal
de transactions).

En production depuis 2025, utilisée sur une saison complète.

---

## Démarrage rapide

| | |
|---|---|
| 🌐 **Application** | https://memedede333.github.io/lourdes-frais/ |
| 📊 **Google Sheet** | https://docs.google.com/spreadsheets/d/1jKYQJXIdB-b5MjvSkiM5QVMqNNEJUjSGe-1sCZvEkEo/ |
| 💻 **Dépôt** | https://github.com/memedede333/lourdes-frais |
| 🔑 **Code admin** | `333` |

Le projet est **sans build, sans dépendance, sans framework** : un seul fichier
`index.html` (HTML + CSS + JS) servi par GitHub Pages, plus un Google Apps
Script pour l'écriture dans le Sheet.

---

## Structure du dépôt

```
.
├── index.html               ← L'application (fichier unique, servi par GitHub Pages)
├── apps-script/
│   ├── Code.gs              ← Backend Google Apps Script (SOURCE DE VÉRITÉ)
│   └── appsscript.json      ← Manifeste (requis par clasp)
├── scripts/
│   └── deploy.sh            ← Déploiement GitHub + Apps Script en une commande
├── docs/
│   ├── ARCHITECTURE.md      ← Comment ça marche (flux, données, sync)
│   ├── ETAT-DES-LIEUX.md    ← Ce qui marche, ce qui ne marche pas, bugs connus
│   ├── DEPLOIEMENT.md       ← Setup GitHub + clasp, procédures
│   ├── ROADMAP.md           ← Améliorations à venir, priorisées
│   └── PROMPT-DEMARRAGE.md  ← Messages à coller dans Antigravity
├── AGENTS.md                ← Instructions pour l'agent IA (Antigravity)
├── .clasp.json.example      ← Modèle de config clasp (à copier et compléter)
└── .gitignore
```

---

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — modèle de données, flux de
  synchronisation, contrat front ↔ backend. **À lire en premier.**
- **[docs/ETAT-DES-LIEUX.md](docs/ETAT-DES-LIEUX.md)** — état réel du système,
  bugs confirmés et fragilités. **À lire avant toute modification.**
- **[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)** — comment publier sur GitHub
  Pages et sur Apps Script.
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — améliorations envisagées, priorisées.
- **[docs/PROMPT-DEMARRAGE.md](docs/PROMPT-DEMARRAGE.md)** — prompts prêts à
  coller pour lancer l'agent IA.

> 🤖 **L'agent IA prend en charge tous les déploiements** (GitHub + Apps Script
> via `clasp`). Voir le mandat dans [AGENTS.md](AGENTS.md).

---

## En deux mots

1. **Lecture** : l'appli lit l'onglet `Data` du Sheet via son export **CSV public**.
2. **Écriture** : elle envoie un `POST` JSON au **Google Apps Script**.
3. **Cache** : les données sont conservées en `localStorage` pour un affichage
   instantané et un mode hors ligne en lecture.

⚠️ Le Sheet contient 4 onglets, mais **seul `Data` est utilisé**. Les onglets
`Familles`, `Dépenses` et `Paramètres` sont des vestiges d'une ancienne version
et ne contiennent que des données de test.
