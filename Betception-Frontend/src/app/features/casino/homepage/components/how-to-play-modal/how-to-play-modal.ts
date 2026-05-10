import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { I18n, LanguageCode } from '../../../../../core/i18n/i18n';

type TutorialStep = {
  title: string;
  eyebrow: string;
  copy: string;
  dealer: string[];
  player: string[];
  action?: 'hit' | 'stand' | 'dealer' | 'blackjack' | 'double' | 'split';
  actionLabel?: string;
  hint: string;
};

type TutorialCategory = 'blackjack' | 'betception';

type TutorialCategoryCopy = {
  label: string;
  eyebrow: string;
};

const TUTORIAL_STEPS: Record<LanguageCode, TutorialStep[]> = {
  de: [
    {
      eyebrow: 'Ziel',
      title: 'Schlage den Dealer, nicht die 21',
      copy: 'Deine Karten sollen am Ende mehr wert sein als die Karten des Dealers. Wenn du über 21 kommst, verlierst du sofort.',
      dealer: ['9', '?'],
      player: ['10', '7'],
      action: 'stand',
      actionLabel: '17',
      hint: 'In diesem Beispiel hast du 17. Das ist spielbar, aber nicht sicher. Blackjack ist immer Abwägen zwischen Risiko und Sicherheit.',
    },
    {
      eyebrow: 'Kartenwerte',
      title: 'Bilder zählen 10, Ass zählt flexibel',
      copy: 'Zahlenkarten zählen ihren Wert. Bube, Dame und König zählen 10. Ein Ass zählt als 11, solange du dadurch nicht über 21 kommst, sonst als 1.',
      dealer: ['K', '?'],
      player: ['A', '7'],
      action: 'blackjack',
      actionLabel: '18',
      hint: 'A + 7 ist 18. Würdest du eine hohe Karte ziehen, kann das Ass automatisch als 1 zählen.',
    },
    {
      eyebrow: 'Karte ziehen',
      title: 'Bei niedrigen Händen ziehst du nach',
      copy: 'Mit Karte ziehen nimmst du eine weitere Karte. Das ist sinnvoll, wenn deine Summe niedrig ist und du noch kaum Risiko hast, über 21 zu kommen.',
      dealer: ['10', '?'],
      player: ['6', '5'],
      action: 'hit',
      actionLabel: 'ZIEHEN',
      hint: 'Du hast 11. Hier ist Karte ziehen logisch, weil dich keine einzelne Karte über 21 bringen kann.',
    },
    {
      eyebrow: 'Stehen bleiben',
      title: 'Bei starken Händen bleibst du stehen',
      copy: 'Mit Stehen bleiben behältst du deine aktuelle Summe. Danach ist der Dealer dran. Je höher deine Summe, desto gefährlicher wird eine weitere Karte.',
      dealer: ['8', '?'],
      player: ['10', '8'],
      action: 'stand',
      actionLabel: 'STEHEN',
      hint: 'Du hast 18. Eine weitere Karte kann helfen, aber viele Karten würden dich über 21 bringen. Stehen bleiben ist hier meistens die saubere Grundentscheidung.',
    },
    {
      eyebrow: 'Verdoppeln',
      title: 'Einsatz verdoppeln für eine Extrakarte',
      copy: 'Wenn deine ersten zwei Karten eine gute Ausgangslage ergeben, kannst du deinen Einsatz verdoppeln. Du bekommst genau eine weitere Karte und bleibst danach automatisch stehen.',
      dealer: ['6', '?'],
      player: ['5', '6'],
      action: 'double',
      actionLabel: 'VERDOPPELN',
      hint: 'Du hast 11 – jede Zehn-Karte bringt dich auf 21. Gegen eine offene 6 beim Dealer ist das eine Lehrbuch-Situation zum Verdoppeln.',
    },
    {
      eyebrow: 'Teilen',
      title: 'Gleiche Karten in zwei Hände aufteilen',
      copy: 'Wenn deine ersten zwei Karten denselben Wert haben, kannst du sie teilen. Du zahlst denselben Einsatz ein zweites Mal und spielst dann zwei unabhängige Hände.',
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: 'TEILEN',
      hint: 'Zwei 8er ergeben 16 – eine der schlechtesten Hände. Geteilt hast du zweimal 8 als Startpunkt, was deutlich besser zu spielen ist.',
    },
    {
      eyebrow: 'Dealer',
      title: 'Der Dealer spielt nach festen Regeln',
      copy: 'Wenn du stehen bleibst, deckt der Dealer seine verdeckte Karte auf. Danach zieht er weiter, bis er mindestens 17 erreicht.',
      dealer: ['10', '6', '5'],
      player: ['10', '8'],
      action: 'dealer',
      actionLabel: '21',
      hint: 'Hier zieht der Dealer eine 5 und landet bei 21. Du verlierst mit 18, obwohl deine Entscheidung vorher nicht automatisch falsch war.',
    },
    {
      eyebrow: 'Merksatz',
      title: 'Erst deine Summe, dann die Dealer-Karte',
      copy: 'Frag dich immer: Wie stark ist meine Hand? Wie gefährlich ist die offene Karte des Dealers? Daraus entsteht deine Entscheidung.',
      dealer: ['6', '?'],
      player: ['10', '2'],
      action: 'hit',
      actionLabel: 'ZIEHEN',
      hint: 'Mit 12 bist du schwach. Gegen eine offene 6 kann man auch vorsichtig stehen, aber als Basic-Tutorial gilt: niedrige Hände müssen verbessert werden.',
    },
  ],
  en: [
    {
      eyebrow: 'Goal',
      title: 'Beat the dealer, not 21',
      copy: "Your cards should end up worth more than the dealer's cards. If you go over 21, you lose immediately.",
      dealer: ['9', '?'],
      player: ['10', '7'],
      action: 'stand',
      actionLabel: '17',
      hint: 'In this example you have 17. It is playable, but not safe. Blackjack is always a balance between risk and safety.',
    },
    {
      eyebrow: 'Card values',
      title: 'Face cards count 10, aces are flexible',
      copy: 'Number cards count their value. Jack, queen, and king count 10. An ace counts as 11 unless that would put you over 21, then it counts as 1.',
      dealer: ['K', '?'],
      player: ['A', '7'],
      action: 'blackjack',
      actionLabel: '18',
      hint: 'A + 7 is 18. If you draw a high card, the ace can automatically count as 1.',
    },
    {
      eyebrow: 'Hit',
      title: 'Draw on low hands',
      copy: 'Hit takes one more card. That makes sense when your total is low and your bust risk is small.',
      dealer: ['10', '?'],
      player: ['6', '5'],
      action: 'hit',
      actionLabel: 'HIT',
      hint: 'You have 11. Hit is logical because no single card can put you over 21.',
    },
    {
      eyebrow: 'Stand',
      title: 'Stay on strong hands',
      copy: 'Stand keeps your current total. Then the dealer plays. The higher your total, the more dangerous another hit becomes.',
      dealer: ['8', '?'],
      player: ['10', '8'],
      action: 'stand',
      actionLabel: 'STAND',
      hint: 'You have 18. A hit can help, but many cards would bust you. Stand is usually the clean basic decision here.',
    },
    {
      eyebrow: 'Double',
      title: 'Double your bet for one extra card',
      copy: 'When your first two cards give you a strong starting point, you can double your bet. You receive exactly one more card and then automatically stand.',
      dealer: ['6', '?'],
      player: ['5', '6'],
      action: 'double',
      actionLabel: 'DOUBLE',
      hint: 'You have 11 — any ten-value card (10, J, Q, K) makes 21. Against a dealer 6 this is a textbook doubling situation.',
    },
    {
      eyebrow: 'Split',
      title: 'Split equal cards into two hands',
      copy: 'When your first two cards have the same value, you can split them. You pay the same bet a second time and then play two independent hands.',
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: 'SPLIT',
      hint: "Two 8s add up to 16 — one of the worst hands. Split gives you two hands starting at 8 each, which is far easier to play.",
    },
    {
      eyebrow: 'Dealer',
      title: 'The dealer follows fixed rules',
      copy: 'When you stand, the dealer reveals the hidden card. Then the dealer draws until reaching at least 17.',
      dealer: ['10', '6', '5'],
      player: ['10', '8'],
      action: 'dealer',
      actionLabel: '21',
      hint: 'Here the dealer draws a 5 and reaches 21. You lose with 18, even though your earlier decision was not automatically wrong.',
    },
    {
      eyebrow: 'Rule of thumb',
      title: 'Your total first, then the dealer card',
      copy: "Always ask: How strong is my hand? How dangerous is the dealer's open card? Your decision comes from that.",
      dealer: ['6', '?'],
      player: ['10', '2'],
      action: 'hit',
      actionLabel: 'HIT',
      hint: 'With 12 you are weak. Against an open 6 you can also stand carefully, but as a basic tutorial: low hands need improvement.',
    },
  ],
  es: [
    {
      eyebrow: 'Objetivo',
      title: 'Vence al dealer, no al 21',
      copy: 'Tus cartas deben valer más que las del dealer al final. Si pasas de 21, pierdes de inmediato.',
      dealer: ['9', '?'],
      player: ['10', '7'],
      action: 'stand',
      actionLabel: '17',
      hint: 'En este ejemplo tienes 17. Se puede jugar, pero no es seguro. Blackjack siempre equilibra riesgo y seguridad.',
    },
    {
      eyebrow: 'Valores',
      title: 'Figuras valen 10, el as es flexible',
      copy: 'Las cartas numéricas cuentan su valor. J, Q y K valen 10. Un as vale 11 salvo que te pase de 21; entonces vale 1.',
      dealer: ['K', '?'],
      player: ['A', '7'],
      action: 'blackjack',
      actionLabel: '18',
      hint: 'A + 7 es 18. Si robas una carta alta, el as puede contar automáticamente como 1.',
    },
    {
      eyebrow: 'Pedir',
      title: 'Pide carta con manos bajas',
      copy: 'Pedir añade una carta. Tiene sentido si tu suma es baja y casi no hay riesgo de pasarte.',
      dealer: ['10', '?'],
      player: ['6', '5'],
      action: 'hit',
      actionLabel: 'PEDIR',
      hint: 'Tienes 11. Pedir es lógico porque ninguna carta individual te pasa de 21.',
    },
    {
      eyebrow: 'Plantarse',
      title: 'Plántate con manos fuertes',
      copy: 'Plantarse conserva tu suma actual. Luego juega el dealer. Cuanto más alta sea tu suma, más peligroso es pedir otra carta.',
      dealer: ['8', '?'],
      player: ['10', '8'],
      action: 'stand',
      actionLabel: 'STAND',
      hint: 'Tienes 18. Pedir puede ayudar, pero muchas cartas te harían pasar. Plantarse suele ser la decisión básica limpia.',
    },
    {
      eyebrow: 'Doblar',
      title: 'Dobla tu apuesta para una carta extra',
      copy: 'Si tus dos primeras cartas dan una buena base, puedes doblar la apuesta. Recibes exactamente una carta más y luego te plantarás automáticamente.',
      dealer: ['6', '?'],
      player: ['5', '6'],
      action: 'double',
      actionLabel: 'DOBLAR',
      hint: 'Tienes 11 — cualquier carta de valor diez (10, J, Q, K) te da 21. Contra un 6 del dealer es una situación de libro para doblar.',
    },
    {
      eyebrow: 'Dividir',
      title: 'Divide cartas iguales en dos manos',
      copy: 'Si tus dos primeras cartas tienen el mismo valor, puedes dividirlas. Pagas la misma apuesta una segunda vez y juegas dos manos independientes.',
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: 'DIVIDIR',
      hint: 'Dos 8 suman 16, una de las peores manos. Divididas, tienes dos manos que empiezan en 8, lo cual es mucho más fácil de jugar.',
    },
    {
      eyebrow: 'Dealer',
      title: 'El dealer sigue reglas fijas',
      copy: 'Cuando te plantas, el dealer revela su carta oculta. Después roba hasta alcanzar al menos 17.',
      dealer: ['10', '6', '5'],
      player: ['10', '8'],
      action: 'dealer',
      actionLabel: '21',
      hint: 'Aquí el dealer roba un 5 y llega a 21. Pierdes con 18, aunque tu decisión anterior no era automáticamente mala.',
    },
    {
      eyebrow: 'Regla rápida',
      title: 'Primero tu suma, luego la carta del dealer',
      copy: 'Pregúntate siempre: ¿qué tan fuerte es mi mano? ¿Qué tan peligrosa es la carta visible del dealer? De ahí sale tu decisión.',
      dealer: ['6', '?'],
      player: ['10', '2'],
      action: 'hit',
      actionLabel: 'PEDIR',
      hint: 'Con 12 eres débil. Contra un 6 visible también puedes plantarte con cuidado, pero como tutorial básico: las manos bajas deben mejorar.',
    },
  ],
  fr: [
    {
      eyebrow: 'Objectif',
      title: 'Bats le dealer, pas le 21',
      copy: 'Tes cartes doivent valoir plus que celles du dealer à la fin. Si tu dépasses 21, tu perds tout de suite.',
      dealer: ['9', '?'],
      player: ['10', '7'],
      action: 'stand',
      actionLabel: '17',
      hint: "Dans cet exemple tu as 17. C'est jouable, mais pas sûr. Le blackjack équilibre toujours risque et sécurité.",
    },
    {
      eyebrow: 'Valeurs',
      title: "Les figures valent 10, l'as est flexible",
      copy: 'Les cartes numériques gardent leur valeur. Valet, dame et roi valent 10. Un as vaut 11 sauf si cela te fait dépasser 21; sinon il vaut 1.',
      dealer: ['K', '?'],
      player: ['A', '7'],
      action: 'blackjack',
      actionLabel: '18',
      hint: "A + 7 fait 18. Si tu tires une grosse carte, l'as peut compter automatiquement comme 1.",
    },
    {
      eyebrow: 'Carte',
      title: 'Tire avec les mains faibles',
      copy: "Tirer ajoute une carte. C'est logique quand ton total est bas et que le risque de dépasser est faible.",
      dealer: ['10', '?'],
      player: ['6', '5'],
      action: 'hit',
      actionLabel: 'CARTE',
      hint: 'Tu as 11. Tirer est logique car aucune carte seule ne peut te faire dépasser 21.',
    },
    {
      eyebrow: 'Rester',
      title: 'Reste avec les mains fortes',
      copy: 'Rester garde ton total actuel. Ensuite le dealer joue. Plus ton total est haut, plus une autre carte devient dangereuse.',
      dealer: ['8', '?'],
      player: ['10', '8'],
      action: 'stand',
      actionLabel: 'RESTER',
      hint: 'Tu as 18. Une carte peut aider, mais beaucoup de cartes te feraient dépasser. Rester est souvent la bonne décision de base.',
    },
    {
      eyebrow: 'Doubler',
      title: 'Double ta mise pour une carte de plus',
      copy: "Quand tes deux premières cartes te donnent une bonne base, tu peux doubler ta mise. Tu reçois exactement une carte de plus, puis tu restes automatiquement.",
      dealer: ['6', '?'],
      player: ['5', '6'],
      action: 'double',
      actionLabel: 'DOUBLER',
      hint: "Tu as 11 — toute carte valant dix (10, V, D, R) te donne 21. Contre un 6 du dealer c'est une situation classique pour doubler.",
    },
    {
      eyebrow: 'Diviser',
      title: 'Sépare les cartes égales en deux mains',
      copy: "Quand tes deux premières cartes ont la même valeur, tu peux les séparer. Tu paies la même mise une deuxième fois et tu joues deux mains indépendantes.",
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: 'DIVISER',
      hint: "Deux 8 font 16, l'une des pires mains. Séparées, tu as deux mains à 8 — bien plus jouable.",
    },
    {
      eyebrow: 'Dealer',
      title: 'Le dealer suit des règles fixes',
      copy: "Quand tu restes, le dealer révèle sa carte cachée. Ensuite il tire jusqu'à atteindre au moins 17.",
      dealer: ['10', '6', '5'],
      player: ['10', '8'],
      action: 'dealer',
      actionLabel: '21',
      hint: "Ici le dealer tire un 5 et atteint 21. Tu perds avec 18, même si ta décision précédente n'était pas automatiquement mauvaise.",
    },
    {
      eyebrow: 'Repère',
      title: "Ton total d'abord, puis la carte du dealer",
      copy: 'Demande-toi toujours: ma main est-elle forte? La carte visible du dealer est-elle dangereuse? Ta décision vient de là.',
      dealer: ['6', '?'],
      player: ['10', '2'],
      action: 'hit',
      actionLabel: 'CARTE',
      hint: 'Avec 12 tu es faible. Contre un 6 visible, tu peux aussi rester prudemment, mais pour ce tutoriel: les mains faibles doivent progresser.',
    },
  ],
};

