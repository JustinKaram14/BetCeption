# Utility Tree

Dieser Utility Tree fasst die wichtigsten Qualitaetsattribute fuer BetCeption zusammen. Er basiert auf den Anforderungen aus dem SRS (Kapitel 3) und den ASR aus `asr-3-step.md`. Jede Verzweigung enthaelt priorisierte Szenarien mit Einschaetzung des Risikos.


docs/assets/Utility/Utility.png


## Szenario-Details
| ID | Attribut | Stimulus & Umgebung | Erwartete Antwort | Response-Metrik | BP | Risiko | Eingesetzte Taktiken |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UT-R1 | Zuverlaessigkeit | Client verliert Verbindung direkt nach Einsatzbuchung. | Runde bleibt in konsistentem Status, Wallet zeigt nach Reload exakt einen Abzug. | Max. eine Buchung pro Round-ID (idempotent). | Hoch | Mittel | ACID-Transaktionen (`round.controller.ts`), Retry-safe APIs, Persistenz jedes Steps. |
| UT-R2 | Zuverlaessigkeit/Fairness | Spieler ruft `/fairness/{roundId}` fuer eine alte Runde auf. | Server liefert Hash+Seed und Zeitstempel, auch wenn Runde abgeschlossen ist. | 100 % der settled Runden verfuegbar. | Hoch | Niedrig | Persistente Seeds (`Round`-Entity), `fairness.controller.ts`, deterministische RNG-Utility. |
| UT-S1 | Sicherheit | Ein Angreifer feuert 200 Login-Requests/Min mit erratenen Passwoertern. | Rate-Limiter sperrt IP/Email nach 10 Fehlversuchen, Tokens bleiben geheim. | Max. 10 fehlgeschlagene Logins/5min pro Identitaet. | Hoch | Hoch | Globale + Auth-spezifische Rate-Limiter, Hashing fuer Passwoerter (`bcrypt`) und Refresh-Tokens (`hashToken`). |
| UT-P1 | Performance | 100 gleichzeitige Sessions starten neue Runden. | 95-%-Perzentil <300 ms, kein Request-Timeout. | P95 <300 ms fuer `/round/start`. | Hoch | Mittel | Asynchrones Node.js I/O, vorvalidierte DTOs, minimierte DB-Abfragen, Indizes auf Round/User. |
| UT-P2 | Performance/Skalierung | Leaderboard wird bei 10k Eintraegen abgefragt. | Backend liefert Seite `n` in <200 ms mit `pageSize` max. 50. | Pagination <200 ms p95. | Mittel | Mittel | TypeORM Pagination (`findAndCount`), Index auf Score/Balance, limitierte Projektion. |
| UT-O1 | Beobachtbarkeit | Betriebsteam untersucht Supportticket. | `/metrics` zeigt aktuelle Request-Zaehler, Durchschnittslatenzen und Fehlerquote, Logs tragen `X-Request-Id`. | Telemetrie abrufbar ohne Neustart, 100 % Requests mit ID. | Mittel | Niedrig | `observability/metrics.ts`, `requestContext` Middleware, strukturierte Logger. |
| UT-M1 | Wartbarkeit | PO fordert neue Sidebet-Formel. | Aenderung betrifft nur Round-Domaene (Engine + Tests), andere Module bleiben unveraendert. | Code-Anpassung <2 Dateien ausserhalb Round. | Mittel | Mittel | Feature-Folder-Struktur (`modules/round`), zentrale Services, Jest-Test-Suiten fuer Engine. |

Minestens fuenf Szenarien sind ausgearbeitet; weitere werden hinzugefuegt, sobald neue Risiken auftreten.
