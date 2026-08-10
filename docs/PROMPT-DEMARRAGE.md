# Prompt de démarrage — à coller dans Antigravity

Ce fichier contient les messages à copier-coller à l'agent. Le premier suffit
pour démarrer.

---

## 1. Message d'initialisation

> Tu reprends la maintenance de ce projet : **Partage des Frais – Lourdes**, une
> application de partage de frais **en production**, utilisée par de vraies
> familles pour de vrais montants.
>
> **Commence par lire, dans cet ordre :**
> 1. `AGENTS.md` — tes règles de travail et ton mandat de déploiement
> 2. `docs/ARCHITECTURE.md` — modèle de données et contrat front ↔ backend
> 3. `docs/ETAT-DES-LIEUX.md` — bugs confirmés et fragilités
> 4. `docs/ROADMAP.md` — améliorations envisagées (non décidées)
>
> **Puis mets en place la chaîne de déploiement, dont tu es responsable :**
> - Installe et configure `clasp` (`npm i -g @google/clasp`, `clasp login`)
> - Retrouve le Script ID avec `clasp list` (projet lié au Sheet « Lourdes »),
>   et crée `.clasp.json` à partir de `.clasp.json.example`
> - Récupère l'ID de déploiement existant avec `clasp deployments` — il devra
>   être réutilisé avec `clasp deploy -i` pour **conserver l'URL `/exec`**
> - Vérifie la synchronisation : `clasp pull && git diff`. Si le code en ligne
>   diffère du dépôt, **c'est la version en ligne qui fait foi** : commite-la.
> - Vérifie l'accès GitHub (`gh auth login` si nécessaire)
>
> **Ne modifie encore aucun code applicatif.** Quand tout est en place,
> fais-moi un rapport : état de la chaîne de déploiement, écarts éventuels
> entre le code en ligne et le dépôt, et ta compréhension des bugs B1 à B4.

---

## 2. Une fois la chaîne validée — première correction

> Corrige le bug **B2** (`docs/ETAT-DES-LIEUX.md`) : supprimer une famille
> laisse ses dépenses orphelines et **fausse le bilan**.
>
> Solution retenue : **R1.1 de la roadmap** — cascade avec notification.
> Avant validation, afficher le nombre et le total des dépenses concernées,
> puis marquer supprimées la ligne `FAM` **et** toutes ses lignes `DEP`.
>
> Attention : les `DEP` sont reliées à leur famille par le **nom**, pas par
> l'ID. Le front n'envoie aujourd'hui que l'`id`.
>
> Propose-moi ton plan **avant** de coder, puis déploie et vérifie dans le Sheet.

---

## 3. Rappels à ressortir si l'agent dérape

> Rappel : `clasp push` ne suffit pas. Sans `clasp deploy -i <ID>`, l'application
> continue d'utiliser l'ancienne version du script.

> Rappel : le mode `no-cors` fait que l'appli affiche « succès » même en cas
> d'échec d'écriture. La seule vérification valable est d'aller regarder le
> Google Sheet.

> Rappel : `index.html` est volontairement un fichier unique, sans build ni
> dépendance, pour rester éditable depuis l'interface GitHub. Ne pas introduire
> de framework ou de bundler.

> Rappel : le Sheet contient des données de production réelles (saison 2025).
> Ne rien y supprimer physiquement — le système utilise la suppression douce
> (horodatage en colonne H).
