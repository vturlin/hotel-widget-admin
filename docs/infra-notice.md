# Notice infra — Marketing Suite (admin + widgets)

Document de cadrage pour la réunion infra. Décrit chaque brique backend, ses enjeux, les coûts attendus et les décisions à arbitrer.

---

## 1. Vue d'ensemble

```
                    ┌──────────────────────┐
   Hôtel visiteur ──┤  GitHub Pages CDN    │ ← widget.js + widget.css + configs/*.json
                    └──────────┬───────────┘
                               │ fetch rates
                               ▼
                    ┌──────────────────────┐
                    │ Cloud Run            │ ← /api/rates (public, cache 1h)
                    │ hotel-widget-admin   │ ← /api/i, /api/track (public)
                    │  (Express + React)   │
                    └──┬─────┬─────┬──────┘
                       │     │     │
        ┌──────────────┘     │     └──────────────────┐
        ▼                    ▼                        ▼
  ┌──────────┐        ┌────────────┐          ┌──────────────┐
  │ AvailPro │        │ BigQuery   │          │ Gemini API   │
  │  Rates   │        │ (events)   │          │ (lead-gen)   │
  └──────────┘        └────────────┘          └──────────────┘
                            ▲
                            │ écriture (consent-gated)
                            │
        ┌─────────── Admin opérateur ◄───────────┐
        │       (HTTPS + cookie HttpOnly)        │
        │                                        │
        ▼                                        ▼
  ┌──────────────┐                    ┌──────────────────┐
  │ Cloud Run    │ publish/delete →   │ GitHub repos     │
  │ /api/*       │                    │ (4 repos config) │
  └──────────────┘                    └──────────────────┘
```

**Acteurs & flux** :
- **Visiteur d'hôtel** : charge le widget depuis GitHub Pages → appelle `/api/rates/*` sur Cloud Run (cache 1h, AvailPro en upstream).
- **Tracker** : POST `/api/i` ou `/api/track` (consent-gated, écrit en BigQuery).
- **Opérateur admin** : login HTTPS → SPA React → publish/delete configs → Cloud Run écrit dans GitHub.

---

## 2. Composants backend

### 2.1 Cloud Run — `hotel-widget-admin`

**Rôle** : tout le backend (admin SPA, APIs, proxy rates, tracker, intégrations Gemini/BigQuery/GitHub).

| Caractéristique | Valeur actuelle |
|---|---|
| Région | `europe-west1` |
| Image | Node 20 alpine, multi-stage Docker |
| Concurrence | défaut (80 req/instance) |
| Min instances | 0 (scale-to-zero) |
| Max instances | défaut (1000) |
| Cold start | ~1-2s (Express + node-cache + BigQuery client init) |
| Mémoire | 512 MiB suffit en l'état |