const TUTORIAL_CATEGORIES: Record<LanguageCode, Record<TutorialCategory, TutorialCategoryCopy>> = {
  de: {
    blackjack: { label: 'Blackjack Basics', eyebrow: 'Grundregeln' },
    betception: { label: 'Betception', eyebrow: 'Sidebets & Depth' },
  },
  en: {
    blackjack: { label: 'Blackjack Basics', eyebrow: 'Core rules' },
    betception: { label: 'Betception', eyebrow: 'Side bets & depth' },
  },
  es: {
    blackjack: { label: 'Bases de blackjack', eyebrow: 'Reglas base' },
    betception: { label: 'Betception', eyebrow: 'Sidebets y depth' },
  },
  fr: {
    blackjack: { label: 'Bases du blackjack', eyebrow: 'Regles de base' },
    betception: { label: 'Betception', eyebrow: 'Side bets et profondeur' },
  },
};

const BETCEPTION_STEPS: Record<LanguageCode, TutorialStep[]> = {
  de: [
    {
      eyebrow: 'Konzept',
      title: 'Blackjack, aber du wettest auf die Wetten',
      copy: 'Betception startet mit deinem normalen Einsatz. Danach kannst du zusätzliche Vorhersagen setzen: Karten, Farben, Dealer Bust, Pillen-Trigger, Blackjack oder Split-Anzahl.',
      dealer: ['D', '?'],
      player: ['B', 'C'],
      action: 'blackjack',
      actionLabel: '2D+',
      hint: 'Jede aktive Sidebet erhöht das Depth Level. 1D ist nur die Main Bet, weitere Ebenen machen die Runde tiefer.',
    },
    {
      eyebrow: 'Kartenwetten',
      title: 'Wette auf exakte Karten oder Farben',
      copy: 'Im Kartenmenü kannst du auf eine exakte Karte oder auf eine komplette Farbe setzen. Exakte Karten zahlen aktuell 12:1, Farben zahlen aktuell 2:1. Wird noch geändert.',
      dealer: ['A', '?'],
      player: ['J', '♦'],
      action: 'hit',
      actionLabel: '12:1',
      hint: 'Die Karte oder Farbe muss in deiner Spielerhand auftauchen. Dealer-Karten zählen dafür nicht.',
    },
    {
      eyebrow: 'Dealer Bust',
      title: 'Wette darauf, dass der Dealer über 21 geht',
      copy: 'Dealer Bust gewinnt, wenn der Dealer nach deinem Zug Karten ziehen muss und dabei über 21 kommt. Die Auszahlung ist aktuell 3:1. Wird noch geändert.',
      dealer: ['10', '6', 'K'],
      player: ['9', '9'],
      action: 'dealer',
      actionLabel: '3:1',
      hint: 'Bustest du selbst vorher, zieht der Dealer nicht weiter. Dann kann diese Wette auch nicht treffen.',
    },
    {
      eyebrow: 'Pillen',
      title: 'Wette auf den Trigger deiner aktiven Pille',
      copy: 'Wenn eine rote oder blaue Pille im Slot liegt, kannst du darauf setzen, dass ihr Effekt in dieser Runde auslöst. Diese Sidebet zahlt aktuell 5:1. Wird noch geändert.',
      dealer: ['8', '?'],
      player: ['10', '7'],
      action: 'double',
      actionLabel: '5:1',
      hint: 'Die Pille nutzt trotzdem pro abgerechneter Runde einen Use, egal ob der Effekt triggert oder nicht.',
    },
    {
      eyebrow: 'Blackjack',
      title: 'Wette auf Blackjack mit den ersten zwei Karten',
      copy: 'Die Blackjack-Wette trifft, wenn deine ersten zwei Karten direkt Blackjack ergeben. Die Auszahlung ist aktuell 12:1. Wird noch geändert.',
      dealer: ['9', '?'],
      player: ['A', 'K'],
      action: 'blackjack',
      actionLabel: '12:1',
      hint: 'Diese Wette bezieht sich auf den natürlichen Start-Blackjack, nicht auf später gezogene 21.',
    },
    {
      eyebrow: 'Split',
      title: 'Wette darauf, wie oft du splitten wirst',
      copy: 'Bei der Split-Wette sagst du vorher an, ob du genau 1x, 2x oder 3x splitten wirst. Aktuell zahlt 1x 4:1, 2x 18:1 und 3x 60:1. Wird noch geändert.',
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: '60:1',
      hint: 'Es zählt die tatsächliche Anzahl deiner Splits in dieser Runde, nicht nur ob ein Paar möglich war.',
    },
    {
      eyebrow: 'Auswertung',
      title: 'Nach der Runde wird alles nacheinander aufgelöst',
      copy: 'Erst läuft die Kartenrunde sauber zu Ende. Danach wertet das rechte Betception-Panel Main Bet und Sidebets Schritt für Schritt aus und zählt die Auszahlung hoch.',
      dealer: ['Q', '7'],
      player: ['10', '9'],
      action: 'stand',
      actionLabel: 'WIN',
      hint: 'Je mehr Vorhersagen gleichzeitig treffen, desto stärker fühlt sich die Endauszahlung an.',
    },
  ],
  en: [
    {
      eyebrow: 'Concept',
      title: 'Blackjack, but you bet on the bets',
      copy: 'Betception starts with your normal wager. After that you can add predictions: cards, suits, dealer bust, pill trigger, blackjack, or split count.',
      dealer: ['D', '?'],
      player: ['B', 'C'],
      action: 'blackjack',
      actionLabel: '2D+',
      hint: 'Each active side bet raises the depth level. 1D is only the main bet; extra layers make the round deeper.',
    },
    {
      eyebrow: 'Card bets',
      title: 'Bet on exact cards or suits',
      copy: 'In the card menu you can bet on one exact card or an entire suit. Exact cards currently pay 12:1, suits currently pay 2:1. Subject to change.',
      dealer: ['A', '?'],
      player: ['J', '♦'],
      action: 'hit',
      actionLabel: '12:1',
      hint: 'The card or suit must appear in your player hand. Dealer cards do not count for this bet.',
    },
    {
      eyebrow: 'Dealer bust',
      title: 'Bet that the dealer goes over 21',
      copy: 'Dealer Bust wins when the dealer has to draw after your turn and goes over 21. The current payout is 3:1. Subject to change.',
      dealer: ['10', '6', 'K'],
      player: ['9', '9'],
      action: 'dealer',
      actionLabel: '3:1',
      hint: 'If you bust first, the dealer does not draw further. Then this bet cannot hit.',
    },
    {
      eyebrow: 'Pills',
      title: 'Bet on your active pill triggering',
      copy: 'If a red or blue pill is equipped, you can bet that its effect triggers this round. This side bet currently pays 5:1. Subject to change.',
      dealer: ['8', '?'],
      player: ['10', '7'],
      action: 'double',
      actionLabel: '5:1',
      hint: 'The pill still spends one use per settled round, whether the effect triggers or not.',
    },
    {
      eyebrow: 'Blackjack',
      title: 'Bet on blackjack from the first two cards',
      copy: 'The blackjack bet hits when your first two cards form a natural blackjack. The current payout is 12:1. Subject to change.',
      dealer: ['9', '?'],
      player: ['A', 'K'],
      action: 'blackjack',
      actionLabel: '12:1',
      hint: 'This bet is about the natural starting blackjack, not reaching 21 later with extra cards.',
    },
    {
      eyebrow: 'Split',
      title: 'Bet how many times you will split',
      copy: 'With the split-count bet you predict exactly 1x, 2x, or 3x splits. Current payouts are 1x 4:1, 2x 18:1, and 3x 60:1. Subject to change.',
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: '60:1',
      hint: 'It counts the actual number of splits in the round, not only whether a pair was possible.',
    },
    {
      eyebrow: 'Resolution',
      title: 'After the round, everything resolves in sequence',
      copy: 'The card round finishes first. Then the Betception panel resolves the main bet and side bets step by step while the payout counts up.',
      dealer: ['Q', '7'],
      player: ['10', '9'],
      action: 'stand',
      actionLabel: 'WIN',
      hint: 'The more predictions hit together, the stronger the final payout feels.',
    },
  ],
  es: [
    {
      eyebrow: 'Concepto',
      title: 'Blackjack, pero apuestas sobre las apuestas',
      copy: 'Betception empieza con tu apuesta normal. Después puedes añadir predicciones: cartas, palos, bust del dealer, trigger de píldora, blackjack o número de splits.',
      dealer: ['D', '?'],
      player: ['B', 'C'],
      action: 'blackjack',
      actionLabel: '2D+',
      hint: 'Cada sidebet activa sube el depth level. 1D es solo la apuesta principal; más capas hacen la ronda más profunda.',
    },
    {
      eyebrow: 'Cartas',
      title: 'Apuesta por cartas exactas o palos',
      copy: 'En el menú de cartas puedes apostar por una carta exacta o por un palo completo. Las cartas exactas pagan 12:1 y los palos 2:1 actualmente. Se cambiará más adelante.',
      dealer: ['A', '?'],
      player: ['J', '♦'],
      action: 'hit',
      actionLabel: '12:1',
      hint: 'La carta o el palo debe aparecer en tu mano de jugador. Las cartas del dealer no cuentan.',
    },
    {
      eyebrow: 'Dealer bust',
      title: 'Apuesta a que el dealer pasa de 21',
      copy: 'Dealer Bust gana si el dealer tiene que robar después de tu turno y supera 21. El pago actual es 3:1. Se cambiará más adelante.',
      dealer: ['10', '6', 'K'],
      player: ['9', '9'],
      action: 'dealer',
      actionLabel: '3:1',
      hint: 'Si tú te pasas primero, el dealer no roba más. Entonces esta apuesta no puede acertar.',
    },
    {
      eyebrow: 'Píldoras',
      title: 'Apuesta al trigger de tu píldora activa',
      copy: 'Si tienes equipada una píldora roja o azul, puedes apostar a que su efecto se active en esta ronda. Esta sidebet paga actualmente 5:1. Se cambiará más adelante.',
      dealer: ['8', '?'],
      player: ['10', '7'],
      action: 'double',
      actionLabel: '5:1',
      hint: 'La píldora consume un uso por cada ronda liquidada, aunque el efecto no se active.',
    },
    {
      eyebrow: 'Blackjack',
      title: 'Apuesta por blackjack con las dos primeras cartas',
      copy: 'La apuesta de blackjack acierta si tus dos primeras cartas forman blackjack natural. El pago actual es 12:1. Se cambiará más adelante.',
      dealer: ['9', '?'],
      player: ['A', 'K'],
      action: 'blackjack',
      actionLabel: '12:1',
      hint: 'Esta apuesta cuenta el blackjack natural inicial, no llegar a 21 más tarde con cartas extra.',
    },
    {
      eyebrow: 'Split',
      title: 'Apuesta cuántas veces vas a dividir',
      copy: 'Con la apuesta de split predices exactamente 1x, 2x o 3x splits. Ahora paga 1x 4:1, 2x 18:1 y 3x 60:1. Se cambiará más adelante.',
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: '60:1',
      hint: 'Cuenta el número real de splits en la ronda, no solo si era posible dividir.',
    },
    {
      eyebrow: 'Resolución',
      title: 'Al final todo se resuelve en secuencia',
      copy: 'Primero termina la ronda de cartas. Después el panel Betception resuelve la apuesta principal y las sidebets paso a paso mientras sube el pago.',
      dealer: ['Q', '7'],
      player: ['10', '9'],
      action: 'stand',
      actionLabel: 'WIN',
      hint: 'Cuantas más predicciones acierten juntas, más fuerte se siente el pago final.',
    },
  ],
  fr: [
    {
      eyebrow: 'Concept',
      title: 'Blackjack, mais tu paries sur les paris',
      copy: 'Betception commence avec ta mise normale. Ensuite tu peux ajouter des prédictions: cartes, couleurs, dealer bust, trigger pilule, blackjack ou nombre de splits.',
      dealer: ['D', '?'],
      player: ['B', 'C'],
      action: 'blackjack',
      actionLabel: '2D+',
      hint: 'Chaque side bet active augmente le niveau de profondeur. 1D est seulement la mise principale; les couches ajoutées rendent la manche plus profonde.',
    },
    {
      eyebrow: 'Cartes',
      title: 'Parie sur des cartes exactes ou des couleurs',
      copy: 'Dans le menu cartes, tu peux parier sur une carte exacte ou une couleur complète. Les cartes exactes paient 12:1 et les couleurs 2:1 actuellement. Sera modifié.',
      dealer: ['A', '?'],
      player: ['J', '♦'],
      action: 'hit',
      actionLabel: '12:1',
      hint: 'La carte ou la couleur doit apparaître dans ta main. Les cartes du dealer ne comptent pas.',
    },
    {
      eyebrow: 'Dealer bust',
      title: 'Parie que le dealer dépasse 21',
      copy: 'Dealer Bust gagne si le dealer doit tirer après ton tour et dépasse 21. Le gain actuel est 3:1. Sera modifié.',
      dealer: ['10', '6', 'K'],
      player: ['9', '9'],
      action: 'dealer',
      actionLabel: '3:1',
      hint: 'Si tu bust avant, le dealer ne tire plus. Cette mise ne peut donc pas toucher.',
    },
    {
      eyebrow: 'Pilules',
      title: 'Parie sur le trigger de ta pilule active',
      copy: 'Si une pilule rouge ou bleue est équipée, tu peux parier que son effet se déclenche cette manche. Ce side bet paie actuellement 5:1. Sera modifié.',
      dealer: ['8', '?'],
      player: ['10', '7'],
      action: 'double',
      actionLabel: '5:1',
      hint: 'La pilule utilise quand même une charge par manche réglée, que l’effet se déclenche ou non.',
    },
    {
      eyebrow: 'Blackjack',
      title: 'Parie sur blackjack avec les deux premières cartes',
      copy: 'Le pari blackjack touche si tes deux premières cartes forment un blackjack naturel. Le gain actuel est 12:1. Sera modifié.',
      dealer: ['9', '?'],
      player: ['A', 'K'],
      action: 'blackjack',
      actionLabel: '12:1',
      hint: 'Ce pari concerne le blackjack naturel de départ, pas un total de 21 atteint plus tard.',
    },
    {
      eyebrow: 'Split',
      title: 'Parie combien de fois tu vas split',
      copy: 'Avec le pari split, tu prédis exactement 1x, 2x ou 3x splits. Actuellement: 1x paie 4:1, 2x 18:1 et 3x 60:1. Sera modifié.',
      dealer: ['7', '?'],
      player: ['8', '8'],
      action: 'split',
      actionLabel: '60:1',
      hint: 'C’est le nombre réel de splits dans la manche qui compte, pas seulement la possibilité de split.',
    },
    {
      eyebrow: 'Résolution',
      title: 'Après la manche, tout se résout étape par étape',
      copy: 'La manche de cartes se termine d’abord. Ensuite le panneau Betception résout la mise principale et les side bets un par un pendant que le gain monte.',
      dealer: ['Q', '7'],
      player: ['10', '9'],
      action: 'stand',
      actionLabel: 'WIN',
      hint: 'Plus il y a de prédictions correctes en même temps, plus le gain final paraît fort.',
    },
  ],
};

