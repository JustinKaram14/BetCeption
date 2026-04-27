import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type LanguageCode = 'de' | 'en' | 'es' | 'fr';

type TranslationKey =
  | 'auth.createAccount'
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
  | 'common.close'
  | 'common.coins'
  | 'common.dealer'
  | 'common.home'
  | 'common.howToPlay'
  | 'common.language'
  | 'common.ok'
  | 'common.player'
  | 'common.settings'
  | 'controls.balance'
  | 'controls.bet'
  | 'controls.deal'
  | 'controls.hit'
  | 'controls.reset'
  | 'controls.round'
  | 'controls.settle'
  | 'controls.stand'
  | 'daily.alreadyCopy'
  | 'daily.alreadyTitle'
  | 'daily.availableNow'
  | 'daily.balance'
  | 'daily.errorTitle'
  | 'daily.loading'
  | 'daily.next'
  | 'daily.notLoggedCopy'
  | 'daily.notLoggedTitle'
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
  | 'home.dailyRewards'
  | 'home.enter'
  | 'home.loggedInAs'
  | 'home.logout'
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
  | 'tutorial.understood';

type TranslationMap = Record<TranslationKey, string>;

const STORAGE_KEY = 'betception-language';

const TRANSLATIONS: Record<LanguageCode, TranslationMap> = {
  de: {
    'auth.createAccount': 'ACCOUNT ERSTELLEN',
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
    'common.close': 'Schließen',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Start',
    'common.howToPlay': 'Spielanleitung',
    'common.language': 'Sprache',
    'common.ok': 'OK',
    'common.player': 'Spieler',
    'common.settings': 'Einstellungen',
    'controls.balance': 'Guthaben',
    'controls.bet': 'Einsatz',
    'controls.deal': 'Austeilen',
    'controls.hit': 'Ziehen',
    'controls.reset': 'Reset',
    'controls.round': 'Runde',
    'controls.settle': 'Abrechnen',
    'controls.stand': 'Halten',
    'daily.alreadyCopy': 'Du hast deine tägliche Belohnung heute schon abgeholt.',
    'daily.alreadyTitle': 'Bereits abgeholt!',
    'daily.availableNow': 'Jetzt verfügbar!',
    'daily.balance': 'Neues Guthaben',
    'daily.errorTitle': 'Fehler',
    'daily.loading': 'Belohnung wird geladen...',
    'daily.next': 'Nächste Belohnung in',
    'daily.notLoggedCopy': 'Bitte logge dich ein, um deine tägliche Belohnung abzuholen.',
    'daily.notLoggedTitle': 'Nicht eingeloggt',
    'daily.title': 'Tägliche Belohnung!',
    'footer.copy': 'BetCeption verwendet ausschließlich virtuelles Spielgeld ohne realen Gegenwert. Es sind keine Ein- oder Auszahlungen möglich. Dies ist kein Glücksspiel im Sinne des GlüStV.',
    'footer.disclaimer': 'Kein Echtgeld - Nur virtuelle Coins.',
    'footer.privacy': 'Datenschutz',
    'footer.project': 'Dieses Projekt ist ein nicht-kommerzielles Studentenprojekt zu Bildungs- und Unterhaltungszwecken. Empfohlen ab 18 Jahren.',
    'footer.studentProject': 'Studentenprojekt',
    'hand.empty': 'Bereit für die nächste Runde',
    'hand.status.active': 'Aktiv',
    'hand.status.blackjack': 'Blackjack',
    'hand.status.busted': 'Über 21',
    'hand.status.stood': 'Gehalten',
    'hand.status.surrendered': 'Aufgegeben',
    'home.dailyRewards': 'TÄGLICHE BELOHNUNG',
    'home.enter': 'BETCEPTION STARTEN',
    'home.loggedInAs': 'Eingeloggt als',
    'home.logout': 'Abmelden',
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
    'round.dealing': 'Karten werden ausgeteilt',
    'round.inProgress': 'Läuft',
    'round.ready': 'Bereit',
    'round.settled': 'Abgerechnet',
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
  },
  en: {
    'auth.createAccount': 'CREATE ACCOUNT',
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
    'common.close': 'Close',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Home',
    'common.howToPlay': 'How to Play',
    'common.language': 'Language',
    'common.ok': 'OK',
    'common.player': 'Player',
    'common.settings': 'Settings',
    'controls.balance': 'Balance',
    'controls.bet': 'Bet',
    'controls.deal': 'Deal',
    'controls.hit': 'Hit',
    'controls.reset': 'Clear',
    'controls.round': 'Round',
    'controls.settle': 'Settle',
    'controls.stand': 'Stand',
    'daily.alreadyCopy': 'You already claimed your daily reward today.',
    'daily.alreadyTitle': 'Already claimed!',
    'daily.availableNow': 'Available now!',
    'daily.balance': 'New balance',
    'daily.errorTitle': 'Error',
    'daily.loading': 'Loading reward...',
    'daily.next': 'Next reward in',
    'daily.notLoggedCopy': 'Please log in to claim your daily reward.',
    'daily.notLoggedTitle': 'Not logged in',
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
    'home.dailyRewards': 'DAILY REWARDS',
    'home.enter': 'ENTER BETCEPTION',
    'home.loggedInAs': 'Logged in as',
    'home.logout': 'Log out',
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
  },
  es: {
    'auth.createAccount': 'CREAR CUENTA',
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
    'common.close': 'Cerrar',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Inicio',
    'common.howToPlay': 'Cómo jugar',
    'common.language': 'Idioma',
    'common.ok': 'OK',
    'common.player': 'Jugador',
    'common.settings': 'Ajustes',
    'controls.balance': 'Saldo',
    'controls.bet': 'Apuesta',
    'controls.deal': 'Dar',
    'controls.hit': 'Pedir',
    'controls.reset': 'Reset',
    'controls.round': 'Ronda',
    'controls.settle': 'Resolver',
    'controls.stand': 'Plantar',
    'daily.alreadyCopy': 'Ya reclamaste tu recompensa diaria hoy.',
    'daily.alreadyTitle': '¡Ya reclamada!',
    'daily.availableNow': '¡Disponible ahora!',
    'daily.balance': 'Nuevo saldo',
    'daily.errorTitle': 'Error',
    'daily.loading': 'Cargando recompensa...',
    'daily.next': 'Próxima recompensa en',
    'daily.notLoggedCopy': 'Inicia sesión para reclamar tu recompensa diaria.',
    'daily.notLoggedTitle': 'No has iniciado sesión',
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
    'home.dailyRewards': 'RECOMPENSAS DIARIAS',
    'home.enter': 'ENTRAR A BETCEPTION',
    'home.loggedInAs': 'Sesión iniciada como',
    'home.logout': 'Cerrar sesión',
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
  },
  fr: {
    'auth.createAccount': 'CRÉER UN COMPTE',
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
    'common.close': 'Fermer',
    'common.coins': 'Coins',
    'common.dealer': 'Dealer',
    'common.home': 'Accueil',
    'common.howToPlay': 'Comment jouer',
    'common.language': 'Langue',
    'common.ok': 'OK',
    'common.player': 'Joueur',
    'common.settings': 'Paramètres',
    'controls.balance': 'Solde',
    'controls.bet': 'Mise',
    'controls.deal': 'Donner',
    'controls.hit': 'Tirer',
    'controls.reset': 'Annuler',
    'controls.round': 'Manche',
    'controls.settle': 'Régler',
    'controls.stand': 'Rester',
    'daily.alreadyCopy': "Tu as déjà récupéré ta récompense quotidienne aujourd'hui.",
    'daily.alreadyTitle': 'Déjà récupérée !',
    'daily.availableNow': 'Disponible maintenant!',
    'daily.balance': 'Nouveau solde',
    'daily.errorTitle': 'Erreur',
    'daily.loading': 'Chargement de la récompense...',
    'daily.next': 'Prochaine récompense dans',
    'daily.notLoggedCopy': 'Connecte-toi pour récupérer ta récompense quotidienne.',
    'daily.notLoggedTitle': 'Non connecté',
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
    'home.dailyRewards': 'RÉCOMPENSE QUOTIDIENNE',
    'home.enter': 'ENTRER DANS BETCEPTION',
    'home.loggedInAs': 'Connecté en tant que',
    'home.logout': 'Déconnexion',
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
