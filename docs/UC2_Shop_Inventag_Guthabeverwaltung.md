# Use Case – Shop, Inventar & Guthabenverwaltung

## 1. Brief Description
Dieser Use Case beschreibt alle Funktionen rund um das **In-Game-Ökosystem von BetCeption**, bestehend aus:
- dem **Shop** (Kauf von Power-Ups / Pillen),
- dem **Inventar** (Anzeige aller erworbenen, aber noch nicht verwendeten Items),
- sowie der **Guthabenverwaltung** (Einsicht, Historie und automatische Synchronisierung).

Ziel ist es, dem Spieler eine durchgängige Benutzererfahrung für den Erwerb, die Verwaltung und die Nutzung seiner Spielressourcen zu bieten.

---
## 1.2 Wireframe Mockups
![alt text](Wireframe-mockups/Mockup-pill-wireframe.png)
![alt text](Wireframe-mockups/Mockup-Balance-wireframe.png)
## 1.3 Mockups
![alt text](mockups/Pills-Mockup.png)
![alt text](mockups/Balance-Mockup.png)
---
## 2. Akteure
- **Primärer Akteur:** Spieler (eingeloggt)
- **Sekundäre Akteure:**  
  - Shop-Service (Node/Express)  
  - Inventar-Service  
  - Datenbank (MySQL)  
  - Frontend (Angular)

---

## 3. Flow of Events

### 3.1 Power-Ups / Pillen kaufen (Shop)
1. Spieler navigiert zum **Shop**.  
2. Das System zeigt verfügbare **Power-Ups** mit Preis und Level-Anforderung an.  
3. Spieler wählt ein Power-Up aus.  
4. Das System prüft:  
   - Hat der Spieler das erforderliche Level?  
   - Hat der Spieler genügend Guthaben?  
5. Wenn beide Bedingungen erfüllt sind:  
   - Der Betrag wird **vom Guthaben abgezogen**.  
   - Das Power-Up wird dem **Inventar** hinzugefügt.  
6. System zeigt eine Bestätigungsmeldung an.  

**Alternative Flows:**  
- **Nicht genügend Guthaben:** Fehlermeldung *„Nicht genügend Coins“*.  
- **Level zu niedrig:** Power-Up bleibt gesperrt mit Hinweis auf benötigtes Level.  
- **Serverfehler:** Kauf wird abgebrochen, keine Transaktion.  

---

### 3.2 Inventar anzeigen
1. Spieler öffnet das **Inventar-Menü**.  
2. Das System überprüft den **Login-Status**.  
3. Das System ruft alle Power-Ups aus der Datenbank ab, die dem Spieler gehören und noch nicht verbraucht sind.  
4. Das Inventar zeigt:  
   - **Icons, Namen, Effekte, Verfügbarkeit** der Power-Ups.  
   - Sortieroptionen nach **Kategorie oder Level**.  
5. Spieler kann Details zu einzelnen Power-Ups einsehen.  

**Alternative Flows:**  
- Kein Power-Up vorhanden → leere Anzeige mit *„Keine Power-Ups vorhanden“*.  
- Verbindungsfehler → Fehlermeldung, Inventar bleibt leer.  

---

### 3.3 Guthaben anzeigen / verwalten
1. Spieler öffnet die **Guthaben-Seite**.  
2. System überprüft Login.  
3. System ruft den **aktuellen Kontostand** aus der Datenbank ab.  
4. System zeigt:  
   - **Gesamtguthaben**,  
   - **Transaktionshistorie** (Wetten, Gewinne, Käufe, Belohnungen).  
5. Spieler kann Filter und Details anzeigen (z. B. Zeitraum oder Transaktionstyp).  

**Alternative Flows:**  
- **Verbindungsfehler / Serverfehler:** Fehlermeldung, Daten nicht aktualisiert.  
- **Keine Transaktionen vorhanden:** Hinweis *„Keine Transaktionen verfügbar“*.  

---

## 4. Sequenzdiagramme
## 4.1 Power-Up kaufen
![alt text](<Sequenzdiagramme/Sequenzdiagramm Powerups kaufen.png>)

## 4.2 Inventar anzeigen
![alt text](<Sequenzdiagramme/Sequenzdiagramm Inventar anzeigen.png>)

## 4.3 Guthaben anzeigen
![alt text](<Sequenzdiagramme/Sequenzdiagramm Guthaben anzeigen-verwalten.png>)



## 5. Aktivitätsdiagramm
## 5.1 Power-Up kaufen
![alt text](<Aktivitätsdiagramme/Aktivitätsdiagramm power-up.png>)
## 5.2 Inventar anzeigen
![alt text](<Aktivitätsdiagramme/Aktivitätsdiagramm inventar-anzeigen.png>)
## 5.3 Guthaben anzeigen
![alt text](<Aktivitätsdiagramme/Aktivitätsdiagramm Guthaben.png>)
---

## 6. Special Requirements
- **Echtzeit-Synchronisation** zwischen Client und Server.  
- **Transaktionssicherheit:** Alle Käufe atomar (ACID).  
- **Sortierung und Filterung** im Inventar und der Transaktionsliste.  
- **Level-Validierung** bei Power-Up-Käufen.  
- **Serverseitige Berechnung** des Guthabens (kein Vertrauen in Client-Daten).  
- **Audit-Logs** für Käufe und Transaktionen.

---

## 7. Preconditions
- Spieler ist **eingeloggt**.  
- Für Käufe: ausreichendes Guthaben und erforderliches Level.  

---

## 8. Postconditions
- **Nach Kauf:** Power-Up im Inventar, Guthaben reduziert.  
- **Nach Inventarabruf:** Liste der Items angezeigt.  
- **Nach Guthabenabruf:** Kontostand & Transaktionshistorie aktualisiert.  

---

## 9. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|--------------|--------|
| Power-Up-Kauf | Level- & Guthabenprüfung, Kauf-Transaktion | 3 |
| Inventar-Anzeige | Datenabfrage, Sortierung, UI | 2 |
| Guthabenverwaltung | Kontostand, Historie, Filter | 3 |
| Fehler- & Synchronisationslogik | Fehlermeldungen, Realtime-Update | 1 |
| **Gesamt** |  | **9 FP** |

---

## 10. Abhängigkeiten
- **Authentifizierung & Session Management** (Tokenprüfung)  
- **Spiel- & Levelsystem** (Levelanforderungen)  
- **MySQL-Datenbank** (Inventar, Transaktionen, Guthaben)  
- **Frontend-Komponenten** (Shop-, Inventar- und Wallet-Views)

---