**Enjeux** :
- Scale-to-zero acceptable côté admin (faible trafic), **mais** côté `/api/rates/*` (appelé par chaque visiteur d'hôtel), le cold start ajoute ~2s à la première requête de la journée. Si on a beaucoup d'hôtels actifs, fixer `min-instances: 1`.
- Cache rates en mémoire (`node-cache`, TTL 1h) : perdu sur cold start. Acceptable au POC, à externaliser en Redis si on monte.

### 2.2 GitHub — stockage configs

**Rôle** : 4 repos privés stockent les configs JSON par hôtel. Un repo par produit.

| Repo | Produit | Path |
|---|---|---|
| `best-price-widget` | Best-Price (comparateur OTA) | `public/configs/{hotelId}.json` |
| `lead-gen-widget` | Lead-Gen (popup newsletter) | `public/configs/{hotelId}.json` |
| `stress-widget` | Stress-marketing | `public/configs/{hotelId}.json` |
| `reassurance-widget` | Reassurance | `public/configs/{hotelId}.json` |

**Auth** : Personal Access Token (PAT) classic avec scope `repo:contents:write`, stocké en Secret Manager → injecté en env `GITHUB_TOKEN`.

**Enjeux** :
- **Single point of failure** sur le PAT. À migrer vers GitHub App (rotation automatique, scope par-repo) avant la mise à l'échelle.
- **Pas de transactionnel** : si Cloud Run crash entre la lecture du SHA et le PUT, conflit possible (déjà mitigé par le `PublishConfirmDialog` qui ne permet plus le double-clic).
- **Quotas GitHub API** : 5000 req/h par token. Chaque publish = ~3 calls. Très large pour notre usage.
- **Latence** : 100-300ms par appel GitHub. Le `getValidHotelIds()` pour le tracker fait 4 calls en parallèle, mis en cache 5 min.

### 2.3 GitHub Pages — distribution widget

**Rôle** : sert `widget.js`, `widget.css` et `configs/*.json` aux navigateurs des visiteurs d'hôtels.

| Caractéristique | Valeur |
|---|---|
| Build & deploy | GitHub Actions à chaque push `main` |
| CDN | Cloudflare (intégré GitHub Pages) |
| Coût | 0 € (open-source plan) |
| Bande passante | illimitée |

**Enjeux** :
- Pas de SLA contractuel — historiquement très stable (>99.9%).
- Cache CDN long, donc une publish admin met **~1-2 min** à apparaître chez les visiteurs (mention dans l'UI admin).
- Si on doit signer des SLA clients, envisager Cloud CDN ou Fastly.

### 2.4 AvailPro / D-EDGE Rates API

**Rôle** : source de vérité des prix direct + OTA. Appelée par `/api/rates/*` côté admin.

| Caractéristique | Valeur |
|---|---|
| Endpoint | API D-EDGE interne |
| Auth | token signé HMAC (généré côté Cloud Run) |
| Cache | `node-cache` 1h, key = `apiHotelId:year:month` |
| Volume | ~1 call par mois fetched par stay = très faible |

**Enjeux** :
- Dépendance sur la dispo de l'API AvailPro — si elle tombe, le widget passe en mode fallback (« Best price guaranteed » sans chiffres).
- Cache invalidation manuelle inexistante : si un prix change, le widget l'affichera après l'expiration TTL (max 1h). Acceptable selon le métier.

### 2.5 BigQuery — événements tracker

**Rôle** : stocke les 3 événements first-party (`widget_loaded`, `widget_opened`, `book_clicked`) pour les stats.

| Caractéristique | Valeur |
|---|---|
| Projet GCP | (à confirmer côté infra) |
| Dataset | `hotel_widget` (par défaut) |
| Table | `events` (par défaut) |
| Schéma | `ts, hotel_id, event, hpw_uid, …` |
| Partition | par date (recommandé, à mettre en place si pas déjà fait) |

**Enjeux** :
- **Volume** : 3 events × N visiteurs × M hôtels. À 10k visiteurs/jour ça fait 30k rows/jour = ~10M/an. Très peu pour BigQuery.
- **Coûts** : storage <1 €/mois. Queries du dashboard : `SELECT COUNT(*) GROUP BY day` — quelques MB scannés à chaque ouverture. Sub-€/mois.
- **GDPR** : `hpw_uid` est un cookie aléatoire opaque (pas de PII), TTL 6 mois. Effacement = expiration cookie ou suppression côté BigQuery.

### 2.6 Gemini API — génération contenu lead-gen

**Rôle** : génère titre + sous-titre + CTA d'un widget lead-gen à partir du nom de l'hôtel.

| Caractéristique | Valeur |
|---|---|
| Modèle | `gemini-1.5-flash` (à confirmer) |
| Endpoint | Vertex AI ou Gemini API publique |
| Auth | API key en env `GEMINI_API_KEY` |
| Volume | ~1 appel par config créée = très faible |

**Enjeux** :
- **Coût** : sub-cent par appel. Devrait rester <1 €/mois sauf abus.
- **Sécu** : endpoint maintenant gaté par auth admin (avant le déploiement de hier, il était public — risque d'abus écarté).

### 2.7 Secret Manager

**Secrets actuels** :
- `ADMIN_PASSWORD` — login admin
- `GITHUB_TOKEN` — PAT pour publish/delete sur les 4 repos
- `GEMINI_API_KEY` — génération contenu
- `GOOGLE_APPLICATION_CREDENTIALS` (implicite via service account Cloud Run)

**Enjeux** :
- Rotation manuelle aujourd'hui. Mettre une procédure de rotation (90 jours pour le PAT GitHub).
- Le `ADMIN_PASSWORD` est partagé entre tous les opérateurs. À remplacer par un IAM (Google SSO) si le nombre d'opérateurs croît.

---

## 3. Sécurité — état des lieux

### 3.1 Authentification admin

- Cookie de session **HttpOnly** + **Secure** + **SameSite=Strict**, token aléatoire 32 bytes, TTL 30j
- Stockage in-memory côté Cloud Run (à remplacer par Redis/Memorystore si on veut survivre aux cold starts)
- `/api/auth` : compare-time constant via SHA-256 + `crypto.timingSafeEqual`
- Rate-limit : 10 tentatives / 15 min / IP via `express-rate-limit`
- Middleware d'auth sur tout `/api/*` sauf endpoints widget (`/api/rates/*`, `/api/i`, `/api/track`) et flow auth (`/api/auth*`)

### 3.2 Endpoints publics (intentionnels)

| Endpoint | Pourquoi public | Protection |
|---|---|---|
| `/api/rates/:apiHotelId` | Appelé par le widget chez les visiteurs d'hôtels | CORS open, validation entiers, cap 10M, cache TTL 1h |
| `/api/i`, `/api/track` | Beacons tracker depuis les widgets | Rate-limit, hotelId allowlist via 4 repos GitHub, validation event |

### 3.3 Headers HTTP

```
Content-Security-Policy:
  default-src 'self'
  img-src 'self' https://www.d-edge.com data: blob:
  script-src 'self'
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
  font-src 'self' https://fonts.gstatic.com
  frame-src 'self' https://vturlin.github.io
  connect-src 'self'
  object-src 'none'

X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 3.4 Surface d'attaque résiduelle

| Risque | Mitigation actuelle | Recommandation |
|---|---|---|
| Compromission du PAT GitHub | scope minimal (`repo:contents`) | passer à GitHub App + rotation auto |
| XSS dans le SPA admin | CSP `script-src 'self'` (pas d'inline) | audit régulier des deps front |
| Replay token de session | TTL 30j, invalidé sur logout côté serveur | OK |
| Brute-force `ADMIN_PASSWORD` | rate-limit + timing-safe + sha256 | OK ; envisager IAM Google SSO à terme |
| Spam `/api/i` (tracker) | rate-limit + allowlist hotelIds | OK |
| DoS sur `/api/rates/*` | cache 1h, scale-to-zero, max-instances | définir un budget Cloud Run |
| Concurrence publish (2 admins) | dialog publish désactive le double-click | acceptable au POC, locking optimiste possible |

### 3.5 Conformité

- **GDPR** : pas de PII collectée. `hpw_uid` aléatoire, TTL 6 mois, consent-gated (`window.HPW_TRACKER_CONSENT === true`).
- **Cookies** : 1 cookie session admin (HttpOnly, internal staff). Côté visiteur d'hôtel : `hpw_uid` first-party (cookie consent du host).

---

## 4. Coûts — drivers et ordres de grandeur

> Hypothèses : 50 hôtels actifs, 10 000 visiteurs / jour total, 1 publish/jour/hôtel max.

### 4.1 Cloud Run

| Composante | Volume estimé | Coût mensuel |
|---|---|---|
| CPU & mémoire | 10k req/jour × ~50ms each | ~5 € |
| Egress | rates ~50 KB × 10k = 500 MB/jour | ~3 € |
| Min-instances=0 | scale-to-zero, sauf si on l'augmente | 0 € |
| Min-instances=1 (option) | toujours-warm | ~30 €/mois |

### 4.2 BigQuery

| Composante | Volume estimé | Coût mensuel |
|---|---|---|
| Storage events | ~1 GB/an | <1 € |
| Streaming insert | 30k rows/jour | ~3 € |
| Queries dashboard | quelques MB par open | <1 € |

### 4.3 Gemini API

| Composante | Volume estimé | Coût mensuel |
|---|---|---|
| Generate-content | ~50 appels/mois | <1 € |

### 4.4 Secret Manager

~6 secrets, accès quotidien : ~0,30 €/mois.

### 4.5 GitHub

Plan organisation existant. Pas de coût marginal lié au widget.

### 4.6 GitHub Pages

0 €.

### 4.7 **Total estimé** : ~15-20 € / mois (config actuelle, scale-to-zero)

Avec `min-instances: 1` pour éviter le cold start côté `/api/rates/*` : ~45-50 € / mois.

---

## 5. Décisions à arbitrer avec l'infra

| Sujet | Question | Recommandation |
|---|---|---|
| **Cold start** | Tolère-t-on +2s sur la 1ère requête `/api/rates` du jour ? | `min-instances: 1` si l'expérience visiteur prime, sinon scale-to-zero |
| **Sessions admin** | OK pour les sessions in-memory (perdues sur cold start) ? | À court terme oui ; à terme : Redis ou Cloud SQL |
| **Auth admin** | Garde-t-on le password partagé ou bascule sur Google SSO ? | SSO si > 5 opérateurs ; sinon password OK |
| **PAT GitHub** | Migration vers GitHub App ? | Recommandé pour rotation auto et scope per-repo |
| **Environnements** | Staging séparé ? | À mettre en place si on veut tester en non-prod |
| **Monitoring** | Cloud Run + Error Reporting + Uptime check sur `/api/rates/*` | À configurer |
| **Backup BigQuery** | Snapshot dataset ? | Acceptable de ne pas en faire (events recréables côté tracker) |
| **Custom domain** | `marketing-suite.d-edge.com` au lieu de `*.run.app` ? | Meilleur pour la confiance des clients |
| **Multi-region** | Failover si `europe-west1` tombe ? | Pas urgent pour un POC, à planifier si SLA contractuel |
| **Quotas Gemini** | Quota max par jour ? | Définir un plafond GCP pour éviter les surprises |

---

## 6. Annexe — variables d'environnement

| Variable | Type | Origine |
|---|---|---|
| `PORT` | system | Cloud Run injecte automatiquement |
| `NODE_ENV=production` | system | Dockerfile |
| `ADMIN_PASSWORD` | secret | Secret Manager |
| `GITHUB_TOKEN` | secret | Secret Manager |
| `GITHUB_OWNER` | env | `vturlin` |
| `GITHUB_REPO` | env | `best-price-widget` |
| `GITHUB_REPO_LEAD_GEN` | env | `lead-gen-widget` (default) |
| `GITHUB_REPO_STRESS` | env | `stress-widget` (default) |
| `GITHUB_REPO_REASSURANCE` | env | `reassurance-widget` (default) |
| `GITHUB_BRANCH` | env | `main` (default) |
| `GEMINI_API_KEY` | secret | Secret Manager |
| `BQ_PROJECT_ID` | env | projet GCP |
| `BQ_DATASET` | env | `hotel_widget` (default) |
| `BQ_TABLE` | env | `events` (default) |
| `GOOGLE_APPLICATION_CREDENTIALS` | implicite | service account Cloud Run |
| `VITE_TRACKER_ENDPOINT` | build-time | URL du backend, intégré au bundle widget |
