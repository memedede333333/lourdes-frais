# Déploiement

Deux cibles **totalement indépendantes**, avec deux mécanismes différents :

| Cible | Contenu | Outil |
|---|---|---|
| **GitHub Pages** | `index.html` (le site) | `git` |
| **Google Apps Script** | `apps-script/Code.gs` (le backend) | `clasp` |

> ⚠️ Apps Script **n'accepte pas de push git**. Il faut obligatoirement passer
> par `clasp`, l'outil en ligne de commande officiel de Google. C'est la seule
> façon de mettre à jour le script depuis un IDE.

---

## Partie A — Configuration initiale (une seule fois)

### A.1 GitHub

```bash
git clone https://github.com/memedede333/lourdes-frais.git
cd lourdes-frais
```

Authentification recommandée : **GitHub CLI** (plus simple qu'un token à gérer).

```bash
gh auth login
```

Vérifier que GitHub Pages est actif : *Settings → Pages → Deploy from a branch →
`main` / root*.

### A.2 clasp (Apps Script)

```bash
npm install -g @google/clasp
clasp login
```

`clasp login` ouvre le navigateur pour autoriser ton compte Google. Il faut aussi
activer l'API Apps Script (une seule fois) sur
https://script.google.com/home/usersettings → **activer** « Google Apps Script API ».

### A.3 Récupérer le Script ID

Le `SCRIPT_URL` présent dans `index.html`
(`.../macros/s/AKfycbwUrAaG.../exec`) contient l'**ID de déploiement**, qui
**n'est pas** le Script ID. `clasp` a besoin du Script ID.

**Méthode simple** — une fois `clasp login` fait :

```bash
clasp list      # liste les projets du compte avec leur Script ID
```

Repérer le projet lié au Sheet « Lourdes ».

**Méthode manuelle** (si `clasp list` est ambigu) :
1. Ouvrir le Google Sheet → **Extensions → Apps Script**
2. Dans l'éditeur : **⚙️ Paramètres du projet**
3. Copier **« ID du script »** (une longue chaîne d'environ 57 caractères)

Puis créer le fichier de configuration :

```bash
cp .clasp.json.example .clasp.json
# éditer .clasp.json et coller le Script ID
```

`.clasp.json` est volontairement dans `.gitignore` (il est propre à ta machine).

### A.4 Vérifier que ça marche

```bash
clasp pull        # récupère la version en ligne
git diff          # doit être vide si le dépôt est à jour
```

Si `git diff` montre des différences, c'est que le script en ligne a été modifié
directement dans l'éditeur web : **la version en ligne fait foi**, commiter
ce que `clasp pull` a rapporté.

---

## Partie B — Publier une modification

### B.1 Le site (GitHub Pages)

```bash
git add index.html
git commit -m "Description du changement"
git push
```

Le site est à jour en 1–2 minutes sur https://memedede333.github.io/lourdes-frais/

### B.2 Le backend (Apps Script)

```bash
clasp push                                   # envoie le code
clasp deploy -i <DEPLOYMENT_ID> -d "v2"      # met à jour le déploiement EXISTANT
```

🚨 **Point critique.** `clasp push` met à jour le code de l'éditeur, mais **ne
change rien pour l'application** : l'URL `/exec` continue de servir l'ancienne
version tant que le déploiement n'est pas mis à jour.

Deux options :
- **`clasp deploy -i <DEPLOYMENT_ID>`** → met à jour le déploiement existant.
  **L'URL ne change pas**, `index.html` n'est pas à modifier. ✅ **Recommandé.**
- `clasp deploy` (sans `-i`) → crée un **nouveau** déploiement avec une
  **nouvelle URL**. Il faut alors mettre à jour `SCRIPT_URL` dans `index.html`
  **et** repousser sur GitHub. ⚠️ C'est ce qui explique le changement d'URL
  observé entre les versions successives du projet.

Pour lister les déploiements et retrouver l'ID à réutiliser :

```bash
clasp deployments
```

### B.3 Les deux d'un coup

```bash
./scripts/deploy.sh "Message de commit"
```

---

## Partie C — Procédure de vérification après déploiement

Tester **dans cet ordre**, en conditions réelles (smartphone) :

1. Ouvrir l'appli → les familles existantes s'affichent.
2. Ajouter une famille test → **vérifier qu'une ligne `FAM` apparaît dans le
   Sheet, onglet `Data`**.
3. Ajouter une dépense test → vérifier la ligne `DEP`.
4. Vérifier le calcul du bilan.
5. Mode admin (`333`) → supprimer les données de test → vérifier que la
   **colonne H** se remplit d'un horodatage.
6. Recharger l'appli → les données de test ne doivent plus apparaître.

⚠️ Tant que le bug B3 n'est pas corrigé (`no-cors`), **l'appli affiche
« succès » même en cas d'échec d'écriture**. La seule vérification fiable est
donc l'inspection directe du Google Sheet.

---

## Rollback

**Site :**
```bash
git revert <commit>
git push
```

**Apps Script :** l'éditeur web conserve l'historique des versions
(*Déployer → Gérer les déploiements*). On peut y repointer le déploiement vers
une version antérieure.

---

## En cas de problème

| Symptôme | Cause probable |
|---|---|
| Les modifications du script ne s'appliquent pas | `clasp push` fait mais pas `clasp deploy` |
| Erreur 401/403 sur `clasp push` | API Apps Script non activée, ou `clasp login` expiré |
| L'appli n'écrit plus rien | `SCRIPT_URL` pointe vers un déploiement obsolète |
| Le site ne se met pas à jour | Cache navigateur, ou build Pages en cours (attendre 2 min) |
| Données absentes après ajout | Vérifier directement le Sheet — le `no-cors` masque les échecs (B3) |
