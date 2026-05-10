import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type LanguageCode = 'de' | 'en' | 'es' | 'fr';

type TranslationKey =
  | 'auth.createAccount'
  | 'auth.emailDisposable'
  | 'auth.emailDomainInvalid'
  | 'auth.emailDomainUnavailable'
  | 'auth.emailInvalid'
  | 'auth.emailPlaceholder'
  | 'auth.login'
  | 'auth.passwordPlaceholder'
  | 'auth.passwordTooShort'
  | 'auth.register'
  | 'auth.submitLogin'
  | 'auth.usernameInvalid'
  | 'auth.usernamePlaceholder'
  | 'blackjack.actionFailed'
  | 'blackjack.completed'
  | 'blackjack.dealerBlackjack'
  | 'blackjack.dealerBust'
  | 'blackjack.dealerStands'
  | 'blackjack.finishedHeadline'
  | 'blackjack.lostHeadline'
  | 'blackjack.lostNewRound'
  | 'blackjack.newRound'
  | 'blackjack.pushHeadline'
  | 'blackjack.pushBetBack'
  | 'blackjack.quit'
  | 'blackjack.refunded'
  | 'blackjack.setBetError'
  | 'blackjack.won'
  | 'blackjack.wonHeadline'
  | 'blackjack.wonPayout'
  | 'betception.available'
  | 'betception.betceptionPayout'
  | 'betception.bigWin'
  | 'betception.blackjackBet'
  | 'betception.blackjackShort'
  | 'betception.blackjackSubtitle'
  | 'betception.blackjackTitle'
  | 'betception.cardExactShort'
  | 'betception.cardExactSubtitle'
  | 'betception.cardExactTitle'
  | 'betception.cardBets'
  | 'betception.cardSuitBet'
  | 'betception.cardSuitShort'
  | 'betception.cardSuitSubtitle'
  | 'betception.cardSuitTitle'
  | 'betception.clearSelection'
  | 'betception.confirmAndDeal'
  | 'betception.continueWithout'
  | 'betception.dealerBustBet'
  | 'betception.dealerBustShort'
  | 'betception.dealerBustSubtitle'
  | 'betception.dealerBustTarget'
  | 'betception.dealerBustTitle'
  | 'betception.depthLevel'
  | 'betception.finalPayout'
  | 'betception.hit'
  | 'betception.mainBet'
  | 'betception.megaWin'
  | 'betception.miss'
  | 'betception.pending'
  | 'betception.pillShort'
  | 'betception.pillSubtitle'
  | 'betception.pillTitle'
  | 'betception.pillBet'
  | 'betception.pillUnavailable'
  | 'betception.refund'
  | 'betception.selectedCard'
  | 'betception.selectedSuit'
  | 'betception.sideBetTotal'
  | 'betception.splitCountBet'
  | 'betception.splitCountOption'
  | 'betception.splitCountShort'
  | 'betception.splitCountSubtitle'
  | 'betception.splitCountTitle'
  | 'betception.subtitle'
  | 'betception.superWin'
  | 'betception.suitClubs'
  | 'betception.suitDiamonds'
  | 'betception.suitHearts'
  | 'betception.suitSpades'
  | 'betception.title'
  | 'betception.totalPayout'
  | 'betception.winCelebration'
  | 'common.cancel'
  | 'common.close'
  | 'common.coins'
  | 'common.dealer'
  | 'common.home'
  | 'common.howToPlay'
  | 'common.language'
  | 'common.ok'
  | 'common.player'
  | 'common.playerSplit'
  | 'common.settings'
  | 'controls.balance'
  | 'controls.bet'
  | 'controls.deal'
  | 'controls.double'
  | 'controls.hit'
  | 'controls.reset'
  | 'controls.round'
  | 'controls.settle'
  | 'controls.split'
  | 'controls.stand'
  | 'crate.continue'
  | 'crate.empty'
  | 'crate.errorAlreadyOpened'
  | 'crate.errorNotFound'
  | 'crate.errorUnauthenticated'
  | 'crate.inventory'
  | 'crate.level'
  | 'crate.loadError'
  | 'crate.loading'
  | 'crate.open'
  | 'crate.opened'
  | 'crate.openError'
  | 'crate.opening'
  | 'crate.pillFallback'
  | 'crate.rewardReceived'
  | 'crate.tier.common'
  | 'crate.tier.epic'
  | 'crate.tier.rare'
  | 'crate.tierBadge'
  | 'crate.levelUpReceived'
  | 'crate.levelUpTitle'
  | 'crate.title'
  | 'crate.unopened'
  | 'daily.alreadyCopy'
  | 'daily.alreadyTitle'
  | 'daily.availableNow'
  | 'daily.balance'
  | 'daily.claimError'
  | 'daily.claiming'
  | 'daily.claimToday'
  | 'daily.dayLabel'
  | 'daily.errorTitle'
  | 'daily.kindPill'
  | 'daily.kicker'
  | 'daily.loading'
  | 'daily.next'
  | 'daily.notLoggedCopy'
  | 'daily.notLoggedTitle'
  | 'daily.rewardReceived'
  | 'daily.statusLoadError'
  | 'daily.streakBadge'
  | 'daily.streakReset'
  | 'daily.title'
  | 'footer.copy'
  | 'footer.disclaimer'
  | 'footer.privacy'
  | 'footer.project'
  | 'footer.studentProject'
  | 'hand.empty'
  | 'hand.status.active'
  | 'hand.status.blackjack'
  | 'hand.status.busted'
  | 'hand.status.stood'
  | 'hand.status.surrendered'
  | 'home.crates'
  | 'home.dailyRewards'
  | 'home.enter'
  | 'home.loggedInAs'
  | 'home.logout'
  | 'home.subtitle'
  | 'home.toast.accountCreated'
  | 'home.toast.actionFailed'
  | 'home.toast.loginRequiredPlay'
  | 'home.toast.loginRequiredReward'
  | 'home.toast.unknownError'
  | 'home.toast.welcomeBack'
  | 'leaderboard.balanceDescription'
  | 'leaderboard.currentRank'
  | 'leaderboard.levelDescription'
  | 'leaderboard.loading'
  | 'leaderboard.netWinnings'
  | 'leaderboard.noRank'
  | 'leaderboard.player'
  | 'leaderboard.rank'
  | 'leaderboard.title'
  | 'leaderboard.winnings'
  | 'leaderboard.winningsDescription'
  | 'round.aborted'
  | 'round.created'
  | 'round.dealing'
  | 'round.inProgress'
  | 'round.ready'
  | 'round.settled'
  | 'toast.error'
  | 'toast.info'
  | 'toast.success'
  | 'tutorial.basics'
  | 'tutorial.close'
  | 'tutorial.count'
  | 'tutorial.next'
  | 'tutorial.previous'
  | 'tutorial.step'
  | 'tutorial.stepsLabel'
  | 'tutorial.understood'
  | 'powerup.title'
  | 'powerup.inventory'
  | 'powerup.shop'
  | 'powerup.activate'
  | 'powerup.buy'
  | 'powerup.empty'
  | 'powerup.button'
  | 'powerup.peek.reveal'
  | 'powerup.locked'
  | 'powerup.queue'
  | 'powerup.queued'
  | 'powerup.ingame'
  | 'powerup.peekBtn'
  | 'powerup.pillShopTitle'
  | 'powerup.pillShopSubtitle'
  | 'powerup.redPill'
  | 'powerup.redPillDescription'
  | 'powerup.bluePill'
  | 'powerup.bluePillDescription'
  | 'powerup.slotOccupied'
  | 'powerup.unavailable'
  | 'powerup.undoBtn'
  | 'powerup.swapBtn';

type TranslationMap = Record<TranslationKey, string>;

const STORAGE_KEY = 'betception-language';

