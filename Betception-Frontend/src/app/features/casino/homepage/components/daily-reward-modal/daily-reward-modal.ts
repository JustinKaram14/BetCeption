import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { I18n } from '../../../../../core/i18n/i18n';

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
export class DailyRewardModalComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  readonly i18n = inject(I18n);

  @Input() state: DailyRewardState = { kind: 'loading' };
  @Output() closed = new EventEmitter<void>();
  @ViewChild('closeAction') private closeAction?: ElementRef<HTMLButtonElement>;

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private hasFocusedCloseAction = false;
  now = Date.now();

  ngOnInit() {
    this.tickInterval = setInterval(() => { this.now = Date.now(); }, 30_000);
  }

  ngOnDestroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['state']) {
      this.hasFocusedCloseAction = false;
    }
  }

  ngAfterViewChecked() {
    if (this.hasFocusedCloseAction || !this.closeAction) {
      return;
    }

    this.closeAction.nativeElement.focus();
    this.hasFocusedCloseAction = true;
  }

  get countdownText(): string {
    if (this.state.kind !== 'success' && this.state.kind !== 'already-claimed') {
      return '';
    }
    const eligible = new Date(this.state.eligibleAt);
    const diff = eligible.getTime() - this.now;
    if (diff <= 0) return this.i18n.t('daily.availableNow');
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    return `${hours}h ${minutes}m`;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    event.preventDefault();
    this.closed.emit();
  }
}
