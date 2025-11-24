# Architektur-Blog: Transparente Runden & harte Leitplanken

**TL;DR:** Wir haben unsere Architecture Significant Requirements (ASR), Utility-Tree-Szenarien und die daraus folgenden Entscheidungen verschriftlicht. Kernideen: deterministische Spielengine, transaktionssicheres Wallet, gehärtete Auth-Flows sowie Feature-Toggles für Docs & Metrics.

## Warum das wichtig ist
- **Fair Play als USP:** Blackjack-Runden sind nur dann glaubwürdig, wenn jede Karte nachvollziehbar ist. Deshalb verpflichten wir uns (ASR-1) auf serverseitige Seeds + SHA-256-Commitment und geben sie über `/fairness` frei.
- **Guthaben ist heilig:** Obwohl kein Echtgeld fließt, führt jede fehlerhafte Buchung zu Frust. Wallet-Einträge laufen jetzt strikt durch ACID-Transaktionen und werden doppelt referenziert (`wallet_transactions`).
- **Security-by-default:** JWT + Refresh-Cookies (= HttpOnly, Secure, SameSite) plus Rate-Limiter auf Auth-Routen reduzieren Brute-Force- und Replay-Risiken. Beobachtbarkeit (Request-ID, `/metrics`) ist direkt mitgedacht.
- **Wachsende Codebasis im Griff:** Feature-Module im Backend decken 1:1 Angular-Module im Frontend. Neue Sidebets oder Rewards landen so ohne Cross-Cutting-Änderungen in ihrer Domäne.

## Was wir konkret liefern
1. `docs/architecture/asr-3-step.md` - dokumentiert den 3-Schritte-Ansatz inkl. Treiber, Szenarien und ASR.
2. `docs/architecture/utility-tree.md` - Utility Tree mit sieben priorisierten Szenarien (Reliability, Security, Performance, Observability, Wartbarkeit).
3. `docs/architecture/architecture-decisions.md` - tabellarische Übersicht über Entscheidungen, Taktiken und Muster.

Alle drei Artefakte sind lebende Dokumente und dienen dem gesamten Kurs als Referenz.

## Auswirkungen auf andere Teams
- **Integration & Tests:** Public APIs bleiben stabiler, weil wir nur über klar definierte Module erweitern. Nutzt unsere Fairness-API als Blaupause, wenn ihr ähnliche Verifizierbarkeit braucht.
- **Security-Standards:** Bitte übernehmt die Rate-Limiter + Token-Strategie für andere Services, damit Frontend & Backend ein homogenes Sicherheitsniveau haben.
- **DevOps:** Docker-Compose + GitHub Actions stellen sicher, dass Migrationen automatisch laufen. Wer mit unserer DB interagiert, bekommt dadurch reproduzierbare Umgebungen.

## Nächste Schritte
- ADRs für neue Features (Daily Reward, Leaderboard) auf Basis der ASR entwerfen.
- Beobachtbarkeit weiter ausbauen (Tracing, Alarmierung), sobald das Backend produktionsnah läuft.
