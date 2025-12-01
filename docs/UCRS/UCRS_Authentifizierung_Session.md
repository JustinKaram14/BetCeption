## Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 2025-10-27 | 0.0 | UCRS erstellt | Team BetCeption|
| 2025-12-01 | 1.1 | Abgleich mit aktuellem Code (JWT/Refresh, Sessions) | Team BetCeption |

# BetCeption  
## Use-Case-Realization Specification: Authentifizierung & Session Management  
Version 1.1  

---

### Revision History
| Date | Version | Description | Author |
|------|----------|--------------|--------|
| 27/10/2025 | 1.0 | Initiale Erstellung | Team BetCeption |

---

## 1. Introduction
Diese UCRS beschreibt die technische Realisierung der Authentifizierungs- und Session-Verwaltung in **BetCeption**.  
Sie deckt Registrierung, Login, Logout und die Middleware-Pruefung von JWT-Tokens ab.

### 1.1 Purpose
Ziel ist die sichere Identifikation und Verwaltung von Benutzerkonten, Sessions und Zugriffen auf geschuetzte Ressourcen innerhalb der Webapplikation.

### 1.2 Scope
Diese Realisierung betrifft:
- Registrierung, Login, Logout (Use Cases UC1-UC3)
- Session-Handling via JWT + Refresh-Cookies
- Middleware-Authentifizierung fuer API-Zugriffe

### 1.3 Definitions, Acronyms, and Abbreviations
- **JWT** - JSON Web Token  
- **BCrypt** - Hash-Algorithmus zur sicheren Passwortspeicherung  
- **UC** - Use Case  

### 1.4 References
- SRS BetCeption, Kapitel 3.1-3.4  
- Use Case Diagramm "Authentifizierung"  
- Sequenzdiagramme siehe Abschnitt 2  

### 1.5 Overview
Der Fokus liegt auf der technischen Sequenz und den kollaborierenden Komponenten zwischen **Frontend (Angular)**, **Backend (Express)** und **MySQL**.

---

## Implementierungsstand (aktueller Code)
- **Backend:** `/auth/register` prueft doppelte E-Mail/Username und legt Nutzer mit gehashtem Passwort + Startguthaben an. `/auth/login` setzt `lastLoginAt`, liefert `accessToken` im Body, setzt einen HttpOnly-Refresh-Cookie auf `/auth/refresh` und speichert den gehashten Refresh-Token (inkl. UA/IP/Expiry) in `sessions`. `/auth/refresh` rotiert Refresh-Token und Hash. `/auth/logout` loescht den gespeicherten Hash und das Cookie; Access-Token laeuft clientseitig aus. Auth-Middleware erwartet `Authorization: Bearer <access>`; GET `/leaderboard/*` ist fuer Gaeste offen.
- **Frontend:** AuthPanel auf der Startseite nutzt `AuthFacade` (Access-Token in LocalStorage, Refresh per Cookie). Dedizierte Login-/Register-Seiten sind Platzhalter. Daily Reward wird **nicht** automatisch beim Login ausgeloest.
- **Abweichungen:** Kein Account-Lockout/MFA/Device-Bindung; Logout blacklisted keine Access-Tokens, verlaesst sich auf Ablauf/Client-Loeschung.

## 2. Flow of Events - Design

### 2.1 Registrierung
1. Spieler oeffnet Registrierungsseite.  
2. Gibt Benutzername, E-Mail, Passwort ein.  
3. Frontend validiert Eingaben.  
4. Backend prueft, ob E-Mail existiert.  
5. Wenn neu -> Passwort wird gehasht und Benutzer angelegt.  
6. Datenbank speichert Datensatz (Benutzername, E-Mail, Hash, Startguthaben).  
7. Bestaetigung wird ans Frontend gesendet.  
8. Bei Fehlern (z. B. E-Mail bereits vergeben) wird eine Fehlermeldung angezeigt.  

**Sequenzdiagramm: Registrierung**  
![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Regestrieren.png>)

---

### 2.2 Login
1. Spieler oeffnet Login-Seite und gibt E-Mail + Passwort ein.  
2. Frontend prueft Eingaben.  
3. Backend sucht Benutzerkonto per E-Mail.  
4. Wenn gefunden -> Passwort wird mit Hash verglichen.  
5. Bei Erfolg wird ein Access-JWT erzeugt und ein Refresh-Token (HttpOnly-Cookie auf `/auth/refresh`) gesetzt; der Refresh wird gehasht in `sessions` gespeichert.  
6. Access-Token wird im Frontend (LocalStorage) gespeichert.  
7. Benutzer wird zur Lobby weitergeleitet.  
8. Daily Reward wird **nicht** automatisch aktiviert (separater Call `/rewards/daily/claim`).  

**Sequenzdiagramm: Login**  
![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Login.png>)

---

### 2.3 Authentifizierung (Middleware)
1. Frontend sendet API-Anfrage mit JWT im Header.  
2. Middleware prueft Signatur, Ablaufzeit, Gueltigkeit.  
3. Gueltige Token -> Zugriff erlaubt.  
4. Ungueltige Token -> Antwort 401 Unauthorized (GET `/leaderboard/*` ist als Ausnahme offen).  
5. Abgelaufene Token fuehren zu Fehlermeldung/Logout.  

---

### 2.4 Logout
1. Spieler klickt "Logout".  
2. (Optional) System fragt nach Bestaetigung.  
3. Backend erhaelt Logout-Anfrage, loescht den gespeicherten Refresh-Hash und das HttpOnly-Cookie.  
4. Frontend loescht das Access-Token aus dem Speicher.  
5. Benutzer wird zur Login-Seite weitergeleitet.  

**Sequenzdiagramm: Logout**  
![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Logout.png>)

---

## 3. Derived Requirements
- Passwoerter muessen mit **bcrypt** oder **Argon2** gehasht werden.  
- Alle Anfragen ueber **HTTPS**.  
- JWT muss signiert und zeitlich begrenzt sein.  
- Middleware prueft Authentifizierung bei jedem API-Aufruf.  
- Refresh-Tokens werden gehasht gespeichert und nach Logout entfernt.  
- UI-Fehler-Feedback fuer alle Authentifizierungsschritte.  
- Optional: Account-Lockout bei zu vielen Fehlversuchen.  
