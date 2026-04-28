import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { I18n, LanguageCode } from '../../../../../core/i18n/i18n';

type TutorialStep = {
  title: string;
  eyebrow: string;
  copy: string;
  dealer: string[];
  player: string[];
  action?: 'hit' | 'stand' | 'dealer' | 'blackjack';
  actionLabel?: string;
  hint: string;
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

@Component({
  selector: 'app-how-to-play-modal',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './how-to-play-modal.html',
  styleUrls: ['./how-to-play-modal.css'],
})
export class HowToPlayModalComponent implements AfterViewInit {
  readonly i18n = inject(I18n);

  @Output() closed = new EventEmitter<void>();
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  activeIndex = 0;

  ngAfterViewInit() {
    this.closeButton?.nativeElement.focus();
  }

  get steps() {
    return TUTORIAL_STEPS[this.i18n.language()];
  }

  get activeStep() {
    return this.steps[this.activeIndex];
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
