# Architektur-Blog: Transparente Runden & harte Leitplanken

**TL;DR:** Wir haben unsere Architecture Significant Requirements (ASR), Utility-Tree-Szenarien und die daraus folgenden Entscheidungen verschriftlicht. Kernideen: deterministische Spielengine, transaktionssicheres Wallet, gehaertete Auth-Flows sowie Feature-Toggles fuer Docs & Metrics.

## Warum das wichtig ist
- **Fair Play als USP:** Blackjack-Runden sind nur dann glaubwuerdig, wenn jede Karte nachvollziehbar ist. Deshalb verpflichten wir uns (ASR-1) auf serverseitige Seeds + SHA-256-Commitment und geben sie ueber `/fairness` frei.
- **Guthaben ist heilig:** Obwohl kein Echtgeld fliesst, fuehrt jede fehlerhafte Buchung zu Frust. Wallet-Eintraege laufen jetzt strikt durch ACID-Transaktionen und werden doppelt referenziert (`wallet_transactions`).
- **Security-by-default:** JWT + Refresh-Cookies (= HttpOnly, Secure, SameSite) plus Rate-Limiter auf Auth-Routen reduzieren Brute-Force- und Replay-Risiken. Beobachtbarkeit (Request-ID, `/metrics`) ist direkt mitgedacht.
- **Wachsende Codebasis im Griff:** Feature-Module im Backend decken 1:1 Angular-Module im Frontend. Neue Sidebets oder Rewards landen so ohne Cross-Cutting-Aenderungen in ihrer Domaene.

## Was wir konkret liefern
1. `docs/architecture/asr-3-step.md` - dokumentiert den 3-Schritte-Ansatz inkl. Treiber, Szenarien und ASR.
2. `docs/architecture/utility-tree.md` - Utility Tree mit sieben priorisierten Szenarien (Reliability, Security, Performance, Observability, Wartbarkeit).
3. `docs/architecture/architecture-decisions.md` - tabellarische Uebersicht ueber Entscheidungen, Taktiken und Muster.

Alle drei Artefakte sind lebende Dokumente und dienen dem gesamten Kurs als Referenz.

## Auswirkungen auf andere Teams
- **Integration & Tests:** Public APIs bleiben stabiler, weil wir nur ueber klar definierte Module erweitern. Nutzt unsere Fairness-API als Blaupause, wenn ihr aehnliche Verifizierbarkeit braucht.
- **Security-Standards:** Bitte uebernehmt die Rate-Limiter + Token-Strategie fuer andere Services, damit Frontend & Backend ein homogenes Sicherheitsniveau haben.
- **DevOps:** Docker-Compose + GitHub Actions stellen sicher, dass Migrationen automatisch laufen. Wer mit unserer DB interagiert, bekommt dadurch reproduzierbare Umgebungen.

## Naechste Schritte
- Utility-Tree zyklisch mit echten Messergebnissen anreichern (Metriken an Jira/YouTrack koppeln).
- ADRs fuer neue Features (Daily Reward, Leaderboard) auf Basis der ASR entwerfen.
- Beobachtbarkeit weiter ausbauen (Tracing, Alarmierung) sobald das Backend produktionsnah laeuft.

Fragen oder Ideen? Meldet euch im Teamchat - insbesondere, wenn ihr eigene Taktiken oder Patterns beisteuern wollt.
