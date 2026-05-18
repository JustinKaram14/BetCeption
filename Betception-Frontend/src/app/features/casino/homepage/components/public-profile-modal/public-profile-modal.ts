import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetceptionApi } from '../../../../../core/api/betception-api.service';
import { I18n } from '../../../../../core/i18n/i18n';
import { ProfileAvatarColor, ProfileAvatarIcon, UserProfile } from '../../../../../core/api/api.types';
import { LevelProgressComponent } from '../../../../../shared/ui/level-progress/level-progress';

type AvatarIconOption = {
  id: ProfileAvatarIcon;
  path: string;
};

type AvatarColorOption = {
  id: ProfileAvatarColor;
  value: string;
};

const AVATAR_ICONS: AvatarIconOption[] = [
  { id: 'chip', path: 'M32 7a25 25 0 1 0 0 50 25 25 0 0 0 0-50Zm0 9a16 16 0 1 1 0 32 16 16 0 0 1 0-32Zm0 7a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z' },
  { id: 'spade', path: 'M32 7C21 18 13 25 13 35c0 7 5 12 12 12 3 0 6-1 8-4-1 5-4 8-9 11h16c-5-3-8-6-9-11 2 3 5 4 8 4 7 0 12-5 12-12 0-10-8-17-19-28Z' },
  { id: 'crown', path: 'M12 22l11 8 9-15 9 15 11-8-4 27H16L12 22Zm10 21h20l1-9-7 5-4-8-4 8-7-5 1 9Z' },
  { id: 'bolt', path: 'M36 5 15 36h14l-2 23 22-34H35l1-20Z' },
  { id: 'diamond', path: 'M32 6 54 28 32 58 10 28 32 6Zm0 11-11 11 11 16 11-16-11-11Z' },
  { id: 'orbit', path: 'M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm0 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM8 39c3 8 18 10 33 5 14-5 23-15 20-23-1-3-4-5-8-6 2 6-5 15-17 19-12 4-24 3-28-3-1 3-1 6 0 8Z' },
  { id: 'cards', path: 'M18 13h25c3 0 5 2 5 5v29c0 3-2 5-5 5H18c-3 0-5-2-5-5V18c0-3 2-5 5-5Zm5 8v7h7v-7h-7Zm11 15v7h7v-7h-7Zm-3-10 12 12 5-5-12-12-5 5Z' },
  { id: 'flame', path: 'M35 5c5 12-7 15 2 25 2-6 7-9 12-11-1 9 6 14 6 23 0 10-9 17-22 17S10 52 10 41c0-12 12-18 13-32 5 4 8 9 12 16 4-6 1-12 0-20Z' },
  { id: 'star', path: 'm32 6 7 16 17 2-13 12 4 17-15-9-15 9 4-17L8 24l17-2 7-16Z' },
];

const AVATAR_COLORS: AvatarColorOption[] = [
  { id: 'cyan', value: '#00f6ff' },
  { id: 'blue', value: '#208bff' },
  { id: 'violet', value: '#8f5cff' },
  { id: 'magenta', value: '#ff00f5' },
  { id: 'red', value: '#ff4050' },
  { id: 'gold', value: '#ffd21f' },
  { id: 'green', value: '#43ff95' },
  { id: 'ice', value: '#a7f8ff' },
  { id: 'white', value: '#ffffff' },
];

@Component({
  selector: 'app-public-profile-modal',
  standalone: true,
  imports: [NgIf, LevelProgressComponent],
  templateUrl: './public-profile-modal.html',
  styleUrl: './public-profile-modal.css',
})
export class PublicProfileModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) userId!: string;
  @Output() closed = new EventEmitter<void>();

  private readonly api = inject(BetceptionApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18n);

  loading = false;
  error: string | null = null;
  profile: UserProfile | null = null;

  private previousBodyOverflow: string | null = null;
  private activeRequestUserId: string | null = null;

  ngOnInit(): void {
    this.lockBackgroundScroll();
    this.loadProfile();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].firstChange) {
      this.loadProfile();
    }
  }

  ngOnDestroy(): void {
    this.unlockBackgroundScroll();
  }

  close(): void {
    this.closed.emit();
  }

  stopModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  loadProfile(): void {
    if (!this.userId || this.loading && this.activeRequestUserId === this.userId) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.profile = null;
    this.activeRequestUserId = this.userId;
    const requestedUserId = this.userId;

    this.api
      .getUserById(requestedUserId)
      .pipe(
        finalize(() => {
          if (this.activeRequestUserId === requestedUserId) {
            this.loading = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ user }) => {
          if (this.activeRequestUserId !== requestedUserId) {
            return;
          }
          this.profile = user;
        },
        error: (error) => {
          if (this.activeRequestUserId !== requestedUserId) {
            return;
          }
          this.error = this.extractErrorMessage(error);
        },
      });
  }

  formatCoins(value: number | null | undefined): string {
    const numeric = Number(value ?? 0);
    const hasDecimals = Math.abs(numeric % 1) > 0;
    return `${numeric.toLocaleString(this.currentLocale(), {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })} ${this.i18n.t('common.coins')}`;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(this.currentLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  avatarIconPath(icon: ProfileAvatarIcon | null | undefined): string {
    return AVATAR_ICONS.find((option) => option.id === icon)?.path ?? AVATAR_ICONS[0].path;
  }

  avatarColorValue(color: ProfileAvatarColor | null | undefined): string {
    return AVATAR_COLORS.find((option) => option.id === color)?.value ?? AVATAR_COLORS[0].value;
  }

  private currentLocale(): string {
    switch (this.i18n.language()) {
      case 'en':
        return 'en-US';
      case 'es':
        return 'es-ES';
      case 'fr':
        return 'fr-FR';
      default:
        return 'de-DE';
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const payload = (error as any).error;
      if (typeof payload === 'string') {
        return payload;
      }
      if (payload && typeof payload === 'object' && 'message' in payload) {
        return String(payload.message);
      }
      if ('message' in (error as any)) {
        return String((error as any).message);
      }
    }
    return this.i18n.t('publicProfile.loadError');
  }

  private lockBackgroundScroll(): void {
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private unlockBackgroundScroll(): void {
    document.body.style.overflow = this.previousBodyOverflow ?? '';
  }
}
