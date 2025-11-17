## Betception Backend

### Local Development

```bash
npm install
npm start
```

`npm start` now ensures the MySQL (and Adminer) containers are running via Docker Compose before launching the Node server with `tsx src/server.ts`. Make sure Docker Desktop (or the Docker daemon) is running beforehand. The script automatically sets `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_USER=betuser`, `DB_PASSWORD=betpw`, and `DB_NAME=betception` so the backend connects to the dockerized database with the right credentials. Swagger remains available at `http://localhost:3000/docs`.

By default every newly registered user begins with a wallet balance of `1000.00`. Change this grant by setting `NEW_USER_INITIAL_BALANCE` in your `.env`.

> **Security note:** Both `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` must be at least 32 characters long. Copy `.env.example` to `.env`, replace the placeholder secrets with unique, random strings, and only then run `npm start` or `npm run docker:up`. The container entrypoint now refuses to boot if either value is missing or too short so production deployments fail fast on misconfiguration. Set `METRICS_ENABLED=true`/`DOCS_ENABLED=true` only when you actually need those surfaces and always pair them with strong API keys in production.

> **Note:** Because the dockerized MySQL is published on host port `3307`, configure your local `.env` with `DB_HOST=127.0.0.1` (or `localhost`) and `DB_PORT=3307` when running the backend outside of Docker. The backend container defined in `docker-compose.yml` still uses the internal service port `3306`.

> **Behind a proxy:** Set `TRUST_PROXY=true` (or the number of proxy hops) when deploying behind a load balancer so Express uses the `X-Forwarded-For` chain for logging, rate limiting, and session security features.

### Tests

The project ships with Jest-based unit and integration tests. Secrets required by the runtime are auto-populated through `jest.setup.ts`, so you can run the suite without touching your local `.env`.

```bash
npm test          # single run of all suites (used most often)
npm run test:watch # reruns affected suites on file changes
npm run test:ci    # CI-friendly, serial run with coverage enabled
```

All commands must be executed from the repository root (`Betception-Backend`). Make sure dependencies are installed (`npm install`) beforehand.

### Database Migrations

Schema changes are versioned with TypeORM migrations. Run them before starting the API (and anytime you pull new migrations):

```bash
npm run migrate          # apply pending migrations
npm run migrate:show     # list pending migrations
npm run migrate:revert   # undo the last migration
```

The legacy `db/schema.sql` file is kept for reference only--the authoritative source is now the migration history (`src/db/migrations`). Docker Compose no longer pipes that dump into MySQL; the backend container automatically runs migrations on startup so the schema in the database always matches the current codebase.

### Provably Fair Rounds

Every blackjack round stores a 32-byte `serverSeed`. The SHA-256 hash of that seed is committed with the round before any cards are dealt and is exposed through `/rounds/{id}` and `/fairness/rounds/{id}` so players can pin the commitment. Once a round is settled the raw `serverSeed` is revealed by the fairness API so anyone can reconstruct the exact deck order.

Deck construction is deterministic:

1. Start from a standard ordered 52-card deck.
2. Run a Fisher-Yates shuffle where the random index for each step `i` is computed by hashing `sha256(serverSeed + ':' + counter)` (counter begins at 0 and increments for every random number) and taking the digest modulo `(i + 1)`.
3. Consume cards sequentially from the shuffled deck. The opening deal always follows `[player, dealer, player, dealer]`; any further hits (player or dealer) simply pull the next unused card.

To verify a round, fetch `/fairness/rounds/{roundId}` after it settles, rebuild the deck with the algorithm above, and compare the cards that were dealt in the gameplay API responses with the prefix of that deterministic deck. Because every draw depends solely on the published `serverSeed`, anyone can reproduce and audit the outcome offline.

### Session Cookies

