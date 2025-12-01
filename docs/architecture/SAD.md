# BetCeption  
# Software Architecture Document  
# Version 1.0

## Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 01.12.2025 | 0.0 | Neu erstellt | Team BetCeption |
| 01.12.2025 | 0.1 | Abgleich Implementierungsstand (Backend/Frontend) | Team BetCeption |
| 02.12.2025 | 0.2 | Klassendiagramm (Backend) eingebettet | Team BetCeption |

---

## 1. Introduction
### 1.1 Purpose
Dieses Dokument gibt einen vollständigen Überblick über die Software-Architektur von BetCeption anhand des 4+1-Sichtenmodells. Es fasst die architekturrelevanten Entscheidungen, Ziele und Views zusammen und verweist auf Detaildokumente (ASR, Utility Tree, ADRs, Use Cases).

### 1.2 Scope
Gilt für die initiale Auslieferung von BetCeption: Blackjack mit Sidebets/Power-Ups, virtuelles Wallet, Leaderboards, Daily Reward. Betrifft Backend (Node/Express/TypeORM), Frontend (Angular) und Datenbank (MySQL/Docker). Optionale Oberflächen (Docs/Metrics) sind per Feature-Flag zuschaltbar; Erweiterungen darüber hinaus liegen außerhalb des aktuellen Scopes.

### 1.3 Definitions, Acronyms, Abbreviations
- ASR: Architecture Significant Requirement  
- ADR: Architecture Decision Record  
- JWT: JSON Web Token  
- RNG: Random Number Generator  
- SPA: Single Page Application  
- UC: Use Case  
- DB: Datenbank (MySQL 8)

### 1.4 References
- [`docs/architecture/asr-3-step.md`](./asr-3-step.md) (ASR, Szenarien, Taktiken)  
- [`docs/architecture/utility-tree.md`](./utility-tree.md) (Utility Tree, priorisierte Szenarien)  
- [`docs/architecture/architecture-decisions.md`](./architecture-decisions.md) (AD-1..9)  
- [`docs/architecture/weekly-blog.md`](./weekly-blog.md) (Woche 6-8)  
- [`docs/use-cases/*.md`](../use-cases/) (UC1-UC10)  
- [`docs/use-case-realisation/*.md`](../use-case-realisation/) (Use-Case-Realisierungen mit Sequenz-/Aktivitätsdiagrammen)  
- [`db/schema.sql`](../db/schema.sql) (Relationenschema)  
- Source-Code-Struktur unter [`Betception-Backend/src`](../../Betception-Backend/src), [`Betception-Frontend/src`](../../Betception-Frontend/src)

### 1.5 Overview
Die folgenden Abschnitte folgen dem RUP-Template: Architekturdarstellung, Ziele/Randbedingungen, Use-Case-Sicht, Logische Sicht, Prozess-Sicht, Einsatzsicht, Implementierungssicht, Datensicht, Größe/Performance, Qualität.

### 1.6 Implementation Status (Sync)
- Backend: Round/Fairness, Wallet/Ledger, Auth mit Refresh-Cookies + Rate-Limits, Leaderboard-Views und Daily-Reward-Transaktion sind implementiert. XP/Level-Progression, Power-Up-Effekte und Double/Split fehlen noch.
- Frontend: AuthPanel + Blackjack-View (Deal/Hit/Stand/Settle) und Leaderboard-Tabs sind vorhanden. Shop/Inventar/Wallet/Rewards haben kein UI; Login-/Register-Seiten sind Platzhalter.

## 2. Architectural Overview
Wir nutzen das 4+1-Sichtenmodell:
- Use-Case-Sicht: zentrale UC1–UC10, Sequenzen/Verhaltensmodellierung (siehe Use-Case-Dokumente, Blog Woche 5/6).  
- Logische Sicht: Domänenmodelle, Entities, Feature-Folder-Struktur (Backend/Frontend).  
- Prozess-Sicht: Laufzeitflüsse (Auth, Round/Bet, Power-Up, Leaderboard, Observability).  
- Einsatzsicht: Container-Topologie (Browser → Proxy → Node/Express → MySQL).  
- Implementierungssicht: Layering, Module, Middlewares, CI/CD.  
Quellen: Code-Struktur, ASR, Utility Tree, ADRs und Blog-Updates.

