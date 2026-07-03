# FutureKawa

Dashboard de supervision centralisée pour plusieurs API distantes de capteurs (IoT). L'application permet de gérer des **zones** (une API distante par zone), de regrouper des capteurs en **lots**, de recevoir des **alertes en temps réel** (webhook + WebSocket) et d'afficher l'historique des mesures sous forme de graphiques.

## Stack technique

| Composant       | Techno                          |
|-----------------|----------------------------------|
| Backend         | Laravel 11 (PHP 8.3)             |
| Frontend        | React 18 + Vite                  |
| Base de données | PostgreSQL 16                    |
| Cache / Queue   | Redis                            |
| Graphiques      | Chart.js                         |
| Reverse proxy   | Nginx                            |
| Conteneurisation| Docker Compose                   |

## Démarrage rapide

Prérequis : Docker + Docker Compose.

```bash
git clone <url-du-repo>
cd central
cp .env.example .env
docker-compose up --build
```

L'application est ensuite disponible sur **http://localhost**.

- `docker-entrypoint.sh` génère automatiquement la clé Laravel (`APP_KEY`), joue les migrations et crée le compte administrateur au premier démarrage.
- `composer install` et `npm install` sont exécutés pendant le build des images (`backend/Dockerfile`, `frontend/Dockerfile`) — aucune installation manuelle n'est nécessaire.

### Compte administrateur par défaut

Défini dans `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), créé automatiquement au premier `docker-compose up`. À changer avant tout partage ou déploiement.

## Configuration (`.env`)

Copier `.env.example` vers `.env` et adapter au besoin :

| Variable         | Rôle                                                              |
|------------------|---------------------------------------------------------------------|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Identifiants du compte admin créé au premier boot          |
| `WEBHOOK_TOKEN`  | Secret partagé attendu dans le header `Authorization` du webhook  |
| `DB_*`           | Connexion PostgreSQL                                              |
| `MAIL_*`         | Serveur SMTP pour les emails d'alerte (expiration de stockage)    |

## Services Docker Compose

| Service     | Rôle                                                                 |
|-------------|-----------------------------------------------------------------------|
| `nginx`     | Reverse proxy — sert le frontend et route `/api` + `/up` vers Laravel |
| `laravel`   | API PHP-FPM (Controllers / Services / Models / Policies / Requests / Resources) |
| `frontend`  | Serveur de dev Vite (React)                                          |
| `queue`     | Worker `queue:work` (Redis) — envoi des emails d'alerte              |
| `scheduler` | Boucle `schedule:run` — détecte les lots dont le stockage a expiré    |
| `postgres`  | Base de données                                                       |
| `redis`     | Cache + file d'attente                                                |

## Fonctionnalités

- **Zones** : URL de l'API distante + identifiants, utilisés par le backend pour obtenir un JWT (renouvelé automatiquement avant expiration). Le frontend ne reçoit jamais le username/password, uniquement le JWT via `GET /api/zones/{zone}/token`.
- **Lots** : regroupement logique de capteurs (« lots » au sens de l'API distante) avec date de début et durée de stockage. Une alerte locale est créée automatiquement (+ email) en cas de dépassement.
- **Alertes** : deux origines — webhook externe (`POST /api/webhook/alerts`, protégé par le header `Authorization: <WEBHOOK_TOKEN>`) et expiration de stockage détectée par le scheduler. Les alertes répétées pour un même capteur sont dédupliquées tant que la précédente n'est pas résolue.
- **Temps réel** : le frontend se connecte en WebSocket à chaque API de zone (`{api_url}/ws/`) pour recevoir les mesures et alimenter les graphiques Chart.js sans rechargement.
- **Dashboard** : nombre de zones/lots, alertes actives/corrigées, état des connexions WebSocket par zone.

## Architecture du code

```
backend/app/
  Http/Controllers/   Points d'entrée HTTP
  Http/Requests/      Validation des entrées
  Http/Resources/      Formatage des réponses API
  Services/           Logique métier (JWT, alertes, ...)
  Models/             Éloquent
  Policies/           Autorisations

frontend/src/
  pages/       Écrans (routes)
  components/  Composants réutilisables
  context/     État global (WebSocket, alertes)
  hooks/       Logique réutilisable (token JWT, appels API)
  services/    Client HTTP (axios) vers le backend et les API distantes
```

## Contrat API distante

Toutes les API distantes suivent la même structure, documentée dans [`swagger.json`](swagger.json). Message WebSocket temps réel attendu :

```json
{ "zone": "brazil", "lot": "dht22-t1", "value": 23.6, "timestamp": 1782894384 }
```

## Tests (backend)

```bash
./backend/run-tests.sh                              # suite complète (bash/Git Bash)
./backend/run-tests.sh --filter=AlertServiceTest     # un fichier/test précis
```

```powershell
.\backend\run-tests.ps1                              # suite complète (PowerShell)
.\backend\run-tests.ps1 --filter=AlertServiceTest
```

Le conteneur `laravel` démarre avec les identifiants de la base de **développement**
injectés comme variables d'environnement réelles (`env_file: .env`). Ni un fichier
`.env.testing`, ni les surcharges `<env>` de `phpunit.xml` ne peuvent à eux seuls
rediriger la connexion dans ce contexte (immutabilité de Dotenv, et PHPUnit
n'écrit pas dans `$_SERVER`). `run-tests.sh` contourne ça en passant les
surcharges directement à `docker compose exec -e ...`, et fait tourner la suite
contre une base dédiée `futurekawa_test` (créée automatiquement par
`docker-entrypoint.sh` au démarrage du conteneur), qui reste totalement isolée
des données de développement.

## Tests (frontend)

```bash
docker compose exec frontend npm test                                    # suite complète (Vitest)
docker compose exec frontend npx vitest run src/context/AuthContext.test.jsx  # un fichier précis
```

Tests unitaires (`services/`, `hooks/`) et d'intégration (`context/`, `components/`, `pages/`)
via Vitest + React Testing Library. Les appels API sont mockés (`vi.mock`), donc aucune
requête réelle n'est envoyée aux conteneurs `laravel`/`postgres`.

## Qualité de code

```bash
docker compose exec laravel vendor/bin/phpstan analyse --memory-limit=512M   # backend (Larastan, niveau 5)
docker compose exec frontend npm run lint                                    # frontend (ESLint)
```

## CI/CD (Jenkins)

Le [`Jenkinsfile`](Jenkinsfile) à la racine décrit le pipeline : build des images, PHPStan,
ESLint, scan de dépendances OWASP Dependency-Check, puis les suites de tests backend et
frontend contre une stack Docker Compose éphémère (détruite après chaque run, succès ou
échec). Le déploiement (stage `Deploy (local)`) relance simplement `docker compose up
--build` en local pour l'instant — prérequis : Docker + Docker Compose v2 sur l'agent
Jenkins. Voir les commentaires en tête du fichier pour le détail de chaque étape.

## Sécurité

- Ne jamais commiter `.env` (déjà exclu via `.gitignore`) — il contient des secrets réels une fois configuré localement.
- Changer `WEBHOOK_TOKEN` et `ADMIN_PASSWORD` avant tout déploiement partagé.
