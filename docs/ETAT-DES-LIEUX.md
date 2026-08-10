# État des lieux

Audit réalisé le 10/08/2026 à partir du code réellement déployé (`index.html`
en ligne + `Code.gs` récupéré depuis l'éditeur Apps Script) et de l'inspection
des 4 onglets du Google Sheet.

**À lire avant toute modification.**

---

## ✅ Ce qui fonctionne

| Fonction | Statut |
|---|---|
| Ajout d'une famille (avec blocage des doublons de nom) | OK |
| Ajout d'une dépense | OK |
| Répartition au prorata + virements optimisés | OK |
| Actions destructrices réservées à l'admin | OK — rendu conditionnel dans le DOM |
| Navigation fluide (cache local, pas d'overlay à chaque onglet) | OK |
| Mode hors ligne **en lecture** (cache `localStorage`) | OK |
| Suppression d'une famille / d'une dépense | OK côté serveur (`action:'delete'`) |
| Modification du nombre de membres | OK côté serveur (`action:'update'`) |
| Interface mobile (onglets en bas, safe-area, anti-zoom iOS) | OK |

Les deux bugs historiques (croix visible hors admin ; latence de 2–3 s à chaque
changement d'onglet) **ont été corrigés** dans la version en production.

---

## 🐛 Bugs confirmés

### B1 — « Nouvelle année » et « Tout effacer » ne font rien côté serveur
**Gravité : moyenne — trompeur, mais sans destruction de données.**

Le front envoie `action: 'reset_year'` et `action: 'clear_all'`, mais `doPost`
ne gère que `add`, `delete` et `update`. Ces actions tombent dans le vide : le
script ne modifie rien et renvoie malgré tout `{success: true}`.

Effet observable : l'affichage se vide, puis **tout réapparaît à la prochaine
synchronisation** (changement d'onglet, retour sur l'appli…).

*Effet secondaire positif : ces boutons ne peuvent pas détruire les données.*

### B2 — Supprimer une famille qui a des dépenses fausse le bilan
**Gravité : élevée — corrompt un résultat affiché.**

La suppression ne marque que la ligne `FAM`. Les lignes `DEP` correspondantes
(reliées par le **nom**) restent actives dans le Sheet. Après resync :
- ces dépenses réapparaissent, affichées « Famille inconnue » ;
- elles sont **toujours comptées dans le total** ;
- mais **plus créditées à personne**.

→ Le coût par personne est surévalué et le bilan devient faux.

### B3 — Écriture sans confirmation (`mode: 'no-cors'`)
**Gravité : élevée — perte de données silencieuse possible.**

Le POST est envoyé en `no-cors`, donc la réponse est opaque : impossible de
savoir si l'écriture a abouti. L'appli affiche « ajouté avec succès » dans tous
les cas, y compris en cas d'échec réseau ou d'erreur serveur.

Cas concret : une saisie faite avec une mauvaise connexion (magasin, parking) est
**perdue sans aucun signal**.

### B4 — Le clignotement après ajout
**Gravité : faible — cosmétique, mais anxiogène.**

La resync 1 s après l'ajout **remplace intégralement** l'état local par le CSV.
Or l'export CSV de Google a quelques secondes de latence. L'élément qui vient
d'être ajouté peut donc disparaître de l'écran puis réapparaître.

---

## ⚠️ Fragilités structurelles

### F1 — Les dépenses sont liées à leur famille par le NOM
Racine du bug B2. Renommer une famille orphelinerait toutes ses dépenses
passées. Les doublons de nom sont interdits côté appli, ce qui rend le système
viable — mais fragile.
→ *Correctif de fond : ajouter une colonne `Famille_ID` sur les lignes `DEP`.*

### F2 — Ordre de lecture des lignes
Le parsing associe une `DEP` à une famille **déjà rencontrée plus haut** dans le
CSV. Une ligne `DEP` insérée manuellement **avant** sa ligne `FAM` ne serait pas
reliée. En usage normal les familles sont créées d'abord — mais attention lors
d'imports ou de tris manuels du Sheet.

### F3 — Pas de colonne `Année` dans `Data`
Toute dépense lue est étiquetée « année courante » à la volée. Aucun historique
multi-années n'est donc possible en l'état.

### F4 — Format de date `jj/mm/aaaa`
Le tri des dépenses bricole avec `split('/').reverse().join('')`. Cela
fonctionne à l'intérieur d'une même année, mais casserait sur un historique
multi-années. *Format ISO (`aaaa-mm-jj`) recommandé.*

### F5 — Saisie simultanée non gérée
Plusieurs personnes saisissant en même temps peuvent voir leurs états
s'écraser mutuellement (resync qui remplace tout + absence de confirmation).
Risque réel lors d'un week-end à 7 familles. *Non observé formellement à ce
jour — à confirmer.*

### F6 — Code admin `333` en clair
Sécurité de convivialité, pas de sécurité réelle. Acceptable pour un usage
familial. **Corollaire important : le Sheet est public en lecture — n'y stocker
aucune donnée sensible.**

---

## 🧹 Dette

### D1 — Trois onglets morts dans le Sheet
`Familles`, `Dépenses` et `Paramètres` sont des vestiges de la v1. Ils
contiennent uniquement des données de test (`dsqfq`, `dsqfdqfq`…) au format ISO,
et **ne sont jamais lus par l'application**. À archiver puis supprimer, pour
éviter d'éditer le mauvais onglet par erreur.

### D2 — Code mort dans `index.html`
La classe CSS `.family-card[data-admin="true"]` fait doublon avec le rendu
conditionnel JS (les deux mécanismes protègent la même chose). Le bloc `.tab.active`
est déclaré deux fois à l'identique.

---

## Matrice de priorité

| # | Sujet | Gravité | Effort | Priorité |
|---|---|---|---|---|
| B2 | Cascade suppression famille → dépenses | Élevée | Faible | **1** |
| B3 | Confirmation d'écriture (sortie du `no-cors`) | Élevée | Moyen | **2** |
| F1 | Colonne `Famille_ID` sur les `DEP` | Élevée | Moyen | **3** |
| B4 | Clignotement post-ajout | Faible | Faible | 4 |
| B1 | `reset_year` / `clear_all` | Moyenne | Faible | 5 |
| D1 | Nettoyage des onglets morts | Nulle | Trivial | 6 |
