## Utility Tree

Der Utility Tree folgt der Struktur aus den Vorlesungsfolien (Quality Attribute → Refinement → Quality Attribute Scenario → Business Value → Technical Risk). Alle Szenarien sind in der 6-Part-Form beschrieben und referenzieren das Diagramm.

```mermaid
flowchart TD
  U[Utility] --> R[Zuverlässigkeit]
  U --> S[Sicherheit]
  U --> P[Performance]
  U --> M[Wartbarkeit]
  U --> O[Beobachtbarkeit]

  R --> R1[Konsistente Wallet-Buchungen]
  R1 --> R1a[Quelle: Spieler-Client]
  R1 --> R1b[Stimulus: Verbindungsabbruch nach Einsatz]
  R1 --> R1c[Reaktion: <=1 Buchung, Reload <1s]

  S --> S1[Zugriffsschutz & Missbrauch]
  S1 --> S1a[Rate-Limits Login/Refresh]
  S1 --> S1b[HttpOnly Refresh, gehashte Tokens]
  S --> S2[Auditierbare Fairness]
  S2 --> S2a[Seed+Hash pro Runde]
  S2 --> S2b["GET /fairness/{roundId}"]

  P --> P1[Round-Start Latenz]
  P1 --> P1a[p95 < 300ms]
  P1 --> P1b[Async I/O, Indizes, Pagination]

  M --> M1[Modularität/Sidebet-Anpassung]
  M1 --> M1a[Feature-Module]
  M1 --> M1b[Zod-Validierung, Tests]

  O --> O1[Telemetrie & Verfügbarkeit]
  O1 --> O1a[X-Request-Id]
  O1 --> O1b["/metrics per Toggle/API-Key"]
```

| Quality attribute | Refinement | Quality attribute scenario (6-Part Form) | Business value | Technical risk |
| --- | --- | --- | --- | --- |
| Zuverlässigkeit | Konsistente Wallet-Buchungen | **Quelle:** Spieler-Client. **Stimulus:** Browser verliert direkt nach Einsatzreservierung die Verbindung. **Artefakt:** Round-/Wallet-Service. **Umgebung:** Runde `IN_PROGRESS`. **Reaktion:** Backend rekonstruiert den Status, Einsätze werden höchstens einmal gebucht. **Messung:** <= 1 Wallet-Buchung pro Round-ID, Reload liefert Status <1 s. | Hoch | Mittel |
| Sicherheit | Auditierbarer Fairness-Nachweis | **Quelle:** Spieler:in. **Stimulus:** `GET /fairness/{roundId}` nach Abschluss. **Artefakt:** Fairness-API & Round-Datensatz. **Umgebung:** Runde `SETTLED`. **Reaktion:** Server liefert `serverSeed`, Hash und Zeitstempel zur Offline-Verifikation. **Messung:** 100 % settled Runden liefern Matching Hash & Seed. | Hoch | Mittel |
| Sicherheit | Zugriffsschutz & Missbrauchsprävention | **Quelle:** Angreifer:in. **Stimulus:** 200 Login-Versuche/min mit falschen Credentials. **Artefakt:** Auth-API (`/auth/login`, `/auth/refresh`). **Umgebung:** Normalbetrieb. **Reaktion:** Rate-Limiter blockt IP/E-Mail nach 10 Fehlversuchen, Fehlermeldungen bleiben generisch. **Messung:** Max. 10 Fehlversuche/5 min pro Identität. | Hoch | Hoch |
| Performance | Round-Start-Latenz | **Quelle:** 100 parallele Sessions. **Stimulus:** `POST /round/start`. **Artefakt:** Round-Start-Endpunkt + DB. **Umgebung:** Normalbetrieb, produktionsnahe Datenbank. **Reaktion:** Antworten bleiben schnell und vollständig. **Messung:** p95 < 300 ms, keine Timeouts. | Hoch | Mittel |
| Wartbarkeit | Lokale Anpassung der Sidebet-Engine | **Quelle:** Entwickler:in. **Stimulus:** Neue Sidebet-Regel wird implementiert. **Artefakt:** Round-Modul (Engine + Tests). **Umgebung:** Design-/Implementierungsphase. **Reaktion:** Änderung bleibt auf Domäne beschränkt und ist testbar. **Messung:** < 2 Dateien außerhalb `modules/round` betroffen, Tests grün. | Mittel | Mittel |
| Verfügbarkeit & Beobachtbarkeit | Telemetrie für Incident Response | **Quelle:** On-Call. **Stimulus:** Supportticket verlangt Ursachenanalyse. **Artefakt:** `/metrics` + strukturierte Logs. **Umgebung:** Produktion mit Monitoring. **Reaktion:** Telemetrie & Logs liefern Request-IDs, Fehler- & Latenzwerte. **Messung:** 100 % Requests mit `X-Request-Id`, `/metrics` antwortet <1 s. | Mittel | Niedrig |

- Umgesetzt: ACID-Transaktionen mit Locks für Round/Wallet/Shop/Powerup/Daily-Reward; deterministische RNG + Fairness-API; Auth mit Rate-Limits + Refresh-Cookies; Metrics/Docs per Feature-Flag/API-Key.