## 3. Architectural Goals and Constraints
- Ziele (ASR-basiert):  
  - ASR-1/4: Deterministische Spielengine, Fairness-API (Server-Seed + SHA-256-Hash + Draw-Order).  
  - ASR-2: Atomare Wallet-Buchungen mit ACID-Transaktionen und Sperren.  
  - ASR-3: Gehärteter Auth-Flow (JWT + Refresh-Cookie HttpOnly/SameSite/Secure, Rate-Limits, Token-Rotation).  
  - ASR-5: Performante Round-Starts (p95 < 300 ms trotz Sidebets/Power-Ups).  
  - ASR-6: Beobachtbarkeit (Request-IDs, strukturierte Logs, `/metrics` per Toggle/API-Key).  
  - ASR-7: Modulare Erweiterbarkeit (Feature-Folder; Backend spiegelt Angular).  
- Randbedingungen: Docker Compose als Laufzeit, MySQL 8, Node/Express/TypeORM, Angular SPA; CI/CD via GitHub Actions; Secrets per Environment; Feature-Toggles für Docs/Metrics; stabile Use-Case-Schnittstellen.

## 4. Use Case View
Zentrale Use Cases (siehe `docs/use-cases`, Realisierung unter `docs/use-case-realisation`):
- [UC1 Authentifizierung & Session-Management](../use-cases/uc1-authentifizierung-session-management.md)  
- [UC2 Shop, Inventar & Wallet](../use-cases/uc2-shop-inventar-guthabeverwaltung.md)  
- [UC3 Daily Reward](../use-cases/uc3-daily-reward.md)  
- [UC4 Leaderboard anzeigen](../use-cases/uc4-leaderboard-anzeigen.md)  
- [UC5 Spiel starten (Blackjack)](../use-cases/uc5-spiel-starten.md)  
- [UC6 Wetten platzieren (Haupt- & Nebenwetten)](../use-cases/uc6-wetten-platzieren.md)  
- [UC7 Spielzug ausführen (Hit/Stand/Double/Split)](../use-cases/uc7-spielzug-ausfuehren.md)  
- [UC8 Power-Up einsetzen](../use-cases/uc8-powerup-einsetzen.md)  
- [UC9 XP-/Level-System verwalten](../use-cases/uc9-xp-level-system-verwalten.md)  
- [UC10 Daten persistieren](../use-cases/uc10-daten-persistieren.md)  

**Implementierungsabdeckung (Kurz):** Backend deckt UC1/3/4/5/6/8/10 ab; UC7 (Double/Split) und UC9 (XP/Level-Aufstieg) fehlen. Frontend deckt Auth, Leaderboard und Blackjack (ohne Double/Split, ohne Sidebet-UI) ab; Shop/Inventar/Wallet/Reward fehlen.

## 5. Logical View
### 5.1 Overview
Layered Feature-Folder-Architektur: Router/Controller/Schema/Service je Domäne, Entities im separaten Ordner, Cross-Cutting in Middlewares/Observability/Utils. Frontend spiegelt Domänenstruktur (Angular-Module für Auth, Blackjack Table/Hand/Controls, Leaderboard).

### 5.2 Architecture-Relevant Design Packages
- Backend-Domänenmodule: `auth`, `round`, `wallet`, `powerups`, `fairness`, `leaderboard`, `rewards`, `inventory`, `shop`, `user`, `observability`, `middlewares`, `utils`.  
- Kern-Entities (vgl. `db/schema.sql`, `src/entity/*`): User, Session, Round, Hand, Card, MainBet, SideBet + SidebetType, WalletTransaction, DailyRewardClaim, PowerupType, UserPowerup, PowerupConsumption. RNG-Daten (server_seed, server_seed_hash) hängen an Round; Ledger-Einträge referenzieren Bets/Rounds/Rewards.

### 5.3 Use Case Realizations
- UC1: AuthRouter/Controller mit Session-Repo, JWT/Refresh, Rate-Limits, Token-Rotation.  
- UC5/UC6: RoundRouter → Controller/Service → ACID-Transaktion (Round, Hands, MainBet, WalletTransaction) + RNG/Seed+Hash-Persistenz.  
- UC4: LeaderboardRouter → DB-Views (`leaderboard_balance|level|winnings`), anonym lesbar, optional persönlicher Rang mit Auth.  
- UC8: PowerupsRouter → Inventory/Consumption + optional Round-Verknüpfung; Wallet-Belastung transaktional.  
- UC3: RewardsRouter → `claimDailyReward` transaktional mit pessimistischer Sperre, Ledger-Eintrag und Idempotenz pro UTC-Tag.  
Weitere Realisierungen siehe Use-Case-Dokumente.

