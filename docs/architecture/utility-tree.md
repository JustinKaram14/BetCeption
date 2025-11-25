# Utility Tree

Dieser Utility Tree fasst die wichtigsten Qualitätsattribute (gemäß Vorlesung: Reliabilität, Performance, Sicherheit, Wartbarkeit, Verfügbarkeit/Beobachtbarkeit) für BetCeption zusammen. Er basiert auf `asr-3-step.md`. Jedes Szenario ist in der 6-Part Form (Quelle, Stimulus, Artefakt, Umgebung, Reaktion, Messung) beschrieben und priorisiert nach Business Value (BP) und Risiko (R).

![Utility Tree](../assets/Utility/Utility.png)

## Szenario-Details (6-Part Form)
| ID | Qualitätsattribut | Quelle | Stimulus | Artefakt | Umgebung | Reaktion | Messung | BP | R | Eingesetzte Taktiken |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UT-R1 | Zuverlässigkeit (Datenkonsistenz) | Spieler-Client | Browser verliert direkt nach Einsatzreservierung die Verbindung | Round-/Wallet-Service | Runde `IN_PROGRESS` | Backend rekonstruiert den Status, Einsätze maximal einmal verbucht | ≤ 1 Wallet-Buchung pro Round-ID, Reload liefert Status <1 s | Hoch | Mittel | ACID-Transaktionen (`AppDataSource.transaction`), pessimistic locking, Retry-safe APIs |
| UT-S1 | Sicherheit (Integrität & Auditierbarkeit) | Spieler:in | `GET /fairness/{roundId}` nach Abschluss | Fairness-API & Round-Datensatz | Runde `SETTLED` | Server liefert `serverSeed`, Hash und Zeitstempel zur Offline-Verifikation | 100 % settled Runden liefern Matching Hash & Seed | Hoch | Mittel | Persistente Seeds (`Round`), `fairness.controller.ts`, deterministische RNG (`fairness.utils.ts`) |
| UT-S2 | Sicherheit (Zugriffsschutz) | Angreifer:in | 200 Login-Versuche/min mit falschen Credentials | Auth-API (`/auth/login`, `/auth/refresh`) | Normalbetrieb | Rate-Limiter blockt IP/Email nach 10 Fehlversuchen, Responses bleiben generisch | Max. 10 Fehlversuche/5 min pro Identität | Hoch | Hoch | Globale & Auth-spezifische Rate-Limiter, `hashPassword`, `hashToken`, Logging |
| UT-P1 | Performance | 100 parallele Sessions | `POST /round/start` | Round-Start-Endpunkt | Normalbetrieb mit produktionsnaher DB | Antworten bleiben schnell und komplett | p95 < 300 ms, keine Timeouts | Hoch | Mittel | Asynchrones Node.js I/O, minimale DB-Queries, Indizes, DTOs |
| UT-M1 | Wartbarkeit / Modifizierbarkeit | Entwickler:in | Neue Sidebet-Regel implementieren | Round-Modul (Engine + Tests) | Design-/Implementierungsphase | Änderung bleibt lokal & testbar | <2 Dateien außerhalb `modules/round`, Tests grün | Mittel | Mittel | Feature-Folder-Struktur, Zod-Schemata, Jest-Suites |
| UT-O1 | Verfügbarkeit & Beobachtbarkeit | On-Call | Supportticket verlangt Ursachenanalyse | `/metrics` + strukturierte Logs | Produktion, Monitoring aktiv | Telemetrie & Logs liefern Request-IDs, Fehler- & Latenzwerte | 100 % Requests mit `X-Request-Id`, `/metrics` antwortet <1 s | Mittel | Niedrig | `requestContext`, `observability/metrics.ts`, strukturierte Logger, Feature-Toggles |

Mindestens fünf Szenarien sind ausgearbeitet; weitere werden ergänzt, sobald neue Risiken auftreten.
