```mermaid
flowchart TD
  U[Utility] --> R[Zuverlaessigkeit]
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
  S2 --> S2b[GET /fairness/{roundId}]

  P --> P1[Round-Start Latenz]
  P1 --> P1a[p95 < 300ms]
  P1 --> P1b[Async I/O, Indizes, Pagination]

  M --> M1[Modularitaet/Sidebet-Anpassung]
  M1 --> M1a[Feature-Module]
  M1 --> M1b[Zod-Validierung, Tests]

  O --> O1[Telemetrie & Verfuegbarkeit]
  O1 --> O1a[X-Request-Id]
  O1 --> O1b[/metrics per Toggle/API-Key]
```

