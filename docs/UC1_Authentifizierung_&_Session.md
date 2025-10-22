# Use Case – Authentifizierung & Session Management

## 1. Brief Description
Dieser Use Case beschreibt die gesamte Benutzerverwaltung in **BetCeption** – von der **Registrierung** neuer Spieler, über den **Login** bestehender Konten bis hin zum **Logout** (Sitzungsende).  
Das Ziel ist die sichere Authentifizierung, Verwaltung von Sitzungen (Session/JWT-Token) und die Kontrolle des Zugriffs auf geschützte Bereiche der Anwendung.  

Nach erfolgreicher Anmeldung wird der Benutzer zur **Lobby** weitergeleitet. Beim ersten Login des Tages wird automatisch der **Daily Reward** aktiviert.

---

## 2. Akteure
- **Primärer Akteur:** Spieler (Benutzer)  
- **Sekundäre Akteure:**  
  - Authentifizierungs-Service (Node.js / Express)  
  - Datenbank (MySQL)  
  - Frontend (Angular)

---

## 3. Flow of Events

### 3.1 Registrierung
1. Der Benutzer öffnet die **Registrierungsseite**.  
2. Er gibt **Benutzername**, **E-Mail** und **Passwort** ein.  
3. Das System prüft die Eingaben auf Vollständigkeit und Format.  
4. Wenn Felder leer sind oder E-Mail ungültig ist, wird eine Fehlermeldung angezeigt:  
   *„Bitte füllen Sie alle Felder korrekt aus.“*  
5. Das System prüft, ob die E-Mail bereits registriert ist.  
6. Wenn nicht vorhanden, wird das Konto angelegt, das Passwort **gehasht** gespeichert und ein Startguthaben vergeben (z. B. 1000 Coins).  
7. Das System zeigt eine Bestätigungsmeldung:  
   *„Registrierung erfolgreich.“*  
8. Bei bereits registrierter E-Mail erscheint:  
   *„Ein Konto mit dieser E-Mail existiert bereits.“*  
9. Nach erfolgreicher Registrierung kann der Benutzer sich einloggen.

---

### 3.2 Login
1. Der Benutzer gibt auf der **Login-Seite** seine **E-Mail** und sein **Passwort** ein.  
2. Das System validiert die Eingaben.  
3. Es sucht in der Datenbank nach einem Benutzer mit der angegebenen E-Mail.  
4. Wird ein Konto gefunden, wird das Passwort mit dem gespeicherten Hash verglichen.  
5. Bei Erfolg wird eine **Session** oder ein **JWT-Token** erstellt.  
6. Der Benutzer wird zur **Startseite/Lobby** weitergeleitet.  
7. Wenn es der **erste Login des Tages** ist, wird der **Daily Reward** aktiviert.  
8. Bei falschen Anmeldedaten wird eine Fehlermeldung ausgegeben.

---

### 3.3 Logout
1. Der Benutzer klickt auf **„Logout“**.  
2. (Optional) Das System fragt nach einer Bestätigung.  
3. Nach Bestätigung wird das **Session-/JWT-Token ungültig gemacht**.  
4. Der Benutzer wird zur **Login-Seite** weitergeleitet.  
5. Das System zeigt eine Meldung:  
   *„Erfolgreich abgemeldet.“*  

**Alternative Flows:**  
- **Abbruch:** Benutzer bleibt eingeloggt.  
- **Token abgelaufen:** System zeigt *„Sitzung abgelaufen“* und leitet automatisch zum Login weiter.

---


## 4. Sequenzdiagramme (aktualisiert mit Aktivitätsbalken)


### Registrierung


### Login


### Logout




## 5. Special Requirements
- Kommunikation ausschließlich über **HTTPS**  
- **Passwörter gehasht** (z. B. bcrypt oder Argon2)  
- **JWT-Token signiert** und nach Inaktivität ablaufend (z. B. 2 Stunden)  
- **Client- und serverseitige Validierung** aller Eingaben  
- **E-Mail-Adresse eindeutig (unique)**  
- Nach Logout dürfen **keine gecachten Inhalte** mehr aufrufbar sein  
- Optional: **Rate-Limiting / Account-Lockout** bei zu vielen Fehlversuchen

---

## 6. Preconditions
- Benutzer befindet sich auf der **Login- oder Registrierungsseite**  
- Bei Login: Benutzerkonto existiert in der Datenbank  
- Bei Logout: Benutzer ist angemeldet

---

## 7. Postconditions
- **Nach Registrierung:** Neues Benutzerkonto wurde angelegt und gespeichert.  
- **Nach Login:** Benutzer ist authentifiziert, besitzt eine aktive Session/JWT und hat Zugriff auf geschützte Bereiche (z. B. Spiele, Leaderboard).  
- **Nach Logout:** Keine aktive Sitzung mehr, Zugriff auf geschützte Bereiche ist gesperrt.

---

## 8. Daten, die gespeichert oder synchronisiert werden
- Benutzername  
- E-Mail-Adresse  
- Passwort (gehasht)  
- Startguthaben  
- Erstellungsdatum  
- Letztes Login-Datum  
- Session/JWT-Token  
- (Optional) IP-Adresse  

Diese Daten werden serverseitig synchronisiert, um den Benutzerstatus aktuell zu halten.

---

## 9. Mockups

### Registrierung
<img width="538" height="511" alt="Screenshot 2025-10-20 193703" src="https://github.com/user-attachments/assets/f194f7e1-a29f-46a2-9040-9a6a36a2de37" />

### Login
<img width="753" height="606" alt="Screenshot 2025-10-20 201843" src="https://github.com/user-attachments/assets/7db6ebea-19cb-4483-9029-0dd537f0f8c5" />

---

## 10. Function Points
| Komponente               | Beschreibung                              | Punkte |
|--------------------------|--------------------------------------------|--------|
| Formularfelder           | Benutzername, E-Mail, Passwort             | 2      |
| Validierungslogik        | Eingabeprüfung                             | 1      |
| Authentifizierung        | Passwortprüfung + Token-Erstellung         | 4      |
| Datenbank-Operationen    | Benutzer anlegen, Login prüfen, Session speichern | 3 |
| Weiterleitung & Meldungen | Erfolgsmeldungen / Fehlermeldungen         | 1      |
| **Gesamt**               |                                            | **11 FP** |

---



---

## 11. Abhängigkeiten
- Daily Reward (wird beim ersten Login des Tages aktiviert)  
- UI-Komponenten (Angular) für Formulare, Fehlermeldungen und Bestätigungen  
- REST-API-Endpunkte für `/register`, `/login`, `/logout`  
- MySQL-Datenbank für Benutzerdaten

---

## 12. Zusammenfassung
Der Use Case **„Authentifizierung & Session Management“** gewährleistet:
- Sichere Registrierung und Authentifizierung  
- Kontrolle des Benutzerzugangs zu geschützten Bereichen  
- Schutz durch Token-basierte Sitzungsverwaltung  
- Grundlage für alle weiteren spielbezogenen Funktionen (z. B. Wetten, Daily Reward, Levelsystem)

---