### 5.4 Class Diagram (Backend)
Das aktuelle DomAnenmodell (Entities, Beziehungen und Views) wird im folgenden Mermaid-Klassendiagramm dargestellt. Basis sind `db/schema.sql` und die Implementierung unter `Betception-Backend/src/entity`.

```mermaid
classDiagram
  direction LR

  class User {
    +string id
    +string username
    +string email
    +string passwordHash
    +string balance
    +int xp
    +int level
    +Date lastLoginAt?
    +string lastDailyRewardAt?
    +Date createdAt
  }

  class Session {
    +string id
    +User user
    +string refreshToken  // hashed
    +string userAgent?
    +string ip?
    +Date expiresAt
    +Date createdAt
  }
  User "1" o-- "*" Session

  class Round {
    +string id
    +RoundStatus status
    +string serverSeed
    +string serverSeedHash
    +Date startedAt
    +Date endedAt?
    +Date createdAt
  }

  class Hand {
    +string id
    +Round round
    +HandOwnerType ownerType
    +HandStatus status
    +int handValue?
  }
  Round "1" o-- "*" Hand
  User "1" o-- "*" Hand

  class Card {
    +string id
    +Hand hand
    +CardRank rank
    +CardSuit suit
    +int drawOrder
    +Date createdAt
  }
  Hand "1" o-- "*" Card

  class MainBet {
    +string id
    +Round round
    +Hand hand
    +User user
    +string amount  // decimal
    +MainBetStatus status
    +string payoutMultiplier?
    +string settledAmount?
    +Date settledAt?
    +Date createdAt
  }
  Round "1" o-- "1" MainBet
  User "1" o-- "*" MainBet

  class SidebetType {
    +int id
    +string code
    +string title
    +string description?
    +string baseOdds
  }

  class SideBet {
    +string id
    +Round round
    +User user
    +SidebetType type
    +string amount
    +SideBetStatus status
    +string odds?
    +SideBetColor predictedColor?
    +CardSuit predictedSuit?
    +CardRank predictedRank?
    +SideBetTargetContext targetContext
    +string settledAmount?
    +Date settledAt?
    +Date createdAt
  }
  Round "1" o-- "*" SideBet
  User "1" o-- "*" SideBet
  SidebetType "1" o-- "*" SideBet

  class WalletTransaction {
    +string id
    +User user
    +WalletTransactionKind kind
    +string amount
    +string refTable
    +string refId?
    +Date createdAt
  }
  User "1" o-- "*" WalletTransaction

  class DailyRewardClaim {
    +string id
    +User user
    +string claimDate
    +string amount
    +Date createdAt
  }
  User "1" o-- "*" DailyRewardClaim

  class PowerupType {
    +int id
    +string code
    +string title
    +string description?
    +int minLevel
    +string price
    +json effectJson
  }

  class UserPowerup {
    +string id
    +User user
    +PowerupType type
    +int quantity
    +Date acquiredAt
  }
  User "1" o-- "*" UserPowerup
  PowerupType "1" o-- "*" UserPowerup

  class PowerupConsumption {
    +string id
    +User user
    +PowerupType type
    +Round round?
    +Date createdAt
  }
  User "1" o-- "*" PowerupConsumption
  PowerupType "1" o-- "*" PowerupConsumption
  Round "1" o-- "*" PowerupConsumption

  class LeaderboardBalanceView {
    +string userId
    +string username
    +string balance
  }
  class LeaderboardLevelView {
    +string userId
    +int level
    +int xp
  }
  class LeaderboardWeeklyWinningsView {
    +string userId
    +string netWinnings7d
  }
```

