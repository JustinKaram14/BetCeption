import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

export type DailyRewardState =
  | { kind: 'loading' }
  | { kind: 'success'; claimedAmount: number; balance: number; eligibleAt: string }
  | { kind: 'already-claimed'; eligibleAt: string }
  | { kind: 'not-logged-in' }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-daily-reward-modal',
  standalone: true,
  imports: [NgIf],
  templateUrl: './daily-reward-modal.html',
  styleUrls: ['./daily-reward-modal.css'],
})
export class DailyRewardModalComponent {
  @Input() state: DailyRewardState = { kind: 'loading' };
  @Output() closed = new EventEmitter<void>();

  get countdownText(): string {
    if (this.state.kind !== 'success' && this.state.kind !== 'already-claimed') {
      return '';
    }
    const eligible = new Date(this.state.eligibleAt);
    const now = new Date();
    const diff = eligible.getTime() - now.getTime();
    if (diff <= 0) return 'Jetzt verfügbar!';
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    return `${hours}h ${minutes}m`;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }
}
