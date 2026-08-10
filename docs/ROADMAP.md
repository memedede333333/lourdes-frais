# Roadmap

Idées retenues lors des échanges de conception (10/08/2026). **Rien ici n'est
encore décidé ni implémenté** — c'est un réservoir d'améliorations à trancher.

---

## 🔴 Priorité 1 — Fiabilité des données

### R1.1 — Cascade à la suppression d'une famille
Corrige le bug B2. Décision de conception retenue : **cascade + notification**,
plutôt qu'un blocage.

Avant validation, afficher :
> « La famille BARTET a 3 dépenses (total 194 €). Supprimer la famille **et**
> ses dépenses ? »

Si confirmé : marquer supprimées la ligne `FAM` **et** toutes ses `DEP`.

⚠️ Aujourd'hui le front n'envoie que l'`id` de la famille, or les `DEP` sont
reliées par le **nom**. Il faut donc soit transmettre aussi le nom, soit
implémenter d'abord R1.3.

### R1.2 — Confirmation d'écriture (sortir du `no-cors`)
Corrige B3, et débloque B4 et R1.5. Astuce : envoyer le POST avec
`Content-Type: text/plain` évite le preflight CORS tout en permettant de lire la
réponse du script. On peut alors afficher un vrai échec et proposer de réessayer.

### R1.3 — Colonne `Famille_ID` sur les lignes `DEP`
Corrige la fragilité F1 à la racine. Rend le renommage de famille sûr et la
cascade fiable. Prévoir une migration des lignes existantes (mapping nom → ID).

### R1.4 — Corriger le clignotement post-ajout
Une fois R1.2 en place : ne resynchroniser que sur confirmation d'écriture, et
**fusionner par ID** au lieu de remplacer l'état en bloc.

### R1.5 — File d'attente hors ligne
La plus structurante pour l'usage terrain. Une saisie faite sans réseau est
aujourd'hui perdue silencieusement. Stocker les écritures en attente dans
`localStorage`, les marquer « en attente » dans l'UI, et les rejouer
automatiquement au retour du réseau.

### R1.6 — Verrou côté Apps Script
Utiliser `LockService` pour éviter que deux `appendRow` simultanés se marchent
dessus (fragilité F5).

---

## 🟠 Priorité 2 — Clôturer les comptes pour de vrai

Le bilan actuel *affiche* qui doit quoi, mais ne va pas jusqu'au règlement.

### R2.1 — Partager le bilan
Bouton « Partager » (Web Share API) envoyant le récapitulatif dans le groupe
WhatsApp en un tap. C'est le canal réel de règlement.

### R2.2 — Marquer un virement comme « remboursé »
Cocher un virement effectué, pour ne pas se demander trois jours plus tard qui a
déjà payé.

### R2.3 — Coordonnées de paiement par famille
Champ libre (pseudo Lydia/Paylib…) pour lever le blocage « comment je te
rembourse ? ».
⚠️ **Le Sheet est public en lecture** : préférer un pseudo de service de paiement
à un IBAN complet.

---

## 🟡 Priorité 3 — Vitesse de saisie

### R3.1 — Mémoriser « C'est moi »
La famille se choisit une fois, elle est retenue. Supprime le dropdown à chaque
saisie.

### R3.2 — Descriptions suggérées
Boutons rapides : Courses, Pain, Essence, Restaurant, Péage…

### R3.3 — Choisir la date d'une dépense
Par défaut « aujourd'hui », modifiable pour saisir une dépense oubliée.

### R3.4 — Éditer une dépense
Aujourd'hui une erreur de montant impose de supprimer puis resaisir. Le backend
gère déjà `update` sur le montant (col. E) — c'est surtout de l'UI à faire.

### R3.5 — Filtre par famille + total courant
Voir ses propres dépenses et le total en cours directement dans l'onglet
Dépenses.

### R3.6 — Photo du ticket
Pièce jointe utile en cas de contestation d'un montant.

---

## 🟢 Priorité 4 — Année & historique

### R4.1 — Reset annuel via Apps Script *(décision retenue)*
Retirer le bouton « Nouvelle année » de l'appli (il ment aujourd'hui — bug B1) et
le remplacer par une **fonction Apps Script lancée une fois par an** depuis le
Sheet. Elle : (a) copie les dépenses de l'année dans un onglet `Archive_2025`,
puis (b) les efface de `Data`.

Elle s'exécute **côté serveur**, donc sans le problème de confirmation du
`no-cors` : c'est plus fiable que le bouton actuel, et plus sûr qu'une
suppression manuelle ligne par ligne sur mobile.

> **Note sur la performance :** la crainte que l'archivage « fasse ramer » n'est
> pas fondée à ce volume (≈7 familles, quelques dizaines de dépenses par an).
> Même avec 10 ans d'historique, on reste à quelques centaines de lignes.
> L'archivage sert la **clarté**, pas la performance. De plus, l'appli ne lit
> **que** l'onglet `Data` : un onglet `Archive_2025` lui est totalement
> invisible. Si l'on souhaite malgré tout sortir les archives du fichier de
> production, la fonction peut écrire dans un **second classeur** dédié.

### R4.2 — Colonne `Année` sur les `DEP`
Corrige F3. Prérequis à tout filtrage ou historique fiable.

### R4.3 — Dates au format ISO
Corrige F4. `aaaa-mm-jj` rend le tri correct et robuste au multi-années.

### R4.4 — Page « Historique »
Vue en lecture seule comparant les années : total, coût par personne, poste le
plus lourd. C'est ce qui donne du sens à l'archivage.

---

## 🔵 Priorité 5 — Nettoyage

- **R5.1** — Supprimer les onglets morts `Familles`, `Dépenses`, `Paramètres` (D1).
- **R5.2** — Retirer le CSS mort et le doublon `.tab.active` dans `index.html` (D2).
- **R5.3** — Découper `index.html` en `index.html` + `app.js` + `style.css` ?
  *À débattre : le fichier unique reste un atout majeur de simplicité pour ce projet.*

---

## Si l'on ne devait retenir que trois choses

1. **R1.2 + R1.5** — confirmation d'écriture et file hors ligne : garantissent
   qu'aucune dépense ne se perd. Tout le reste est du confort à côté.
2. **R2.1 + R2.2** — partage et suivi des remboursements : transforme un
   compteur en outil qui clôt réellement les comptes.
3. **R3.1 + R3.2** — saisie rapide : c'est ce qui fait que les gens saisissent
   *sur le moment* au lieu d'oublier.
