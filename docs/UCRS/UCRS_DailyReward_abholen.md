# BetCeption  
## Use-Case-Realization Specification: Daily Reward abholen  
Version 1.0  

---

### Revision History
Date: 27/10/2025  
Version: 1.0  
Description: Initiale Erstellung  
Author: Team BetCeption  

---


## 1. Introduction
Diese UCRS beschreibt die technische Realisierung des Use-Case „Daily Reward abholen“ in BetCeption.  
Ziel ist es, den Ablauf zwischen Frontend, Backend und Datenbank zu dokumentieren, durch den ein Spieler seine tägliche Belohnung abrufen kann.

### 1.1 Purpose
Ziel ist die Implementierung eines Systems, das Spielern ermöglicht, alle 24 Stunden eine Belohnung zu beanspruchen.  
Dieses Dokument beschreibt die technische Interaktion zwischen Angular-Frontend, Express-Backend und MySQL-Datenbank.

### 1.2 Scope
Der Use Case deckt den Ablauf des täglichen Belohnungsvorgangs ab – vom Klick im Frontend über die Backend-Logik bis zur Speicherung in der Datenbank.  
Er berücksichtigt sowohl erfolgreiche als auch fehlerhafte Versuche (z. B. wenn die 24-Stunden-Frist noch nicht verstrichen ist).

### 1.3 Definitions, Acronyms, and Abbreviations
Spieler: Endnutzer, der eine Belohnung beansprucht  
Frontend: Angular-basierte Benutzeroberfläche  
Reward-Service: Express-Backend-Komponente, zuständig für Belohnungslogik  
DB: MySQL-Datenbank  
Token: Authentifizierungstoken des Spielers  
eligible_at: Zeitstempel, ab wann der Spieler erneut berechtigt ist  

### 1.4 References
Use Case Specification: UC3_DailyReward.md  
UML-Sequenzdiagramm „Daily Reward abholen“  
Projektarchitektur BetCeption-System  

### 1.5 Overview
Kapitel 2 beschreibt den technischen Ablauf basierend auf dem Sequenzdiagramm.  
Kapitel 3 enthält die abgeleiteten funktionalen und nicht-funktionalen Anforderungen.

---

## 2. Flow of Events — Design

### 2.1 Overview
Der Spieler kann einmal alle 24 Stunden eine Belohnung beanspruchen. Der Reward-Service prüft anhand des gespeicherten Zeitstempels, ob der Spieler berechtigt ist, und vergibt bei Erfolg eine Gutschrift.

### 2.2 Participating Objects
Spieler: initiiert den Prozess durch Klick auf „Claim“  
Frontend (Angular): sendet Anfrage mit JWT und zeigt Rückmeldung an  
Reward-Service (Backend): prüft Anspruch, berechnet Belohnung, aktualisiert Guthaben  
Datenbank (MySQL): speichert Zeitstempel last_daily_reward_at, Guthaben, Transaktionslog  

### 2.3 Flow Description
1. Spieler klickt im UI auf „Claim“  
2. Frontend sendet eine POST-Anfrage an den Reward-Service mit dem User-Token  
3. Reward-Service liest last_daily_reward_at aus der Datenbank  
4. Prüft, ob seitdem mehr als 24 Stunden vergangen sind  
   - Wenn nicht berechtigt → Antwort 400 Not Eligible + eligible_at  
   - Frontend zeigt Countdown zur nächsten Belohnung  
5. Wenn berechtigt → Belohnung wird berechnet (fix oder zufällig)  
6. Guthaben wird aktualisiert, neuer Zeitstempel gespeichert, Transaktion geloggt  
7. Backend sendet 201 Created mit claimed_amount, new_balance, eligible_at  
8. Frontend zeigt Erfolgsnachricht (+250 Coins erhalten!)  

### 2.4 Sequence Diagram
![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Daily-Reward.png>)
---

## 3. Derived Requirements
Das System muss sicherstellen, dass keine doppelte Beanspruchung einer täglichen Belohnung erfolgen kann.  
Transaktionen müssen atomar ausgeführt werden, und die Antwortzeit soll unter einer Sekunde liegen.