const TUTORIAL_CONTENT: Record<LanguageCode, Record<TutorialCategory, TutorialStep[]>> = {
  de: { blackjack: TUTORIAL_STEPS.de, betception: BETCEPTION_STEPS.de },
  en: { blackjack: TUTORIAL_STEPS.en, betception: BETCEPTION_STEPS.en },
  es: { blackjack: TUTORIAL_STEPS.es, betception: BETCEPTION_STEPS.es },
  fr: { blackjack: TUTORIAL_STEPS.fr, betception: BETCEPTION_STEPS.fr },
};

@Component({
  selector: 'app-how-to-play-modal',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './how-to-play-modal.html',
  styleUrls: ['./how-to-play-modal.css'],
})
export class HowToPlayModalComponent implements AfterViewInit {
  readonly i18n = inject(I18n);
  readonly categories: TutorialCategory[] = ['blackjack', 'betception'];

  @Output() closed = new EventEmitter<void>();
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  activeCategory: TutorialCategory = 'blackjack';
  activeIndex = 0;

  ngAfterViewInit() {
    this.closeButton?.nativeElement.focus();
  }

  get steps() {
    return TUTORIAL_CONTENT[this.i18n.language()][this.activeCategory];
  }

  get activeStep() {
    return this.steps[this.activeIndex];
  }

  get activeCategoryCopy() {
    return this.categoryCopy(this.activeCategory);
  }

  get progress() {
    return ((this.activeIndex + 1) / this.steps.length) * 100;
  }

  next() {
    if (this.activeIndex < this.steps.length - 1) {
      this.activeIndex += 1;
      return;
    }
    this.closed.emit();
  }

  previous() {
    if (this.activeIndex > 0) {
      this.activeIndex -= 1;
    }
  }

  categoryCopy(category: TutorialCategory) {
    return TUTORIAL_CATEGORIES[this.i18n.language()][category];
  }

  selectCategory(category: TutorialCategory) {
    if (this.activeCategory === category) return;
    this.activeCategory = category;
    this.activeIndex = 0;
  }

  selectStep(index: number) {
    this.activeIndex = index;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('tutorial-overlay')) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    event.preventDefault();
    this.closed.emit();
  }
}
