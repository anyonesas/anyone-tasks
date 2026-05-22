---
name: ask
description: Forward a feature/bug/question/info request to the lead dev (Anyone's main developer) via the anyone-tasks MCP. Trigger when the user types `/ask`, says "envoie ça au dev", "fais une demande au dev", "ask the dev", "envoie ça à mon frère", or any phrasing about forwarding a request/question to the lead developer. Scores complexity/criticality/urgency and writes a digest the dev can paste straight into their Claude session.
---

# /ask — envoyer une demande au dev principal

Tu transformes une demande utilisateur (toi-même ou Théo) en une demande structurée envoyée au dev principal via le MCP `anyone-tasks`. Le dev reçoit un digest prêt à copier-coller dans sa propre session Claude.

## Outil MCP

L'outil s'appelle **`mcp__anyone-tasks__create_request`** (si le MCP est configuré sous le nom `anyone-tasks`). Si le serveur a été nommé autrement, cherche un tool finissant par `__create_request`.

Si AUCUN tool MCP `create_request` n'est dispo, arrête-toi et dis à l'utilisateur :
> Le MCP `anyone-tasks` n'est pas configuré. Ajoute-le à ton `.mcp.json` (voir README anyone-tasks).

## Étape 1 — Comprendre la demande

Lis tout le contexte de la conversation (messages précédents) ET le message d'invocation. Identifie :

- **Projet concerné**. Exemples : `anyone-site`, `castingpass`, `paytrack`, `autoanyone`, `candidate-mini-app`, `creditanyone`, `selftapesfr`, etc. Si pas évident, demande.
- **Type** :
  - `feature` — nouvelle fonctionnalité ou évolution
  - `bug` — quelque chose ne marche pas
  - `question` — besoin d'une réponse du dev (pas de modif code)
  - `info` — juste pour info / FYI
- **Titre court** (max 10 mots).
- **Demande exacte** — ce qui doit être fait, dans les mots de l'utilisateur (reformule pour clarté mais sans inventer).
- **Contexte** — pourquoi, où dans le code, historique pertinent, captures/URLs déjà mentionnées.
- **Fichiers/références** — captures d'écran, URLs, extraits de code mentionnés.

## Étape 2 — Demander seulement si vraiment nécessaire

Utilise `AskUserQuestion` UNIQUEMENT si :
- Le projet est ambigu (plusieurs projets possibles, ou pas mentionné du tout)
- La demande est vague au point que le dev ne pourrait pas démarrer (ex : "améliore le truc")
- Il manque une contrainte critique que l'utilisateur a probablement en tête (ex : "casse pas X")

**Maximum 2 questions.** N'agresse pas l'utilisateur de questions — fais des hypothèses raisonnables et note-les dans le contexte avec une mention "À confirmer : ...".

## Étape 3 — Scorer (1-5)

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

## Étape 4 — Garde-fous (`safety_notes`)

Liste ce que le dev (ou son Claude) ne doit PAS toucher / casser. Exemples :
- "Ne pas modifier le flow de paiement Stripe."
- "Ne pas toucher au header global, juste la page concernée."
- "Préserver le SEO actuel (meta tags, URLs)."
- "Vérifier que ça ne casse pas la version mobile."

Si rien de spécifique, laisse vide.

## Étape 5 — Digest (à coller dans le Claude du dev)

Le `digest` est le morceau le plus important. C'est un markdown auto-contenu que le dev colle dans une nouvelle session Claude. Il doit être complet sans contexte externe.

Format strict :

```
# [PROJET] Titre

**Type** · feature/bug/question/info  
**Urgence** X/5 · **Criticité** X/5 · **Complexité** X/5  
**Demandé par** : <email>

## Demande
<la demande exacte, claire>

## Contexte
<background utile : motivation, lien avec d'autres features, captures>

## Garde-fous
- <ce qu'il ne faut PAS toucher>
- <invariants à préserver>

## Pistes (où regarder)
<si tu as une idée du fichier/zone>

## Critères d'acceptation
- [ ] <résultat observable 1>
- [ ] <résultat observable 2>
- [ ] (si UI) Testé sur desktop + mobile

## Notes
<tout le reste utile>
```

Le digest doit être en français (le dev est francophone).

## Étape 6 — Appeler le MCP

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

## Étape 7 — Confirmer brièvement

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