const TRANSLATIONS: Record<LanguageCode, TranslationMap> = {
  de: {
    'auth.createAccount': 'ACCOUNT ERSTELLEN',
    'auth.emailDisposable': 'Bitte nutze eine echte E-Mail-Adresse. Wegwerf-Adressen sind nicht erlaubt.',
    'auth.emailDomainInvalid': 'Diese E-Mail-Domain kann keine E-Mails empfangen. Bitte prüfe die Adresse.',
    'auth.emailDomainUnavailable': 'Die E-Mail-Domain konnte gerade nicht geprüft werden. Bitte versuche es erneut.',
    'auth.emailInvalid': 'Bitte eine gültige E-Mail-Adresse eingeben.',
    'auth.emailPlaceholder': 'E-Mail',
    'auth.login': 'Einloggen',
    'auth.passwordPlaceholder': 'Passwort (min. 8 Zeichen)',
    'auth.passwordTooShort': 'Passwort muss mindestens 8 Zeichen lang sein.',
    'auth.register': 'Registrieren',
    'auth.submitLogin': 'EINLOGGEN',
    'auth.usernameInvalid': 'Benutzername muss 3-32 Zeichen lang sein.',
    'auth.usernamePlaceholder': 'Benutzername (3-32 Zeichen)',
    'blackjack.actionFailed': 'Hat nicht geklappt. Versuch es nochmal.',
    'blackjack.completed': 'Runde beendet.',
    'blackjack.dealerBlackjack': 'Blackjack beim Dealer',
    'blackjack.dealerBust': 'Dealer ist über 21 ({{value}})',
    'blackjack.dealerStands': 'Dealer hält bei {{value}}',
    'blackjack.finishedHeadline': 'ABGERECHNET',
    'blackjack.lostHeadline': 'VERLOREN',
    'blackjack.lostNewRound': 'Verloren. Neue Runde?',
    'blackjack.newRound': 'Neue Runde',
    'blackjack.pushHeadline': 'PUSH',
    'blackjack.pushBetBack': 'Push - Einsatz zurück.',
    'blackjack.quit': 'Zum Menü',
    'blackjack.refunded': 'Einsatz zurückgebucht.',
    'blackjack.setBetError': 'Bitte erst einen Einsatz setzen.',
    'blackjack.won': 'Gewonnen!',
    'blackjack.wonHeadline': 'GEWONNEN!',
    'blackjack.wonPayout': 'Gewonnen! Auszahlung: {{amount}} Coins',
    'betception.available': 'Verfügbar',
    'betception.betceptionPayout': 'Betception-Auszahlung',
    'betception.bigWin': 'BIG WIN',
    'betception.blackjackBet': 'Blackjack-Wette',
    'betception.blackjackShort': 'Blackjack',
    'betception.blackjackSubtitle': 'Wette darauf, dass du mit den ersten zwei Karten Blackjack triffst. Auszahlung 12:1.',
    'betception.blackjackTitle': 'Blackjack treffen',
    'betception.cardExactShort': 'Karte',
    'betception.cardExactSubtitle': 'Wette auf Farben oder exakte Karten, die in deiner Hand auftauchen sollen. Exakte Karten zahlen 12:1, Farben zahlen 2:1.',
    'betception.cardExactTitle': 'Kartenwette',
    'betception.cardBets': 'Kartenwetten',
    'betception.cardSuitBet': 'Farbwette',
    'betception.cardSuitShort': 'Farbe',
    'betception.cardSuitSubtitle': 'Wette darauf, dass mindestens eine Karte dieser Farbe in deiner Hand auftaucht. Auszahlung 2:1.',
    'betception.cardSuitTitle': 'Farbwette',
    'betception.clearSelection': 'Auswahl leeren',
    'betception.confirmAndDeal': 'Wetten bestätigen & austeilen',
    'betception.continueWithout': 'Ohne Sidebets austeilen',
    'betception.dealerBustBet': 'Dealer-Bust-Wette',
    'betception.dealerBustShort': 'Dealer Bust',
    'betception.dealerBustSubtitle': 'Wette darauf, dass der Dealer diese Runde über 21 geht. Auszahlung 3:1.',
    'betception.dealerBustTarget': 'Dealer bustet',
    'betception.dealerBustTitle': 'Dealer Bust',
    'betception.depthLevel': 'Depth Level',
    'betception.finalPayout': 'Gesamtauszahlung',
    'betception.hit': 'Hit',
    'betception.mainBet': 'Main Bet',
    'betception.megaWin': 'MEGA WIN',
    'betception.miss': 'Miss',
    'betception.pending': 'Offen',
    'betception.pillShort': 'Pille',
    'betception.pillSubtitle': 'Wette darauf, dass deine aktive Pille diese Runde triggert. Auszahlung {{odds}}.',
    'betception.pillTitle': 'Pillen-Trigger',
    'betception.pillBet': 'Pillenwette',
    'betception.pillUnavailable': 'Keine aktive Pille im Slot.',
    'betception.refund': 'Zurück',
    'betception.selectedCard': 'Ausgewählte Karte',
    'betception.selectedSuit': 'Ausgewählte Farbe',
    'betception.sideBetTotal': 'Sidebets',
    'betception.splitCountBet': 'Split-Wette',
    'betception.splitCountOption': '{{count}}x Split',
    'betception.splitCountShort': 'Split',
    'betception.splitCountSubtitle': 'Wette darauf, wie oft du diese Runde genau splitten wirst. 1x zahlt 4:1, 2x 18:1, 3x 60:1.',
    'betception.splitCountTitle': 'Split-Anzahl',
    'betception.subtitle': 'Setze auf Karten, Farben, Dealer Bust, Pillen-Trigger, Blackjack oder Split-Anzahl. Alles wird nach der Runde nacheinander abgerechnet.',
    'betception.superWin': 'SUPER WIN',
    'betception.suitClubs': 'Kreuz',
    'betception.suitDiamonds': 'Karo',
    'betception.suitHearts': 'Herz',
    'betception.suitSpades': 'Pik',
    'betception.title': 'Betception Bets',
    'betception.totalPayout': 'Auszahlung',
    'betception.winCelebration': 'WIN',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Start',
    'common.howToPlay': 'Spielanleitung',
    'common.language': 'Sprache',
    'common.ok': 'OK',
    'common.player': 'Spieler',
    'common.playerSplit': 'Split',
    'common.settings': 'Einstellungen',
    'controls.balance': 'Guthaben',
    'controls.bet': 'Einsatz',
    'controls.deal': 'Austeilen',
    'controls.double': 'Doppeln',
    'controls.hit': 'Ziehen',
    'controls.reset': 'Reset',
    'controls.round': 'Runde',
    'controls.settle': 'Abrechnen',
    'controls.split': 'Teilen',
    'controls.stand': 'Halten',
    'crate.continue': 'Weiter',
    'crate.empty': 'Noch keine Kisten vorhanden. Steige im Level auf, um Kisten zu erhalten.',
    'crate.errorAlreadyOpened': 'Diese Kiste wurde bereits geöffnet.',
    'crate.errorNotFound': 'Diese Kiste wurde nicht gefunden.',
    'crate.errorUnauthenticated': 'Bitte logge dich ein, um Kisten zu öffnen.',
    'crate.inventory': 'Inventar',
    'crate.level': 'Level',
    'crate.loadError': 'Kisten konnten nicht geladen werden.',
    'crate.loading': 'Lädt...',
    'crate.open': 'Öffnen',
    'crate.opened': 'Geöffnet',
    'crate.openError': 'Fehler beim Öffnen der Kiste.',
    'crate.opening': 'Kiste wird geöffnet...',
    'crate.pillFallback': 'Pille',
    'crate.rewardReceived': '{{reward}} erhalten',
    'crate.tier.common': 'Gewöhnlich',
    'crate.tier.epic': 'Episch',
    'crate.tier.rare': 'Selten',
    'crate.tierBadge': '{{tier}} {{label}}-Kiste',
    'crate.levelUpReceived': 'Du hast eine {{tier}} Kiste erhalten!',
    'crate.levelUpTitle': 'Level Up!',
    'crate.title': 'Kisten',
    'crate.unopened': 'Ungeöffnet ({{count}})',
    'daily.alreadyCopy': 'Du hast deine tägliche Belohnung heute schon abgeholt.',
    'daily.alreadyTitle': 'Bereits abgeholt!',
    'daily.availableNow': 'Jetzt verfügbar!',
    'daily.balance': 'Neues Guthaben',
    'daily.claimError': 'Fehler beim Abholen',
    'daily.claiming': 'Wird abgeholt...',
    'daily.claimToday': 'Heute abholen',
    'daily.dayLabel': 'Tag {{day}}',
    'daily.errorTitle': 'Fehler',
    'daily.kindPill': 'Pille',
    'daily.kicker': '30 Tage',
    'daily.loading': 'Belohnung wird geladen...',
    'daily.next': 'Nächste Belohnung in',
    'daily.notLoggedCopy': 'Bitte logge dich ein, um deine tägliche Belohnung abzuholen.',
    'daily.notLoggedTitle': 'Nicht eingeloggt',
    'daily.rewardReceived': '{{reward}} erhalten',
    'daily.statusLoadError': 'Status konnte nicht geladen werden',
    'daily.streakBadge': '{{days}} Tage Streak',
    'daily.streakReset': 'Dein Streak wurde zurückgesetzt. Heute startest du wieder bei Tag 1.',
    'daily.title': 'Tägliche Belohnung!',
    'footer.copy': 'BetCeption verwendet ausschließlich virtuelles Spielgeld ohne realen Gegenwert. Es sind keine Ein- oder Auszahlungen möglich. Dies ist kein Glücksspiel im Sinne des GlüStV.',
    'footer.disclaimer': 'Kein Echtgeld - Nur virtuelle Coins.',
    'footer.privacy': 'Datenschutz',
    'footer.project': 'Dieses Projekt ist ein nicht-kommerzielles Studentenprojekt zu Bildungs- und Unterhaltungszwecken. Empfohlen ab 18 Jahren.',
    'footer.studentProject': 'Studentenprojekt',
    'hand.empty': 'Bereit für die nächste Runde',
    'hand.status.active': 'Aktiv',
    'hand.status.blackjack': 'Blackjack',
    'hand.status.busted': 'Busted',
    'hand.status.stood': 'Stand',
    'hand.status.surrendered': 'Surrender',
    'home.crates': 'Kisten',
    'home.dailyRewards': 'TÄGLICHE BELOHNUNG',
    'home.enter': 'BETCEPTION STARTEN',
    'home.loggedInAs': 'Eingeloggt als',
    'home.logout': 'Abmelden',
    'home.subtitle': 'Wo Realität nur eine weitere Variable ist.',
    'home.toast.accountCreated': 'Account erstellt! Eingeloggt als {{name}}.',
    'home.toast.actionFailed': 'Aktion fehlgeschlagen. Bitte versuche es erneut.',
    'home.toast.loginRequiredPlay': 'Bitte logge dich ein, um Betception Blackjack zu spielen.',
    'home.toast.loginRequiredReward': 'Bitte logge dich ein, um deine tägliche Belohnung abzuholen.',
    'home.toast.unknownError': 'Unbekannter Fehler. Bitte versuche es erneut.',
    'home.toast.welcomeBack': 'Willkommen zurück, {{name}}!',
    'leaderboard.balanceDescription': 'Top-Kontostände - wer hat die meisten Coins?',
    'leaderboard.currentRank': 'Dein aktueller Rang',
    'leaderboard.levelDescription': 'Höchstes Level und XP-Fortschritt.',
    'leaderboard.loading': 'Lade {{label}}...',
    'leaderboard.netWinnings': 'Netto-Gewinne (7 Tage)',
    'leaderboard.noRank': 'Spiele mehr Runden, um in der Bestenliste aufzutauchen.',
    'leaderboard.player': 'Spieler',
    'leaderboard.rank': 'Rang',
    'leaderboard.title': 'Bestenliste',
    'leaderboard.winnings': 'Gewinne',
    'leaderboard.winningsDescription': 'Netto-Gewinne der letzten 7 Tage.',
    'round.aborted': 'Abgebrochen',
    'round.created': 'Gestartet',
    'round.dealing': 'Dealing',
    'round.inProgress': 'Läuft',
    'round.ready': 'Bereit',
    'round.settled': 'Fertig',
    'toast.error': 'Fehler',
    'toast.info': 'Info',
    'toast.success': 'Erfolg',
    'tutorial.basics': 'Blackjack-Grundlagen',
    'tutorial.close': 'Tutorial schließen',
    'tutorial.count': '{{current}} / {{total}}',
    'tutorial.next': 'Weiter',
    'tutorial.previous': 'Zurück',
    'tutorial.step': 'Schritt {{step}}',
    'tutorial.stepsLabel': 'Tutorial Schritte',
    'tutorial.understood': 'Verstanden',
    'powerup.title': 'Power-ups',
    'powerup.inventory': 'Mein Inventar',
    'powerup.shop': 'Shop',
    'powerup.activate': 'Aktivieren',
    'powerup.buy': 'Kaufen',
    'powerup.empty': 'Keine Power-ups im Inventar',
    'powerup.button': '⚡ Power-ups',
    'powerup.peek.reveal': 'Dealer 2. Karte:',
    'powerup.locked': 'Ab Level {{level}}',
    'powerup.queue': 'Aktivieren',
    'powerup.queued': '✓ Aktiviert',
    'powerup.ingame': 'Im Spiel',
    'powerup.peekBtn': '👁️ Karte ansehen',
    'powerup.pillShopTitle': 'Power-Pille kaufen',
    'powerup.pillShopSubtitle': 'Aktiviere eine Pille für 3 Runden. Es kann immer nur eine Pille aktiv sein.',
    'powerup.redPill': 'Rote Pille',
    'powerup.redPillDescription': '1:5 Chance auf x3 Auszahlung bei einem Gewinn.',
    'powerup.bluePill': 'Blaue Pille',
    'powerup.bluePillDescription': '1:8 Chance auf eine Schutzrunde bei Verlust: kein Verlust.',
    'powerup.slotOccupied': 'Slot belegt',
    'powerup.unavailable': 'Nicht verfügbar',
    'powerup.undoBtn': '↩️ Karte zurück',
    'powerup.swapBtn': '🔄 Karte tauschen',
  },
  en: {
    'auth.createAccount': 'CREATE ACCOUNT',
    'auth.emailDisposable': 'Please use a real email address. Disposable addresses are not allowed.',
    'auth.emailDomainInvalid': 'This email domain cannot receive email. Please check the address.',
    'auth.emailDomainUnavailable': 'The email domain could not be checked right now. Please try again.',
    'auth.emailInvalid': 'Please enter a valid email address.',
    'auth.emailPlaceholder': 'Email',
    'auth.login': 'Login',
    'auth.passwordPlaceholder': 'Password (min. 8 characters)',
    'auth.passwordTooShort': 'Password must be at least 8 characters long.',
    'auth.register': 'Register',
    'auth.submitLogin': 'LOGIN',
    'auth.usernameInvalid': 'Username must be 3-32 characters long.',
    'auth.usernamePlaceholder': 'Username (3-32 characters)',
    'blackjack.actionFailed': 'Action failed. Please try again.',
    'blackjack.completed': 'Round completed.',
    'blackjack.dealerBlackjack': 'Dealer blackjack',
    'blackjack.dealerBust': 'Dealer bust ({{value}})',
    'blackjack.dealerStands': 'Dealer stands on {{value}}',
    'blackjack.finishedHeadline': 'DONE',
    'blackjack.lostHeadline': 'LOST',
    'blackjack.lostNewRound': 'Lost. New round?',
    'blackjack.newRound': 'New Round',
    'blackjack.pushHeadline': 'PUSH',
    'blackjack.pushBetBack': 'Push - bet returned.',
    'blackjack.quit': 'Quit',
    'blackjack.refunded': 'Bet refunded.',
    'blackjack.setBetError': 'Place a bet to start.',
    'blackjack.won': 'Won!',
    'blackjack.wonHeadline': 'WON!',
    'blackjack.wonPayout': 'Won! Payout: {{amount}} Coins',
    'betception.available': 'Available',
    'betception.betceptionPayout': 'Betception payout',
    'betception.bigWin': 'BIG WIN',
    'betception.blackjackBet': 'Blackjack Bet',
    'betception.blackjackShort': 'Blackjack',
    'betception.blackjackSubtitle': 'Bet that your first two cards hit blackjack. Payout 12:1.',
    'betception.blackjackTitle': 'Hit Blackjack',
    'betception.cardExactShort': 'Card',
    'betception.cardExactSubtitle': 'Bet on suits or exact cards that should appear in your hand. Exact cards pay 12:1, suits pay 2:1.',
    'betception.cardExactTitle': 'Card Bet',
    'betception.cardBets': 'Card Bets',
    'betception.cardSuitBet': 'Suit Bet',
    'betception.cardSuitShort': 'Suit',
    'betception.cardSuitSubtitle': 'Bet that at least one card of this suit appears in your hand. Payout 2:1.',
    'betception.cardSuitTitle': 'Suit Bet',
    'betception.clearSelection': 'Clear selection',
    'betception.confirmAndDeal': 'Confirm bets & deal',
    'betception.continueWithout': 'Deal without sidebets',
    'betception.dealerBustBet': 'Dealer Bust Bet',
    'betception.dealerBustShort': 'Dealer Bust',
    'betception.dealerBustSubtitle': 'Bet that the dealer goes over 21 this round. Payout 3:1.',
    'betception.dealerBustTarget': 'Dealer busts',
    'betception.dealerBustTitle': 'Dealer Bust',
    'betception.depthLevel': 'Depth Level',
    'betception.finalPayout': 'Total payout',
    'betception.hit': 'Hit',
    'betception.mainBet': 'Main Bet',
    'betception.megaWin': 'MEGA WIN',
    'betception.miss': 'Miss',
    'betception.pending': 'Pending',
    'betception.pillShort': 'Pill',
    'betception.pillSubtitle': 'Bet that your active pill triggers this round. Payout {{odds}}.',
    'betception.pillTitle': 'Pill Trigger',
    'betception.pillBet': 'Pill Bet',
    'betception.pillUnavailable': 'No active pill in the slot.',
    'betception.refund': 'Refund',
    'betception.selectedCard': 'Selected card',
    'betception.selectedSuit': 'Selected suit',
    'betception.sideBetTotal': 'Sidebets',
    'betception.splitCountBet': 'Split Bet',
    'betception.splitCountOption': '{{count}}x Split',
    'betception.splitCountShort': 'Split',
    'betception.splitCountSubtitle': 'Bet exactly how many times you will split this round. 1x pays 4:1, 2x 18:1, 3x 60:1.',
    'betception.splitCountTitle': 'Split Count',
    'betception.subtitle': 'Bet on cards, suits, dealer bust, pill trigger, blackjack, or split count. Everything resolves step by step after the round.',
    'betception.superWin': 'SUPER WIN',
    'betception.suitClubs': 'Clubs',
    'betception.suitDiamonds': 'Diamonds',
    'betception.suitHearts': 'Hearts',
    'betception.suitSpades': 'Spades',
    'betception.title': 'Betception Bets',
    'betception.totalPayout': 'Payout',
    'betception.winCelebration': 'WIN',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Home',
    'common.howToPlay': 'How to Play',
    'common.language': 'Language',
    'common.ok': 'OK',
    'common.player': 'Player',
    'common.playerSplit': 'Split',
    'common.settings': 'Settings',
    'controls.balance': 'Balance',
    'controls.bet': 'Bet',
    'controls.deal': 'Deal',
    'controls.double': 'Double',
    'controls.hit': 'Hit',
    'controls.reset': 'Clear',
    'controls.round': 'Round',
    'controls.settle': 'Settle',
    'controls.split': 'Split',
    'controls.stand': 'Stand',
    'crate.continue': 'Continue',
    'crate.empty': 'No crates yet. Level up to earn crates.',
    'crate.errorAlreadyOpened': 'This crate has already been opened.',
    'crate.errorNotFound': 'This crate was not found.',
    'crate.errorUnauthenticated': 'Please log in to open crates.',
    'crate.inventory': 'Inventory',
    'crate.level': 'Level',
    'crate.loadError': 'Could not load crates.',
    'crate.loading': 'Loading...',
    'crate.open': 'Open',
    'crate.opened': 'Opened',
    'crate.openError': 'Failed to open crate.',
    'crate.opening': 'Opening crate...',
    'crate.pillFallback': 'Pill',
    'crate.rewardReceived': 'Received {{reward}}',
    'crate.tier.common': 'Common',
    'crate.tier.epic': 'Epic',
    'crate.tier.rare': 'Rare',
    'crate.tierBadge': '{{tier}} {{label}} Crate',
    'crate.levelUpReceived': 'You received a {{tier}} crate!',
    'crate.levelUpTitle': 'Level Up!',
    'crate.title': 'Crates',
    'crate.unopened': 'Unopened ({{count}})',
    'daily.alreadyCopy': 'You already claimed your daily reward today.',
    'daily.alreadyTitle': 'Already claimed!',
    'daily.availableNow': 'Available now!',
    'daily.balance': 'New balance',
    'daily.claimError': 'Failed to claim reward',
    'daily.claiming': 'Claiming...',
    'daily.claimToday': 'Claim today',
    'daily.dayLabel': 'Day {{day}}',
    'daily.errorTitle': 'Error',
    'daily.kindPill': 'Pill',
    'daily.kicker': '30 Days',
    'daily.loading': 'Loading reward...',
    'daily.next': 'Next reward in',
    'daily.notLoggedCopy': 'Please log in to claim your daily reward.',
    'daily.notLoggedTitle': 'Not logged in',
    'daily.rewardReceived': 'Received {{reward}}',
    'daily.statusLoadError': 'Could not load reward status',
    'daily.streakBadge': '{{days}} day streak',
    'daily.streakReset': 'Your streak was reset. Today you start again at day 1.',
    'daily.title': 'Daily Reward!',
    'footer.copy': 'BetCeption only uses virtual play money with no real-world value. Deposits and withdrawals are not possible. This is not gambling.',
    'footer.disclaimer': 'No real money - virtual coins only.',
    'footer.privacy': 'Privacy',
    'footer.project': 'This project is a non-commercial student project for educational and entertainment purposes. Recommended for ages 18+.',
    'footer.studentProject': 'Student project',
    'hand.empty': 'Ready for the next round',
    'hand.status.active': 'Active',
    'hand.status.blackjack': 'Blackjack',
    'hand.status.busted': 'Busted',
    'hand.status.stood': 'Stood',
    'hand.status.surrendered': 'Surrender',
    'home.crates': 'Crates',
    'home.dailyRewards': 'DAILY REWARDS',
    'home.enter': 'ENTER BETCEPTION',
    'home.loggedInAs': 'Logged in as',
    'home.logout': 'Log out',
    'home.subtitle': 'Where reality is just another variable.',
    'home.toast.accountCreated': 'Account created! Logged in as {{name}}.',
    'home.toast.actionFailed': 'Action failed. Please try again.',
    'home.toast.loginRequiredPlay': 'Please log in to play Betception Blackjack.',
    'home.toast.loginRequiredReward': 'Please log in to claim your daily reward.',
    'home.toast.unknownError': 'Unknown error. Please try again.',
    'home.toast.welcomeBack': 'Welcome back, {{name}}!',
    'leaderboard.balanceDescription': 'Top balances - who has the most coins in their wallet?',
    'leaderboard.currentRank': 'Your current rank',
    'leaderboard.levelDescription': 'Highest level and XP progress.',
    'leaderboard.loading': 'Loading {{label}}...',
    'leaderboard.netWinnings': 'Net Winnings (7d)',
    'leaderboard.noRank': 'Play more rounds to appear on the leaderboard.',
    'leaderboard.player': 'Player',
    'leaderboard.rank': 'Rank',
    'leaderboard.title': 'Leaderboard',
    'leaderboard.winnings': 'Winnings',
    'leaderboard.winningsDescription': 'Net winnings from the last 7 days.',
    'round.aborted': 'Aborted',
    'round.created': 'Started',
    'round.dealing': 'Dealing',
    'round.inProgress': 'Running',
    'round.ready': 'Ready',
    'round.settled': 'Settled',
    'toast.error': 'Error',
    'toast.info': 'Info',
    'toast.success': 'Success',
    'tutorial.basics': 'Blackjack Basics',
    'tutorial.close': 'Close tutorial',
    'tutorial.count': '{{current}} / {{total}}',
    'tutorial.next': 'Next',
    'tutorial.previous': 'Back',
    'tutorial.step': 'Step {{step}}',
    'tutorial.stepsLabel': 'Tutorial steps',
    'tutorial.understood': 'Got it',
    'powerup.title': 'Power-ups',
    'powerup.inventory': 'My Inventory',
    'powerup.shop': 'Shop',
    'powerup.activate': 'Activate',
    'powerup.buy': 'Buy',
    'powerup.empty': 'No power-ups in inventory',
    'powerup.button': '⚡ Power-ups',
    'powerup.peek.reveal': 'Dealer 2nd card:',
    'powerup.locked': 'From Level {{level}}',
    'powerup.queue': 'Activate',
    'powerup.queued': '✓ Active',
    'powerup.ingame': 'In-Game',
    'powerup.peekBtn': '👁️ Peek Card',
    'powerup.pillShopTitle': 'Purchase Power Pill',
    'powerup.pillShopSubtitle': 'Activate one pill for 3 rounds. Only one pill can be active at a time.',
    'powerup.redPill': 'Red Pill',
    'powerup.redPillDescription': '1:5 chance to trigger x3 payout on a win.',
    'powerup.bluePill': 'Blue Pill',
    'powerup.bluePillDescription': '1:8 chance to protect a losing round with no loss.',
    'powerup.slotOccupied': 'Slot occupied',
    'powerup.unavailable': 'Unavailable',
    'powerup.undoBtn': '↩️ Undo Hit',
    'powerup.swapBtn': '🔄 Swap Card',
  },
  es: {
    'auth.createAccount': 'CREAR CUENTA',
    'auth.emailDisposable': 'Usa una dirección de email real. No se permiten direcciones temporales.',
    'auth.emailDomainInvalid': 'Este dominio de email no puede recibir correos. Revisa la dirección.',
    'auth.emailDomainUnavailable': 'No se pudo comprobar el dominio de email ahora. Inténtalo de nuevo.',
    'auth.emailInvalid': 'Introduce un email válido.',
    'auth.emailPlaceholder': 'Email',
    'auth.login': 'Iniciar sesión',
    'auth.passwordPlaceholder': 'Contraseña (mín. 8 caracteres)',
    'auth.passwordTooShort': 'La contraseña debe tener al menos 8 caracteres.',
    'auth.register': 'Registrarse',
    'auth.submitLogin': 'ENTRAR',
    'auth.usernameInvalid': 'El nombre de usuario debe tener 3-32 caracteres.',
    'auth.usernamePlaceholder': 'Usuario (3-32 caracteres)',
    'blackjack.actionFailed': 'No se pudo hacer la jugada. Inténtalo de nuevo.',
    'blackjack.completed': 'Ronda terminada.',
    'blackjack.dealerBlackjack': 'Blackjack del dealer',
    'blackjack.dealerBust': 'Dealer se pasa ({{value}})',
    'blackjack.dealerStands': 'Dealer se planta en {{value}}',
    'blackjack.finishedHeadline': 'CERRADA',
    'blackjack.lostHeadline': 'PERDIDO',
    'blackjack.lostNewRound': 'Perdiste. ¿Otra ronda?',
    'blackjack.newRound': 'Nueva ronda',
    'blackjack.pushHeadline': 'EMPATE',
    'blackjack.pushBetBack': 'Push - recuperas la apuesta.',
    'blackjack.quit': 'Salir',
    'blackjack.refunded': 'Apuesta devuelta.',
    'blackjack.setBetError': 'Haz una apuesta para empezar.',
    'blackjack.won': '¡Ganaste!',
    'blackjack.wonHeadline': '¡GANASTE!',
    'blackjack.wonPayout': '¡Ganaste! Pago: {{amount}} Coins',
    'betception.available': 'Disponible',
    'betception.betceptionPayout': 'Pago Betception',
    'betception.bigWin': 'GRAN PREMIO',
    'betception.blackjackBet': 'Apuesta Blackjack',
    'betception.blackjackShort': 'Blackjack',
    'betception.blackjackSubtitle': 'Apuesta a que tus dos primeras cartas hacen blackjack. Pago 12:1.',
    'betception.blackjackTitle': 'Sacar Blackjack',
    'betception.cardExactShort': 'Carta',
    'betception.cardExactSubtitle': 'Apuesta por palos o cartas exactas que deben aparecer en tu mano. Cartas exactas pagan 12:1, palos pagan 2:1.',
    'betception.cardExactTitle': 'Apuesta de carta',
    'betception.cardBets': 'Apuestas de carta',
    'betception.cardSuitBet': 'Apuesta de palo',
    'betception.cardSuitShort': 'Palo',
    'betception.cardSuitSubtitle': 'Apuesta a que aparece al menos una carta de este palo en tu mano. Pago 2:1.',
    'betception.cardSuitTitle': 'Apuesta de palo',
    'betception.clearSelection': 'Limpiar seleccion',
    'betception.confirmAndDeal': 'Confirmar apuestas y dar',
    'betception.continueWithout': 'Dar sin apuestas extra',
    'betception.dealerBustBet': 'Apuesta Dealer Bust',
    'betception.dealerBustShort': 'Dealer Bust',
    'betception.dealerBustSubtitle': 'Apuesta a que el dealer pasa de 21 esta ronda. Pago 3:1.',
    'betception.dealerBustTarget': 'El dealer se pasa',
    'betception.dealerBustTitle': 'Dealer Bust',
    'betception.depthLevel': 'Nivel de profundidad',
    'betception.finalPayout': 'Pago total',
    'betception.hit': 'Acierto',
    'betception.mainBet': 'Apuesta principal',
    'betception.megaWin': 'MEGA PREMIO',
    'betception.miss': 'Fallo',
    'betception.pending': 'Pendiente',
    'betception.pillShort': 'Pildora',
    'betception.pillSubtitle': 'Apuesta a que tu pildora activa se dispara esta ronda. Pago {{odds}}.',
    'betception.pillTitle': 'Trigger de pildora',
    'betception.pillBet': 'Apuesta de pildora',
    'betception.pillUnavailable': 'No hay pildora activa.',
    'betception.refund': 'Devuelta',
    'betception.selectedCard': 'Carta seleccionada',
    'betception.selectedSuit': 'Palo seleccionado',
    'betception.sideBetTotal': 'Apuestas extra',
    'betception.splitCountBet': 'Apuesta de splits',
    'betception.splitCountOption': '{{count}}x Split',
    'betception.splitCountShort': 'Split',
    'betception.splitCountSubtitle': 'Apuesta cuántas veces exactas dividirás esta ronda. 1x paga 4:1, 2x 18:1, 3x 60:1.',
    'betception.splitCountTitle': 'Número de splits',
    'betception.subtitle': 'Apuesta a cartas, palos, dealer bust, trigger de pildora, blackjack o número de splits. Todo se resuelve paso a paso tras la ronda.',
    'betception.superWin': 'SUPER PREMIO',
    'betception.suitClubs': 'Treboles',
    'betception.suitDiamonds': 'Diamantes',
    'betception.suitHearts': 'Corazones',
    'betception.suitSpades': 'Picas',
    'betception.title': 'Apuestas Betception',
    'betception.totalPayout': 'Pago',
    'betception.winCelebration': 'PREMIO',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Inicio',
    'common.howToPlay': 'Cómo jugar',
    'common.language': 'Idioma',
    'common.ok': 'OK',
    'common.player': 'Jugador',
    'common.playerSplit': 'Split',
    'common.settings': 'Ajustes',
    'controls.balance': 'Saldo',
    'controls.bet': 'Apuesta',
    'controls.deal': 'Dar',
    'controls.double': 'Doblar',
    'controls.hit': 'Pedir',
    'controls.reset': 'Reset',
    'controls.round': 'Ronda',
    'controls.settle': 'Resolver',
    'controls.split': 'Dividir',
    'controls.stand': 'Plantar',
    'crate.continue': 'Continuar',
    'crate.empty': 'Aún no tienes cajas. Sube de nivel para conseguir cajas.',
    'crate.errorAlreadyOpened': 'Esta caja ya fue abierta.',
    'crate.errorNotFound': 'No se encontró esta caja.',
    'crate.errorUnauthenticated': 'Inicia sesión para abrir cajas.',
    'crate.inventory': 'Inventario',
    'crate.level': 'Nivel',
    'crate.loadError': 'No se pudieron cargar las cajas.',
    'crate.loading': 'Cargando...',
    'crate.open': 'Abrir',
    'crate.opened': 'Abiertas',
    'crate.openError': 'No se pudo abrir la caja.',
    'crate.opening': 'Abriendo caja...',
    'crate.pillFallback': 'Píldora',
    'crate.rewardReceived': 'Has recibido {{reward}}',
    'crate.tier.common': 'Común',
    'crate.tier.epic': 'Épica',
    'crate.tier.rare': 'Rara',
    'crate.tierBadge': '{{tier}} Caja {{label}}',
    'crate.levelUpReceived': 'Has recibido una caja {{tier}}.',
    'crate.levelUpTitle': '¡Subida de nivel!',
    'crate.title': 'Cajas',
    'crate.unopened': 'Sin abrir ({{count}})',
    'daily.alreadyCopy': 'Ya reclamaste tu recompensa diaria hoy.',
    'daily.alreadyTitle': '¡Ya reclamada!',
    'daily.availableNow': '¡Disponible ahora!',
    'daily.balance': 'Nuevo saldo',
    'daily.claimError': 'No se pudo reclamar la recompensa',
    'daily.claiming': 'Reclamando...',
    'daily.claimToday': 'Reclamar hoy',
    'daily.dayLabel': 'Día {{day}}',
    'daily.errorTitle': 'Error',
    'daily.kindPill': 'Píldora',
    'daily.kicker': '30 días',
    'daily.loading': 'Cargando recompensa...',
    'daily.next': 'Próxima recompensa en',
    'daily.notLoggedCopy': 'Inicia sesión para reclamar tu recompensa diaria.',
    'daily.notLoggedTitle': 'No has iniciado sesión',
    'daily.rewardReceived': 'Has recibido {{reward}}',
    'daily.statusLoadError': 'No se pudo cargar el estado',
    'daily.streakBadge': 'Racha de {{days}} días',
    'daily.streakReset': 'Tu racha se reinició. Hoy empiezas de nuevo en el día 1.',
    'daily.title': '¡Recompensa diaria!',
    'footer.copy': 'BetCeption usa solo monedas virtuales sin valor real. No hay depósitos ni retiros. Esto no es juego de azar.',
    'footer.disclaimer': 'Sin dinero real - solo coins virtuales.',
    'footer.privacy': 'Privacidad',
    'footer.project': 'Este proyecto es un proyecto estudiantil no comercial con fines educativos y de entretenimiento. Recomendado para mayores de 18.',
    'footer.studentProject': 'Proyecto estudiantil',
    'hand.empty': 'Listo para la próxima ronda',
    'hand.status.active': 'Activo',
    'hand.status.blackjack': 'Blackjack',
    'hand.status.busted': 'Pasado',
    'hand.status.stood': 'Plantado',
    'hand.status.surrendered': 'Rendido',
    'home.crates': 'Cajas',
    'home.dailyRewards': 'RECOMPENSAS DIARIAS',
    'home.enter': 'ENTRAR A BETCEPTION',
    'home.loggedInAs': 'Sesión iniciada como',
    'home.logout': 'Cerrar sesión',
    'home.subtitle': 'Donde la realidad es solo otra variable.',
    'home.toast.accountCreated': '¡Cuenta creada! Sesión iniciada como {{name}}.',
    'home.toast.actionFailed': 'No se pudo completar la acción. Inténtalo de nuevo.',
    'home.toast.loginRequiredPlay': 'Inicia sesión para jugar Betception Blackjack.',
    'home.toast.loginRequiredReward': 'Inicia sesión para reclamar tu recompensa diaria.',
    'home.toast.unknownError': 'Error desconocido. Inténtalo de nuevo.',
    'home.toast.welcomeBack': '¡Bienvenido de nuevo, {{name}}!',
    'leaderboard.balanceDescription': 'Top de saldos - ¿quién tiene más coins?',
    'leaderboard.currentRank': 'Tu rango actual',
    'leaderboard.levelDescription': 'Nivel más alto y progreso de XP.',
    'leaderboard.loading': 'Cargando {{label}}...',
    'leaderboard.netWinnings': 'Ganancias netas (7d)',
    'leaderboard.noRank': 'Juega más rondas para aparecer en la tabla.',
    'leaderboard.player': 'Jugador',
    'leaderboard.rank': 'Rango',
    'leaderboard.title': 'Leaderboard',
    'leaderboard.winnings': 'Ganancias',
    'leaderboard.winningsDescription': 'Ganancias netas de los últimos 7 días.',
    'round.aborted': 'Cancelada',
    'round.created': 'Iniciada',
    'round.dealing': 'Repartiendo',
    'round.inProgress': 'En curso',
    'round.ready': 'Listo',
    'round.settled': 'Cerrada',
    'toast.error': 'Error',
    'toast.info': 'Info',
    'toast.success': 'Éxito',
    'tutorial.basics': 'Conceptos básicos de blackjack',
    'tutorial.close': 'Cerrar tutorial',
    'tutorial.count': '{{current}} / {{total}}',
    'tutorial.next': 'Siguiente',
    'tutorial.previous': 'Atrás',
    'tutorial.step': 'Paso {{step}}',
    'tutorial.stepsLabel': 'Pasos del tutorial',
    'tutorial.understood': 'Entendido',
    'powerup.title': 'Power-ups',
    'powerup.inventory': 'Mi Inventario',
    'powerup.shop': 'Tienda',
    'powerup.activate': 'Activar',
    'powerup.buy': 'Comprar',
    'powerup.empty': 'Sin power-ups en el inventario',
    'powerup.button': '⚡ Power-ups',
    'powerup.peek.reveal': '2ª carta dealer:',
    'powerup.locked': 'Desde Nivel {{level}}',
    'powerup.queue': 'Activar',
    'powerup.queued': '✓ Activo',
    'powerup.ingame': 'En juego',
    'powerup.peekBtn': '👁️ Ver carta',
    'powerup.pillShopTitle': 'Comprar power pill',
    'powerup.pillShopSubtitle': 'Activa una píldora durante 3 rondas. Solo puede haber una activa.',
    'powerup.redPill': 'Píldora roja',
    'powerup.redPillDescription': 'Probabilidad 1:5 de activar pago x3 en una victoria.',
    'powerup.bluePill': 'Píldora azul',
    'powerup.bluePillDescription': 'Probabilidad 1:8 de proteger una ronda perdida sin pérdida.',
    'powerup.slotOccupied': 'Ranura ocupada',
    'powerup.unavailable': 'No disponible',
    'powerup.undoBtn': '↩️ Deshacer',
    'powerup.swapBtn': '🔄 Cambiar carta',
  },
  fr: {
    'auth.createAccount': 'CRÉER UN COMPTE',
    'auth.emailDisposable': 'Utilise une vraie adresse e-mail. Les adresses temporaires ne sont pas autorisées.',
    'auth.emailDomainInvalid': 'Ce domaine e-mail ne peut pas recevoir de messages. Vérifie l’adresse.',
    'auth.emailDomainUnavailable': 'Le domaine e-mail ne peut pas être vérifié maintenant. Réessaie.',
    'auth.emailInvalid': 'Saisis une adresse e-mail valide.',
    'auth.emailPlaceholder': 'E-mail',
    'auth.login': 'Connexion',
    'auth.passwordPlaceholder': 'Mot de passe (min. 8 caractères)',
    'auth.passwordTooShort': 'Le mot de passe doit contenir au moins 8 caractères.',
    'auth.register': 'Inscription',
    'auth.submitLogin': 'CONNEXION',
    'auth.usernameInvalid': "Le nom d'utilisateur doit contenir 3-32 caractères.",
    'auth.usernamePlaceholder': "Nom d'utilisateur (3-32 caractères)",
    'blackjack.actionFailed': "Le coup n'est pas passé. Réessaie.",
    'blackjack.completed': 'Manche terminée.',
    'blackjack.dealerBlackjack': 'Blackjack du dealer',
    'blackjack.dealerBust': 'Dealer saute ({{value}})',
    'blackjack.dealerStands': 'Dealer reste à {{value}}',
    'blackjack.finishedHeadline': 'RÉGLÉ',
    'blackjack.lostHeadline': 'PERDU',
    'blackjack.lostNewRound': 'Perdu. Nouvelle manche ?',
    'blackjack.newRound': 'Nouvelle manche',
    'blackjack.pushHeadline': 'PUSH',
    'blackjack.pushBetBack': 'Push - mise rendue.',
    'blackjack.quit': 'Quitter',
    'blackjack.refunded': 'Mise rendue.',
    'blackjack.setBetError': 'Place une mise pour commencer.',
    'blackjack.won': 'Gagné !',
    'blackjack.wonHeadline': 'GAGNÉ !',
    'blackjack.wonPayout': 'Gagné ! Gain : {{amount}} Coins',
    'betception.available': 'Disponible',
    'betception.betceptionPayout': 'Gain Betception',
    'betception.bigWin': 'GROS GAIN',
    'betception.blackjackBet': 'Pari blackjack',
    'betception.blackjackShort': 'Blackjack',
    'betception.blackjackSubtitle': 'Parie que tes deux premieres cartes font blackjack. Gain 12:1.',
    'betception.blackjackTitle': 'Toucher Blackjack',
    'betception.cardExactShort': 'Carte',
    'betception.cardExactSubtitle': 'Parie sur des couleurs ou des cartes exactes qui doivent apparaitre dans ta main. Cartes exactes: 12:1, couleurs: 2:1.',
    'betception.cardExactTitle': 'Pari carte',
    'betception.cardBets': 'Paris cartes',
    'betception.cardSuitBet': 'Pari couleur',
    'betception.cardSuitShort': 'Couleur',
    'betception.cardSuitSubtitle': 'Parie qu au moins une carte de cette couleur apparait dans ta main. Gain 2:1.',
    'betception.cardSuitTitle': 'Pari couleur',
    'betception.clearSelection': 'Vider selection',
    'betception.confirmAndDeal': 'Confirmer et donner',
    'betception.continueWithout': 'Donner sans paris extra',
    'betception.dealerBustBet': 'Pari Dealer Bust',
    'betception.dealerBustShort': 'Dealer Bust',
    'betception.dealerBustSubtitle': 'Parie que le dealer dépasse 21 cette manche. Gain 3:1.',
    'betception.dealerBustTarget': 'Le dealer saute',
    'betception.dealerBustTitle': 'Dealer Bust',
    'betception.depthLevel': 'Niveau de profondeur',
    'betception.finalPayout': 'Gain total',
    'betception.hit': 'Touche',
    'betception.mainBet': 'Mise principale',
    'betception.megaWin': 'MEGA GAIN',
    'betception.miss': 'Rate',
    'betception.pending': 'En attente',
    'betception.pillShort': 'Pilule',
    'betception.pillSubtitle': 'Parie que ta pilule active se declenche cette manche. Gain {{odds}}.',
    'betception.pillTitle': 'Trigger pilule',
    'betception.pillBet': 'Pari pilule',
    'betception.pillUnavailable': 'Aucune pilule active.',
    'betception.refund': 'Rembourse',
    'betception.selectedCard': 'Carte choisie',
    'betception.selectedSuit': 'Couleur choisie',
    'betception.sideBetTotal': 'Paris extra',
    'betception.splitCountBet': 'Pari split',
    'betception.splitCountOption': '{{count}}x Split',
    'betception.splitCountShort': 'Split',
    'betception.splitCountSubtitle': 'Parie le nombre exact de splits cette manche. 1x paie 4:1, 2x 18:1, 3x 60:1.',
    'betception.splitCountTitle': 'Nombre de splits',
    'betception.subtitle': 'Parie sur cartes, couleurs, dealer bust, trigger pilule, blackjack ou nombre de splits. Tout se regle etape par etape apres la manche.',
    'betception.superWin': 'SUPER GAIN',
    'betception.suitClubs': 'Trefle',
    'betception.suitDiamonds': 'Carreau',
    'betception.suitHearts': 'Coeur',
    'betception.suitSpades': 'Pique',
    'betception.title': 'Paris Betception',
    'betception.totalPayout': 'Gain',
    'betception.winCelebration': 'GAIN',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Accueil',
    'common.howToPlay': 'Comment jouer',
    'common.language': 'Langue',
    'common.ok': 'OK',
    'common.player': 'Joueur',
    'common.playerSplit': 'Split',
    'common.settings': 'Paramètres',
    'controls.balance': 'Solde',
    'controls.bet': 'Mise',
    'controls.deal': 'Donner',
    'controls.double': 'Doubler',
    'controls.hit': 'Tirer',
    'controls.reset': 'Annuler',
    'controls.round': 'Manche',
    'controls.settle': 'Régler',
    'controls.split': 'Diviser',
    'controls.stand': 'Rester',
    'crate.continue': 'Continuer',
    'crate.empty': 'Aucune caisse disponible. Monte de niveau pour en gagner.',
    'crate.errorAlreadyOpened': 'Cette caisse a déjà été ouverte.',
    'crate.errorNotFound': 'Cette caisse est introuvable.',
    'crate.errorUnauthenticated': 'Connecte-toi pour ouvrir des caisses.',
    'crate.inventory': 'Inventaire',
    'crate.level': 'Niveau',
    'crate.loadError': 'Impossible de charger les caisses.',
    'crate.loading': 'Chargement...',
    'crate.open': 'Ouvrir',
    'crate.opened': 'Ouvertes',
    'crate.openError': 'Impossible d’ouvrir la caisse.',
    'crate.opening': 'Ouverture de la caisse...',
    'crate.pillFallback': 'Pilule',
    'crate.rewardReceived': '{{reward}} reçu',
    'crate.tier.common': 'Commune',
    'crate.tier.epic': 'Épique',
    'crate.tier.rare': 'Rare',
    'crate.tierBadge': '{{tier}} Caisse {{label}}',
    'crate.levelUpReceived': 'Tu as reçu une caisse {{tier}} !',
    'crate.levelUpTitle': 'Niveau supérieur !',
    'crate.title': 'Caisses',
    'crate.unopened': 'Non ouvertes ({{count}})',
    'daily.alreadyCopy': "Tu as déjà récupéré ta récompense quotidienne aujourd'hui.",
    'daily.alreadyTitle': 'Déjà récupérée !',
    'daily.availableNow': 'Disponible maintenant!',
    'daily.balance': 'Nouveau solde',
    'daily.claimError': 'Impossible de récupérer la récompense',
    'daily.claiming': 'Récupération...',
    'daily.claimToday': "Récupérer aujourd'hui",
    'daily.dayLabel': 'Jour {{day}}',
    'daily.errorTitle': 'Erreur',
    'daily.kindPill': 'Pilule',
    'daily.kicker': '30 jours',
    'daily.loading': 'Chargement de la récompense...',
    'daily.next': 'Prochaine récompense dans',
    'daily.notLoggedCopy': 'Connecte-toi pour récupérer ta récompense quotidienne.',
    'daily.notLoggedTitle': 'Non connecté',
    'daily.rewardReceived': '{{reward}} reçu',
    'daily.statusLoadError': 'Impossible de charger le statut',
    'daily.streakBadge': 'Série de {{days}} jours',
    'daily.streakReset': 'Ta série a été réinitialisée. Aujourd’hui tu recommences au jour 1.',
    'daily.title': 'Récompense quotidienne !',
    'footer.copy': "BetCeption utilise uniquement des coins virtuels sans valeur réelle. Les dépôts et retraits sont impossibles. Ce n'est pas un jeu d'argent.",
    'footer.disclaimer': "Pas d'argent réel - seulement des coins virtuels.",
    'footer.privacy': 'Confidentialité',
    'footer.project': 'Ce projet est un projet étudiant non commercial à des fins éducatives et de divertissement. Recommandé aux 18 ans et plus.',
    'footer.studentProject': 'Projet étudiant',
    'hand.empty': 'Prêt pour la prochaine manche',
    'hand.status.active': 'Actif',
    'hand.status.blackjack': 'Blackjack',
    'hand.status.busted': 'Sauté',
    'hand.status.stood': 'Resté',
    'hand.status.surrendered': 'Abandon',
    'home.crates': 'Caisses',
    'home.dailyRewards': 'RÉCOMPENSE QUOTIDIENNE',
    'home.enter': 'ENTRER DANS BETCEPTION',
    'home.loggedInAs': 'Connecté en tant que',
    'home.logout': 'Déconnexion',
    'home.subtitle': "Où la réalité n'est qu'une variable de plus.",
    'home.toast.accountCreated': 'Compte créé ! Connecté en tant que {{name}}.',
    'home.toast.actionFailed': "L'action n'a pas abouti. Réessaie.",
    'home.toast.loginRequiredPlay': 'Connecte-toi pour jouer à Betception Blackjack.',
    'home.toast.loginRequiredReward': 'Connecte-toi pour récupérer ta récompense quotidienne.',
    'home.toast.unknownError': 'Erreur inconnue. Réessaie.',
    'home.toast.welcomeBack': 'Bon retour, {{name}}!',
    'leaderboard.balanceDescription': 'Top des soldes - qui a le plus de coins ?',
    'leaderboard.currentRank': 'Ton rang actuel',
    'leaderboard.levelDescription': 'Niveau le plus élevé et progression XP.',
    'leaderboard.loading': 'Chargement de {{label}}...',
    'leaderboard.netWinnings': 'Gains nets (7j)',
    'leaderboard.noRank': 'Joue plus de manches pour apparaître dans le classement.',
    'leaderboard.player': 'Joueur',
    'leaderboard.rank': 'Rang',
    'leaderboard.title': 'Leaderboard',
    'leaderboard.winnings': 'Gains',
    'leaderboard.winningsDescription': 'Gains nets des 7 derniers jours.',
    'round.aborted': 'Annulée',
    'round.created': 'Commencée',
    'round.dealing': 'Distribution',
    'round.inProgress': 'En cours',
    'round.ready': 'Prêt',
    'round.settled': 'Validée',
    'toast.error': 'Erreur',
    'toast.info': 'Info',
    'toast.success': 'Succès',
    'tutorial.basics': 'Bases du blackjack',
    'tutorial.close': 'Fermer le tutoriel',
    'tutorial.count': '{{current}} / {{total}}',
    'tutorial.next': 'Suivant',
    'tutorial.previous': 'Retour',
    'tutorial.step': 'Étape {{step}}',
    'tutorial.stepsLabel': 'Étapes du tutoriel',
    'tutorial.understood': 'Compris',
    'powerup.title': 'Power-ups',
    'powerup.inventory': 'Mon Inventaire',
    'powerup.shop': 'Boutique',
    'powerup.activate': 'Activer',
    'powerup.buy': 'Acheter',
    'powerup.empty': 'Aucun power-up dans l\'inventaire',
    'powerup.button': '⚡ Power-ups',
    'powerup.peek.reveal': '2e carte dealer:',
    'powerup.locked': 'Dès Niveau {{level}}',
    'powerup.queue': 'Activer',
    'powerup.queued': '✓ Actif',
    'powerup.ingame': 'En jeu',
    'powerup.peekBtn': '👁️ Voir carte',
    'powerup.pillShopTitle': 'Acheter une power pill',
    'powerup.pillShopSubtitle': 'Active une pilule pour 3 manches. Une seule pilule peut être active.',
    'powerup.redPill': 'Pilule rouge',
    'powerup.redPillDescription': 'Chance 1:5 de déclencher un gain x3 sur une victoire.',
    'powerup.bluePill': 'Pilule bleue',
    'powerup.bluePillDescription': 'Chance 1:8 de protéger une manche perdue sans perte.',
    'powerup.slotOccupied': 'Emplacement occupé',
    'powerup.unavailable': 'Indisponible',
    'powerup.undoBtn': '↩️ Annuler',
    'powerup.swapBtn': '🔄 Échanger',
  },
};

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly languages: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
    { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
    { code: 'fr', label: 'French', nativeLabel: 'Français' },
  ];

  private readonly isBrowser: boolean;
  private readonly languageSignal = signal<LanguageCode>('de');

  readonly language = this.languageSignal.asReadonly();

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    const savedLanguage = this.readSavedLanguage();
    this.languageSignal.set(savedLanguage);
    this.applyDocumentLanguage(savedLanguage);
  }

  setLanguage(language: LanguageCode) {
    this.languageSignal.set(language);
    if (this.isBrowser) {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
    this.applyDocumentLanguage(language);
  }

  t(key: TranslationKey, params: Record<string, string | number> = {}) {
    const language = this.languageSignal();
    const template = TRANSLATIONS[language][key] ?? TRANSLATIONS.de[key] ?? key;
    return Object.entries(params).reduce(
      (value, [paramKey, paramValue]) => value.replaceAll(`{{${paramKey}}}`, String(paramValue)),
      template,
    );
  }

  private readSavedLanguage(): LanguageCode {
    if (!this.isBrowser) {
      return 'de';
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return this.isLanguageCode(saved) ? saved : 'de';
  }

  private isLanguageCode(value: string | null): value is LanguageCode {
    return value === 'de' || value === 'en' || value === 'es' || value === 'fr';
  }

  private applyDocumentLanguage(language: LanguageCode) {
    if (this.isBrowser) {
      document.documentElement.lang = language;
    }
  }
}
