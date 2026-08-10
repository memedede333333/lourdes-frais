# Instructions pour l'agent

> Fichier de contexte destiné à l'assistant IA de l'IDE. Selon l'outil, il peut
> devoir être renommé (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`…) ou dupliqué.

## Le projet en une phrase

Application de partage de frais pour un pèlerinage familial à Lourdes : un
`index.html` unique servi par GitHub Pages, adossé à un Google Sheet via un
Google Apps Script.

**En production. Utilisée par de vraies familles pour de vrais montants.**
Une régression a un coût réel : des comptes faux entre proches.

---

## À lire avant toute modification

1. `docs/ARCHITECTURE.md` — modèle de données et contrat front ↔ backend
2. `docs/ETAT-DES-LIEUX.md` — bugs confirmés et fragilités (**impératif**)
3. `docs/ROADMAP.md` — ce qui est envisagé, et ce qui ne l'est pas encore

---

## Règles impératives

### Ne pas casser le contrat de données
L'onglet `Data` contient des **données de production réelles** (saison 2025).
Les 8 colonnes et leur ordre sont figés :
`Type | ID | Nom | Membres | Montant | Description | Date | Supprimé`

Tout changement de schéma exige un plan de migration des lignes existantes.

### Ne jamais supprimer physiquement une ligne
Le système repose sur la **suppression douce** : on horodate la colonne H.
`cleanupDeleted()` existe pour la purge, elle se lance manuellement et
uniquement de façon délibérée.

### `Code.gs` est la source de vérité
`apps-script/Code.gs` est le code **réellement déployé**, récupéré depuis
l'éditeur. Ne pas le « reconstruire » ni le « nettoyer » spontanément. Si le
code en ligne diverge, c'est **la version en ligne qui fait foi** (`clasp pull`).

### Fichier unique = choix assumé
`index.html` contient HTML + CSS + JS, sans build ni dépendance. C'est
**délibéré** : n'importe qui peut l'éditer depuis l'interface GitHub, sans
toolchain. Ne pas introduire de framework, de bundler ou de découpage sans
validation explicite.

### Mobile d'abord
L'usage réel : smartphone, debout dans un magasin, réseau incertain. Toute
proposition doit être évaluée sous cet angle avant l'esthétique desktop.

### Ne rien mettre de sensible
Le Google Sheet est **public en lecture**. Aucune donnée bancaire ou
personnelle sensible ne doit y être stockée. Le code admin (`333`) est de la
convivialité, pas de la sécurité.

---

## Mandat : tu es responsable des déploiements

L'agent prend en charge **l'intégralité de la chaîne de publication**, sur les
deux cibles. L'utilisateur ne fait ni `git push` ni `clasp` à la main.

### Mise en place (une fois)

```bash
npm install -g @google/clasp
clasp login          # ouvre le navigateur — action utilisateur requise
clasp list           # ← retrouve le Script ID sans intervention manuelle
```

`clasp list` affiche les projets Apps Script du compte avec leur Script ID :
repérer celui du Sheet « Lourdes » et l'écrire dans `.clasp.json`
(`cp .clasp.json.example .clasp.json`). Inutile d'aller le chercher dans
l'éditeur web.

Prérequis à faire valider par l'utilisateur s'ils bloquent :
- `clasp login` → consentement OAuth dans le navigateur
- Google Apps Script API à activer sur https://script.google.com/home/usersettings
- authentification GitHub (`gh auth login`)

### Avant la première modification

```bash
clasp pull && git diff
```

Si `clasp pull` rapporte des différences, **la version en ligne fait foi** :
commiter ce qu'elle rapporte avant toute autre chose. Ne jamais écraser le code
en ligne avec la copie du dépôt sans avoir vérifié ce point.

### À chaque livraison

```bash
./scripts/deploy.sh "Message de commit"
```

ou, en manuel :

```bash
git add -A && git commit -m "…" && git push          # site
clasp push --force                                    # code du script
clasp deploy -i "$CLASP_DEPLOYMENT_ID" -d "…"         # republication
```

🚨 **`clasp push` seul ne suffit jamais.** Sans `clasp deploy`, l'URL `/exec`
continue de servir l'ancienne version et l'application reste inchangée.
Et **toujours avec `-i`** : sans lui, clasp crée une nouvelle URL, qu'il
faudrait alors reporter dans `SCRIPT_URL` (`index.html`) puis repousser sur
GitHub. Récupérer l'ID à réutiliser avec `clasp deployments`, puis
`export CLASP_DEPLOYMENT_ID=<ID>`.

### Après chaque déploiement

Vérifier, puis **rendre compte** : commit poussé, script republié, et résultat
du contrôle dans le Sheet (`docs/DEPLOIEMENT.md` § C). Ne jamais annoncer
« déployé » sans avoir republié le déploiement Apps Script.

### Limites à respecter

- Ne pas modifier le contenu du Google Sheet (données de production réelles),
  sauf pour supprimer une ligne de test que l'agent a lui-même créée.
- Ne pas lancer `cleanupDeleted()` : purge définitive, décision de
  l'utilisateur uniquement.
- Ne pas créer de nouveau déploiement Apps Script sans validation explicite.
- Ne pas toucher aux onglets `Familles`, `Dépenses`, `Paramètres` sans accord.

---

## Pièges spécifiques à ce projet

| Piège | Conséquence |
|---|---|
| `clasp push` sans `clasp deploy -i` | Le code est envoyé mais **l'appli continue d'utiliser l'ancienne version** |
| `clasp deploy` **sans** `-i` | Crée une **nouvelle URL** → il faut mettre à jour `SCRIPT_URL` dans `index.html` |
| Faire confiance au message « ajouté avec succès » | Le mode `no-cors` masque les échecs (bug B3). **Vérifier dans le Sheet.** |
| Supposer que les `DEP` référencent un `familyId` | Elles référencent le **nom** de la famille (fragilité F1) |
| Modifier les onglets `Familles`/`Dépenses`/`Paramètres` | Onglets morts, jamais lus. Seul `Data` compte. |
| Ajouter `localStorage` dans un artifact de démo | Le cache réel utilise la clé `lourdes_data` — ne pas la collisionner |

---

## Vérification obligatoire après changement

La seule preuve qu'une écriture fonctionne est **l'inspection directe du Google
Sheet** (`docs/DEPLOIEMENT.md` § C). Ne jamais conclure « ça marche » à partir
du seul message affiché par l'interface.

---

## Style attendu

- Français pour l'interface, les commentaires et les commits.
- Conserver le ton du projet (ton marial discret : ⛪ 🙏, bleu et blanc).
- Modifications **minimales et ciblées** : pas de réécriture globale non
  demandée, pas de reformatage massif qui rendrait les diffs illisibles.
