# anyone-tasks

Page web + MCP + skill Claude pour envoyer des demandes structurées au dev principal de l'équipe.

## Vue d'ensemble

```
┌─────────────────────┐                        ┌──────────────────────┐
│ Toi / Théo (Claude) │ ── /demande ─────────► │  anyone-tasks (Next) │
│   skill /demande    │                        │   Dashboard + MCP    │
└─────────────────────┘                        │       Supabase       │
                                               └──────────────────────┘
                                                          ▲
                                                          │ ouvre, traite, répond
                                               ┌──────────────────────┐
                                               │   Dev (frère) Claude │
                                               │  copie le digest     │
                                               └──────────────────────┘
```

- **Frontend / API / MCP** : Next.js 15 (App Router), déployé sur Vercel.
- **DB / Auth** : Supabase (magic link email).
- **MCP** : endpoint HTTP stateless à `/api/mcp` avec Bearer token.
- **Skill** : `/demande` — gathered context, ask if missing, score, write digest, call MCP.

## Stack

- Next.js 15, React 19, TypeScript
- Tailwind v4
- Supabase (`@supabase/ssr`)
- Zod
- MCP JSON-RPC 2.0 streamable HTTP (custom minimal handler)

---

## Setup

### 1. Créer le projet Supabase

1. Va sur https://supabase.com → nouveau projet.
2. Note `Project URL` et `anon key` (Settings → API).
3. Récupère aussi la `service_role key` (Settings → API → Reveal → ne pas committer !).
4. Dans Authentication → Providers → vérifie que **Email** est activé (magic link OK).
5. SQL editor → exécute le fichier `supabase/migrations/0001_init.sql`.
6. Authentication → URL Configuration → ajoute ton domaine Vercel à **Site URL** et **Redirect URLs** :
   - `https://anyone-tasks.vercel.app`
   - `https://anyone-tasks.vercel.app/auth/callback`
   - (en dev) `http://localhost:3000` et `http://localhost:3000/auth/callback`

### 2. Push le repo sur GitHub

```bash
cd /root/dev/anyone-tasks
git init
git add .
git commit -m "Initial commit"
gh repo create anyone-tasks --private --source=. --push
```

### 3. Déployer sur Vercel

1. https://vercel.com/new → import le repo `anyone-tasks`.
2. Framework: Next.js (auto-détecté).
3. Variables d'environnement (Production + Preview) :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   NEXT_PUBLIC_SITE_URL=https://anyone-tasks.vercel.app
   ALLOWED_EMAILS=admin@anyone.fr,theo@anyone.fr,frere@anyone.fr
   ADMIN_EMAILS=admin@anyone.fr
   ```
4. Deploy.

### 4. Première connexion + créer des tokens MCP

1. Va sur `https://anyone-tasks.vercel.app/login`, entre `admin@anyone.fr`.
2. Clique le lien magique reçu par email.
3. Va sur `/admin/tokens`.
4. Crée un token pour chaque personne (toi, Théo, ton frère) :
   - `admin@anyone.fr` + label `claude-vps`
   - `theo@anyone.fr` + label `claude-laptop`
   - `frere@anyone.fr` + label `claude-perso`
5. **Copie chaque token immédiatement** — il ne sera plus jamais affiché. Donne le bon token à chaque personne (1Password / Signal / email).

---

## Installer le MCP (côté utilisateur)

Chaque personne ajoute le MCP dans son `.mcp.json` (project) ou `~/.claude/mcp.json` (global). Recommandé : global, pour pouvoir l'invoquer depuis n'importe quel projet.

```json
{
  "mcpServers": {
    "anyone-tasks": {
      "command": "sh",
      "args": [
        "-c",
        "exec npx -y mcp-remote@latest https://anyone-tasks.vercel.app/api/mcp --header \"Authorization: Bearer $ANYONE_TASKS_TOKEN\""
      ]
    }
  }
}
```

