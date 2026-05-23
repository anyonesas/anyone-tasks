---
name: ask
description: Forward a feature/bug/question/info request to the lead dev (Anyone's main developer) via the anyone-tasks MCP. Trigger when the user types `/ask`, says "envoie ça au dev", "fais une demande au dev", "ask the dev", "envoie ça à mon frère", or any phrasing about forwarding a request/question to the lead developer. Scores complexity/criticality/urgency and writes a digest the dev can paste straight into their Claude session.
---

# /ask — envoyer une demande au dev principal

Tu transformes une demande utilisateur (Andrei ou Théo) en une demande structurée envoyée au dev principal (Vladimir) via le MCP `anyone-tasks`. Vladimir reçoit un digest prêt à copier-coller dans sa propre session Claude Code.

**Objectif principal** : ton digest doit être **autosuffisant**. Vladimir (et son Claude) ne devraient JAMAIS avoir besoin de revenir vers l'utilisateur pour demander des précisions. Si tu peux explorer le repo, regarder du code, lire un fichier — fais-le AVANT d'envoyer la demande, pour enrichir le digest. C'est mieux de prendre 30 secondes de plus côté toi que de bloquer Vladimir.

## Outil MCP

L'outil s'appelle **`mcp__anyone-tasks__create_request`** (si le MCP est configuré sous le nom `anyone-tasks`). Si le serveur a été nommé autrement, cherche un tool finissant par `__create_request`.

Si AUCUN tool MCP `create_request` n'est dispo, arrête-toi et dis à l'utilisateur :
> Le MCP `anyone-tasks` n'est pas configuré. Ajoute-le à ton `.mcp.json` (voir README anyone-tasks).

## Étape 1 — Scanne le contexte

**Avant tout**, scanne la conversation en cours :
- Quels fichiers ont été ouverts/édités/regardés ?
- Quelles erreurs ou bugs ont été mentionnés ?
- Quel est le projet courant (`process.cwd()`, mentions explicites, fichiers récents) ?
- Y a-t-il eu des décisions, des choix, des contraintes mentionnés implicitement ?

Cette extraction de contexte est la valeur principale du skill — sans elle, le digest est juste une copie du message utilisateur.

Si la conversation est trop pauvre (utilisateur arrive avec juste `/ask faire X`) et que tu peux explorer le repo localement : fais 1-2 `Read` / `Grep` ciblés pour avoir des pistes concrètes à mettre dans le digest.

## Étape 2 — Identifie

- **Projet concerné**. Exemples connus : `anyone-site`, `castingpass`, `paytrack`, `autoanyone`, `candidate-mini-app`, `creditanyone`, `selftapesfr`, `anyone-tasks`. Déduis depuis le cwd, les fichiers récents, ou les mentions. Si vraiment pas évident, demande.
- **Type** :
  - `feature` — nouvelle fonctionnalité ou évolution
  - `bug` — quelque chose ne marche pas (inclus repro steps !)
  - `question` — besoin d'une réponse du dev (pas de modif code)
  - `info` — juste pour info / FYI
- **Titre court** (max 10 mots, en français).
- **Demande exacte** — reformule clairement, sans inventer ni romancer.
- **Contexte** — pourquoi, lien avec d'autres décisions, historique pertinent.
- **Fichiers/références** — captures, URLs, extraits de code mentionnés (avec leur path si tu l'as vu dans la conversation).

## Étape 3 — Interview avec `AskUserQuestion` (obligatoire)

**Tu DOIS poser des questions avec `AskUserQuestion`** (le popup avec boutons cliquables) pour affiner la demande. Mieux vaut 3-5 questions ciblées maintenant qu'un digest mou qui bloque Vladimir pendant 2h.

**Combien :** 2 à 4 questions, en un seul `AskUserQuestion` (multi-questions dans le même appel). Pas une par une — groupe-les.

**Ne saute cette étape QUE SI** la conversation contient déjà des réponses explicites et détaillées sur les 4 axes ci-dessous. En cas de doute, demande.

### Questions à choisir parmi ces axes (pioche selon le contexte)

**Axe 1 — Périmètre / projet (si pas clair)**
- "Quel projet exactement ?" — options : `anyone-site`, `castingpass`, `paytrack`, `autoanyone`, `candidate-mini-app`, `creditanyone`, `selftapesfr`, `anyone-tasks`, `testerparfum`, autres
- "Quelle page / quel écran précisément ?" — options dérivées du projet
- "Cette modif touche : Front uniquement / Back uniquement / Les deux / Pas sûr"

**Axe 2 — Comportement attendu (pour `feature` ou `bug`)**
- "Quel résultat visible tu veux après la modif ?" — options spécifiques au cas
- "Le comportement actuel : c'est cassé / c'est OK mais pas terrible / ça n'existe pas encore"
- "C'est sur quel device : Desktop / Mobile / iPad / Tous"
- "Tu as un mockup ou une référence visuelle ?" — options : capture jointe / lien Figma / non, à imaginer

**Axe 3 — Garde-fous (presque toujours utile)**
- "Y a-t-il quelque chose à NE PAS toucher ?" — options proposées en fonction du projet (ex : "Flow paiement Stripe", "Auth Supabase", "SEO meta tags", "Header global", "Rien de spécifique")
- "Doit-on préserver la compatibilité avec... ?" — selon le cas

**Axe 4 — Urgence + acceptation**
- "C'est urgent à quel point ?" — options : "Casse la prod" / "Bloquant cette semaine" / "Cette semaine si possible" / "Quand tu peux"
- "Comment tu sauras que c'est fait ?" — options : "Je teste moi-même" / "Vladimir m'envoie un screenshot" / "Auto-déployé je verrai" / "Réponse écrite suffit"

**Axe 5 — Pour `bug` uniquement (repro)**
- "Sur quelle URL exactement ?" — options ou texte
- "Comment reproduire ? Étapes ?" — texte libre
- "Toujours / Parfois / Une seule fois ?"

**Axe 6 — Pour `question` / `info` uniquement**
- "Tu veux quoi en retour ?" — options : "Réponse courte oui/non" / "Explication détaillée" / "Un avis tech / archi" / "Estimation effort"

### Règles
- Toujours en français.
- Toujours fournir des options concrètes (pas de questions ouvertes type "raconte-moi plus") — utilise les boutons.
- L'option "Autre" est automatique côté `AskUserQuestion`, ne la mets pas toi-même.
- Si l'utilisateur a déjà répondu à une question dans la conv, ne la repose pas.

## Étape 4 — Scorer (1-5)

Calcule **complexity_score**, **criticality_score**, **urgency_score**. Donne aussi une raison courte pour chacun (une phrase).

### Complexity (effort dev)
- 1 = trivial (changer un texte, une couleur, un asset)
- 2 = simple (petit composant, query simple, fix isolé)
- 3 = modéré (nouvelle feature localisée, refacto contenu)
- 4 = significatif (touche plusieurs zones, refacto ou intégration nouvelle)
- 5 = majeur (architecture, perf, migration, gros chantier)

### Criticality (risque si ça casse)
- 1 = isolé, landing/marketing
- 2 = page user simple, non-bloquante
- 3 = workflow user important mais non-bloquant pour le business
- 4 = touche paiement, auth, données prod, ou intégration tierce
- 5 = critique (production live, sécurité, données utilisateurs sensibles)

### Urgency
- 1 = quand tu peux
- 2 = dans la semaine ok
- 3 = idéalement cette semaine
- 4 = bloquant pour quelque chose, à faire vite
- 5 = casse la prod / urgent maintenant

Pour les types `question` et `info` : complexity 1 par défaut, urgency selon le ton.

## Étape 5 — Garde-fous (`safety_notes`)

Liste ce que le dev (ou son Claude) ne doit PAS toucher / casser. Exemples :
- "Ne pas modifier le flow de paiement Stripe."
- "Ne pas toucher au header global, juste la page concernée."
- "Préserver le SEO actuel (meta tags, URLs)."
- "Vérifier que ça ne casse pas la version mobile."

Si rien de spécifique, laisse vide.

## Étape 6 — Digest (le truc le plus important)

Le `digest` est ce que Vladimir va coller direct dans une nouvelle session Claude. Si le digest est bon, Vladimir n'a qu'à dire à son Claude "fais ça" sans rien d'autre. Si le digest est mou, Vladimir doit revenir vers nous pour des précisions = friction = mauvais.

**Règles du bon digest** :
- Auto-contenu — Vladimir n'a pas besoin de remonter dans Telegram
- Concret — pas "améliore le formulaire", mais "le champ email accepte des espaces, valide-le côté client avec le pattern X"
- Pistes de fichiers réelles si tu as exploré — pas inventées
- Critères d'acceptation testables — "le bouton change de couleur au hover" plutôt que "amélioration de l'UX"
- Repro steps pour les bugs (URL exacte, étapes pour reproduire)
- Toujours en français

Format strict :

```
# [PROJET] Titre

**Type** · feature/bug/question/info
**Urgence** X/5 · **Criticité** X/5 · **Complexité** X/5
**Demandé par** : <email>

## Demande
<la demande exacte, claire, en 2-4 phrases>

## Contexte
<background utile : motivation, lien avec d'autres features, captures, décisions prises>

## Garde-fous
- <ce qu'il ne faut PAS toucher>
- <invariants à préserver>

## Pistes (où regarder)
- `chemin/vers/fichier.tsx` — <pourquoi>
- `autre/fichier.ts` — <pourquoi>
<seulement si tu as des pistes concrètes ; sinon laisse vide>

## Repro (pour les bugs)
1. Aller sur <URL>
2. Cliquer sur <X>
3. Observer : <comportement actuel>
4. Attendu : <comportement attendu>

## Critères d'acceptation
- [ ] <résultat observable 1>
- [ ] <résultat observable 2>
- [ ] (si UI) Testé desktop + mobile
- [ ] (si touche prod) Pas de régression sur <feature liée>

## Notes
<tout le reste utile>
```

Pour `question` / `info` : un format plus court (Demande + Contexte + ce qu'on attend comme réponse) suffit. Pas besoin de pistes ni critères d'acceptation.

## Étape 7 — Appeler le MCP

Appelle `mcp__anyone-tasks__create_request` avec :

```json
{
  "project": "...",
  "title": "...",
  "request": "...",
  "context": "...",
  "type": "feature|bug|question|info",
  "files": [{ "name": "...", "url": "...", "description": "..." }],
  "complexity_score": 1-5,
  "criticality_score": 1-5,
  "urgency_score": 1-5,
  "complexity_reason": "...",
  "criticality_reason": "...",
  "urgency_reason": "...",
  "safety_notes": "...",
  "digest": "<le markdown ci-dessus>"
}
```

## Étape 8 — Confirmer brièvement

Affiche en 3-4 lignes max :
```
✓ Demande envoyée
[Projet] Titre
Urgence X/5 · Criticité X/5 · Complexité X/5
→ https://anyone-tasks.vercel.app/requests/<id>
```

Ne réécris pas tout ce que tu as envoyé. L'utilisateur peut cliquer pour voir.

## Cas particulier — Question / Info

Si `type` est `question` ou `info`, le dev répondra simplement dans un champ texte (pas de code à écrire). Le digest doit alors juste contenir la question, le contexte, et ce que tu attends comme réponse. Pas besoin de critères d'acceptation ni de pistes.

## Cas particulier — Très court / urgent

Si l'utilisateur dit juste "demande au dev de fix X URGENT" et qu'il n'y a pas de contexte à pomper de la conversation, tu peux envoyer une demande minimale sans poser de question :
- titre = la demande raccourcie
- request = la demande verbatim
- urgency = 5
- digest = courte version

Mais signale-le dans `safety_notes` : "Demande envoyée en urgence, peu de contexte fourni — vérifier avec l'utilisateur si besoin."
