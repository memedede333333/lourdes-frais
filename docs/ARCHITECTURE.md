# Architecture

## Vue d'ensemble

```
┌─────────────────────┐
│   index.html        │  Application mono-fichier (GitHub Pages)
│   HTML + CSS + JS   │  Aucune dépendance, aucun build
└──────┬──────────┬───┘
       │          │
 LECTURE      ÉCRITURE
 (CSV, GET)   (POST JSON, no-cors)
       │          │
       ▼          ▼
┌──────────────────────────────┐
│  Google Sheet — onglet Data  │◄── Apps Script (doPost)
└──────────────────────────────┘
```

Deux canaux **distincts et asymétriques** :

- **Lecture** : export CSV public de l'onglet `Data`
  `https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Data`
  Rapide, aucun round-trip Apps Script.
- **Écriture** : `POST` JSON vers l'Apps Script, en `mode: 'no-cors'`.
  ⚠️ Conséquence majeure : **le client ne peut pas lire la réponse**. Il ne sait
  donc jamais si l'écriture a réussi. Voir ETAT-DES-LIEUX.md.

---

## Identifiants

| Constante | Valeur | Où |
|---|---|---|
| `SHEET_ID` | `1jKYQJXIdB-b5MjvSkiM5QVMqNNEJUjSGe-1sCZvEkEo` | `index.html` |
| `SCRIPT_URL` | `https://script.google.com/macros/s/AKfycbwUrAaGSxspiC4OL_QFitb9-74eM1W9ywAzZMYNfP0sMAUDb2GHd6-2agmcobaybPABKg/exec` | `index.html` |
| Clé de cache | `lourdes_data` | `localStorage` |
| Code admin | `333` | en clair dans `index.html` |

> ⚠️ `SCRIPT_URL` contient l'**ID de déploiement**, qui n'est PAS le **Script ID**
> nécessaire à `clasp`. Voir DEPLOIEMENT.md.

---

## Modèle de données — onglet `Data`

Une **seule** feuille, nommée exactement `Data`. Ligne 1 = en-têtes (ignorée à la
lecture). 8 colonnes :

| Col | En-tête | Ligne `FAM` (famille) | Ligne `DEP` (dépense) |
|-----|---------------|------------------------------|--------------------------------|
| A | `Type` | `FAM` | `DEP` |
| B | `ID` | timestamp (`Date.now()`) | timestamp (`Date.now()`) |
| C | `Nom` | nom de la famille | **nom de la famille payeuse** |
| D | `Membres` | nombre de personnes | *(vide)* |
| E | `Montant` | *(vide)* | montant en € |
| F | `Description` | *(vide)* | libellé de la dépense |
| G | `Date` | `jj/mm/aaaa` | `jj/mm/aaaa` |
| H | `Supprimé` | horodatage si supprimé | horodatage si supprimé |

### Deux conventions structurantes

**1. Suppression douce.** On ne supprime jamais une ligne : on écrit un
horodatage en colonne H. Toute ligne dont H est non vide est ignorée à la
lecture. La fonction `cleanupDeleted()` (Apps Script) permet de purger
définitivement, à lancer manuellement.

**2. Les dépenses référencent leur famille par le NOM, pas par l'ID.**
La colonne C d'une ligne `DEP` contient le *nom* de la famille payeuse. Le
front réassocie ensuite `familyId` en cherchant la famille de même nom.
C'est la fragilité structurelle principale du système — voir ETAT-DES-LIEUX.md.
Les doublons de nom sont donc interdits côté application.

### Exemple réel

```
Type | ID            | Nom             | Membres | Montant | Description | Date       | Supprimé
FAM  | 1754827517071 | DESJARDINS      | 5       |         |             | 10/08/2025 |
DEP  | 1754827595335 | DESJARDINS      |         | 293     | LIDL        | 10/08/2025 |
DEP  | 1754827639314 | DESJARDINS      |         | 10      | Concombre   | 10/08/2025 | 11/08/2025 13:06
FAM  | 1754831414930 | Steph-Thib DLH  | 8       |         |             | 10/08/2025 |
```

---

## Contrat front ↔ backend

Le front (`saveToSheets`) envoie un POST JSON. Le backend (`doPost`) dispatche
sur `data.action` :

| Action front | Payload envoyé | Traitement backend |
|---|---|---|
| `family` | `{action:'add', type:'FAM', id, name, members}` | `appendRow` FAM |
| `expense` | `{action:'add', type:'DEP', id, familyName, amount, description, date}` | `appendRow` DEP |
| `delete_family` | `{action:'delete', id}` | horodate col. H de la ligne ayant cet ID |
| `delete_expense` | `{action:'delete', id}` | idem |
| `update_family` | `{action:'update', type:'FAM', id, members}` | met à jour col. D |
| `reset_year` | `{action:'reset_year', year}` | ❌ **non implémenté** |
| `clear_all` | `{action:'clear_all'}` | ❌ **non implémenté** |

---

## Cycle de synchronisation

**Au chargement**
1. Lecture du cache `localStorage` → affichage immédiat.
2. `syncFromSheet()` : fetch CSV → parsing → **remplacement intégral** de l'état.

**Déclencheurs de sync** : changement d'onglet, `visibilitychange`, `focus`
fenêtre, bouton « 🔄 Synchroniser », et 1 s après chaque ajout.
Pas de polling périodique (choix délibéré).

**À l'ajout (mise à jour optimiste)**
1. Ajout dans l'état local + cache + rafraîchissement UI (instantané).
2. `POST` vers Apps Script (`no-cors`, sans confirmation possible).
3. Message de succès affiché (**qu'il ait réussi ou non**).
4. Resync après 1 s → l'état local est **écrasé** par le CSV.

⚠️ Ce point 4 combiné au retard de propagation du CSV Google est la cause du
« clignotement » et du risque de perte de saisie. Voir ETAT-DES-LIEUX.md.

---

## Calcul du bilan

```
totalPersonnes  = Σ (membres de chaque famille)
totalDépenses   = Σ (montants de l'année courante)
coûtParPersonne = totalDépenses / totalPersonnes

Pour chaque famille :
  aPayé   = Σ de ses dépenses
  doitPayer = coûtParPersonne × sesMembres
  solde   = aPayé − doitPayer     (positif = créancier)
```

`optimizeTransfers()` apparie ensuite créanciers et débiteurs (tri décroissant /
croissant, appariement glouton) pour minimiser le nombre de virements. Tolérance
de 0,01 € pour absorber les arrondis.

---

## Interface

Mobile-first : barre d'onglets fixée en bas (style app native), `safe-area-inset`
iOS, `font-size: 16px` sur les inputs pour empêcher le zoom automatique iOS.
Le panneau admin est masqué derrière une icône ⚙️ discrète.

Trois onglets : **Familles**, **Dépenses**, **Bilan**. Les actions
destructrices (croix de suppression, bouton Modifier, corbeille sur une dépense)
ne sont **rendues dans le DOM que si `appState.isAdmin === true`**.