Et dans le shell de chaque personne (`~/.zshrc` ou `~/.bashrc`) :

```bash
export ANYONE_TASKS_TOKEN=att_xxxxxxxxxxxxxxxxxxxx
```

Vérifie en lançant Claude Code : `/mcp` devrait lister `anyone-tasks` avec les 5 tools.

---

## Installer le skill `/demande`

Le dossier `skill/demande/` est le skill à installer chez chaque utilisateur.

```bash
# Sur la machine de chaque utilisateur :
mkdir -p ~/.claude/skills
cp -r /chemin/vers/anyone-tasks/skill/demande ~/.claude/skills/
```

Vérifie en lançant Claude Code : tape `/demande` — le skill doit apparaître.

---

## Utilisation

### Côté toi/Théo (envoyer une demande)

Depuis n'importe quelle session Claude Code, dans n'importe quel projet :

```
/demande est-ce que tu peux modifier l'annonce voix sur l'iPad dans candidate-mini-app ?
```

Le skill :
1. Lit le contexte de la conversation.
2. Pose 0-2 questions si vraiment nécessaire.
3. Calcule complexité/criticité/urgence.
4. Génère un digest prêt à coller dans Claude.
5. Envoie via le MCP.
6. Te confirme avec un lien.

### Côté dev (ton frère)

1. Va sur `https://anyone-tasks.vercel.app`.
2. Vois la liste filtrée (ouvertes par défaut).
3. Clique sur une demande.
4. Copie le **Digest** (bouton "Copier" sur le bloc noir).
5. Colle dans une session Claude Code dans le bon projet.
6. Revient sur la page, écrit une réponse (résumé de ce qu'il a fait, ou la réponse à une question), clique "Marquer traitée".

Il peut aussi utiliser le MCP depuis Claude pour lister/répondre s'il préfère :
- `mcp__anyone-tasks__list_requests({ status: "open" })`
- `mcp__anyone-tasks__respond_to_request({ id, response, status })`

---

## Dev local

```bash
npm install
cp .env.example .env.local
# remplir les valeurs
npm run dev
```

http://localhost:3000

---

## Structure

```
anyone-tasks/
├─ app/
│  ├─ page.tsx                          # dashboard
│  ├─ login/                            # magic link login
│  ├─ auth/callback/                    # OAuth callback
│  ├─ requests/[id]/                    # détail demande
│  ├─ admin/tokens/                     # gestion tokens MCP
│  └─ api/
│     ├─ requests/                      # CRUD
│     ├─ tokens/                        # admin only
│     └─ mcp/                           # MCP JSON-RPC endpoint
├─ components/                          # Header, badges, filters, card
├─ lib/
│  ├─ supabase/{server,client,service,middleware}.ts
│  ├─ requests.ts                       # CRUD + Zod schemas
│  ├─ tokens.ts                         # API tokens hashing + verify
│  ├─ types.ts                          # types + labels FR
│  ├─ utils.ts
│  └─ env.ts                            # env helpers + allowlist
├─ supabase/migrations/0001_init.sql    # schema
├─ skill/demande/SKILL.md               # Claude skill
└─ middleware.ts                        # auth gate
```

---

## Sécurité

- Tokens MCP : stockés en SHA-256, jamais en clair après création.
- RLS Supabase : table `requests` lisible/modifiable uniquement par utilisateur authentifié ; `api_tokens` uniquement via service role.
- Allowlist email (`ALLOWED_EMAILS`) appliquée dans le middleware.
- Le MCP n'utilise jamais la session cookie — Bearer token uniquement.
- Service role key uniquement côté serveur (jamais exposée au client).

## Notes

- Les tokens peuvent être révoqués depuis `/admin/tokens` sans casser les autres.
- Les filtres du dashboard sont dans l'URL → partageables.
- Le skill `/demande` ne dépend du nom MCP que par convention (`anyone-tasks`). Si tu le renommes côté `.mcp.json`, ajuste le SKILL.md.
