import { Component, EventEmitter, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

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

@Component({
  selector: 'app-how-to-play-modal',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './how-to-play-modal.html',
  styleUrls: ['./how-to-play-modal.css'],
})
export class HowToPlayModalComponent {
  @Output() closed = new EventEmitter<void>();

  readonly steps: TutorialStep[] = [
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
      eyebrow: 'Hit',
      title: 'Bei niedrigen Händen ziehst du nach',
      copy: 'Mit Hit nimmst du eine weitere Karte. Das ist sinnvoll, wenn deine Summe niedrig ist und du noch kaum Bust-Gefahr hast.',
      dealer: ['10', '?'],
      player: ['6', '5'],
      action: 'hit',
      actionLabel: 'HIT',
      hint: 'Du hast 11. Hier ist Hit logisch, weil dich keine einzelne Karte über 21 bringen kann.',
    },
    {
      eyebrow: 'Stand',
      title: 'Bei starken Händen bleibst du stehen',
      copy: 'Mit Stand behältst du deine aktuelle Summe. Danach ist der Dealer dran. Je höher deine Summe, desto gefährlicher wird ein weiterer Hit.',
      dealer: ['8', '?'],
      player: ['10', '8'],
      action: 'stand',
      actionLabel: 'STAND',
      hint: 'Du hast 18. Ein Hit kann helfen, aber viele Karten würden dich über 21 bringen. Stand ist hier meistens die saubere Basic-Entscheidung.',
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
      actionLabel: 'HIT',
      hint: 'Mit 12 bist du schwach. Gegen eine offene 6 kann man auch vorsichtig stehen, aber als Basic-Tutorial gilt: niedrige Hände müssen verbessert werden.',
    },
  ];

  activeIndex = 0;

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
}