## 6. Process View
- Auth-Flow: Middleware-Kette (CORS → RequestContext → RateLimit) → AuthRouter → Controller → Session-Repo (Hashing, Rotation) → JWT-Ausgabe; Logout/Refresh verwalten Sessions/Cookies.  
- Round/Bet: Router → Controller/Service → DB-Transaktion (Round+Hands+MainBet+WalletTransaction) → RNG (Seed+Hash) → Response; Idempotenzschlüssel verhindern Doppelbuchungen.  
- Sidebet/Power-Up: Router → Controller → Transaktion über Sidebet/Wallet oder Inventory/Consumption; Effekte werden im Round-Service berücksichtigt.  
- Leaderboards: Router → Views → Response; Auth optional für persönlichen Rang (anonyme GETs erlaubt).  
- Daily Reward: Router → `claimDailyReward` → Transaktion mit pessimistic lock auf User, Aktualisierung `last_daily_reward_at`, Claim- und Wallet-Eintrag; erneute Claims am gleichen UTC-Tag liefern 409.  
- Observability: RequestContext vergibt IDs, Logger schreibt JSON, `/metrics` liefert Snapshots; Feature-Toggle/API-Key schützt Docs/Metrics.

## 7. Deployment View
- Typische Topologie: Browser (SPA) → optional Nginx/API-Gateway → Node/Express-Container → MySQL-Container.  
- Laufzeit: `docker-compose` für Dev/CI/Prod-Parität; DB im internen Netzwerk isoliert; REST über HTTPS; Secrets via Environment; Migrationslauf beim Start.

## 8. Implementation View
### 8.1 Overview
Implementierung folgt Layering: Middleware/Router/Controller/Service/Entity, plus Utilities und Observability. CI/CD automatisiert Build, Tests und Migrationen.

### 8.2 Layers
- Transport/HTTP: Express, Router + Middlewares (CORS, Rate-Limit, RequestContext).  
- API/Controller: Orchestriert Use-Case-Flows, validiert mit Zod-Schemata.  
- Service/Domain: Geschäftslogik, Transaktionen, RNG, Power-Up-Effekte, Daily-Reward-Logik.  
- Persistence: TypeORM-Entities/Repos, ACID-Transaktionen, pessimistic locking.  
- Frontend: Angular-Module (Auth, Table/Hand/Controls, Leaderboard), HttpClient-Wrapper (`withCredentials`), Interceptor/Guard.  
- CI/CD & Ops: GitHub Actions, Dockerfiles/Compose, optional API-Key-Guards für Swagger/Metrics.

## 9. Data View
- Relationenschema: `db/schema.sql` mit Tabellen für Users, Sessions, Rounds, Hands, Cards, MainBets, SideBets, SidebetTypes, WalletTransactions, DailyRewardClaims, PowerupTypes, UserPowerups, PowerupConsumptions; Views für Leaderboards (Balance, Weekly Winnings, Level).  
- Eigenschaften: deterministische RNG-Attribute pro Round, Ledger-Referenzen (`ref_table`/`ref_id`), Indizes auf Round/User/Wallet; ACID-Transaktionen sichern Konsistenz.

## 10. Size and Performance
- Zielwerte: Round-Start p95 < 300 ms; Auth p95 < 600 ms; `/fairness` und Leaderboard-Reads < 300 ms.  
- Dimensionierung: ~100 gleichzeitige Sessions im Testbetrieb; zwei schreibende Transaktionen pro Spielaktion; Startbundle Frontend < 300 kB gzip (Ziel).  
- Maßnahmen: Async I/O, Connection-Pooling, Pagination, Indizes, reduzierte DTOs, Caching über DB-Views für Leaderboard.

## 11. Quality
- Zuverlässigkeit: ACID-Transaktionen, pessimistic locking, Idempotenz-Schlüssel.  
- Sicherheit: bcrypt/SHA-256, Token-Hardening, Rate-Limits, HttpOnly/SameSite-Cookies, API-Key-Guards, Feature-Toggles für sensible Routen.  
- Wartbarkeit/Erweiterbarkeit: Feature-Folder, klare Modulgrenzen, Zod-Validierung, parallele Angular-Struktur, ADRs/ASR als Leitplanken.  
- Beobachtbarkeit: Request-IDs, strukturierte Logs, `/metrics` Snapshots, optionale API-Key-Absicherung.  
- Deployment/Portabilität: Docker Compose, automatisierte Migrationen, CI/CD; reproduzierbare Umgebungen.  
- Fairness/Prüfbarkeit: RNG-Commitment (Seed+Hash) und `/fairness`-API erlauben Offline-Verifikation jeder Runde.