Refresh tokens are persisted exclusively in the `refresh_token` HTTP-only cookie that lives on `/auth/refresh`. Outside of `NODE_ENV=development` the cookie is always sent with `Secure` and `SameSite=Strict` so the browser refuses to attach it over plaintext HTTP or to cross-site requests. Local development without TLS must explicitly opt out by setting `COOKIE_SECURE=false` in `.env`. You can relax the same-site mode (via `COOKIE_SAMESITE=lax|none`) when embedding the app elsewhere, but note that `SameSite=None` is rejected unless `COOKIE_SECURE=true`.

### Observability

- Every request receives an `X-Request-Id` header (re-used if the client sends one). Structured JSON logs (`request.start`, `request.complete`, etc.) capture the ID, latency, IP, and status code.
- `GET /metrics` exposes a lightweight JSON snapshot (totals, active requests, rolling latency average, status distributions, error counts) that you can scrape into your monitoring stack. The endpoint stays disabled unless `METRICS_ENABLED=true`, and production should also require a `METRICS_API_KEY` header.
- Graceful shutdown handshakes on `SIGINT`/`SIGTERM`, drains the HTTP server, and tears down the TypeORM pool so deploys don’t leave orphaned connections behind.


### Rate Limiting & Docs

- All traffic now flows through a shared rate limiter backed by MySQL so multiple API instances reuse the same counters. Tune `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX` for global traffic and `AUTH_RATE_LIMIT_WINDOW_MS`/`AUTH_RATE_LIMIT_MAX` for the stricter login + refresh buckets.
- Login uses an indistinguishable error message for unknown emails vs. wrong passwords and both login and refresh routes are throttled per IP/email (or refresh token) to reduce brute-force attacks.
- Swagger (`/docs`) is only mounted when `DOCS_ENABLED=true`. Provide `DOCS_API_KEY` to require the `X-API-Key` header before serving the UI outside of local development.

### Inspecting Database Data

- **Adminer UI:** `http://localhost:8080`
  - System: `MySQL`
  - Server: `db` (inside docker network) or `host.docker.internal`
  - Username: `betuser`
  - Password: `betpw`
  - Database: `betception`

- **MySQL CLI via Docker:**
  ```bash
  docker compose exec db mysql -u betuser -pbetpw betception
  ```

- **Direct host connection:** use any desktop SQL client against `localhost:3307` with `betuser/betpw`.

### Running with Docker Compose

Build and start MySQL, backend, and Adminer (DB UI) with a single command:

```bash
npm run docker:up
```

Once the containers are healthy:

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- Adminer: `http://localhost:8080` (server `db`, username `betuser`, password `betpw`, database `betception`)
- Direct host access to MySQL: `localhost:3307` (mapped to container port 3306) if you prefer a desktop SQL client.

The backend container now waits for the MySQL health check and runs `npm run migrate` (via its entrypoint) before launching `dist/server.js`, so the Compose stack always matches the latest TypeORM migrations without relying on `db/schema.sql`.

Stop and remove containers/volumes:

```bash
npm run docker:down
```

Tail backend logs:

```bash
npm run docker:logs
```

If you only need the database (e.g., for running the backend locally with hot reload), use:

```bash
npm run db:up
```

### Building Behind a Proxy

Docker builds do not automatically inherit host-only proxies such as CNTLM on `127.0.0.1`.  
If `npm ci` inside the Docker build cannot reach the npm registry, provide proxy settings via the new build args exposed in `docker-compose.yml`.

1. Create (or update) the root `.env` file that Docker Compose reads and add:

   ```
   DOCKER_HTTP_PROXY=http://<your-http-proxy-host>:<port>
   DOCKER_HTTPS_PROXY=http://host.docker.internal:<port>   # use this when the proxy only runs on your host
   DOCKER_NO_PROXY=localhost,127.0.0.1,db
   ```

2. Run `docker compose build backend --no-cache` (or `npm run docker:up`) again.

The build stage now forwards those proxy variables to the container so `npm ci`/`npm run build` can download dependencies even in restricted networks.
