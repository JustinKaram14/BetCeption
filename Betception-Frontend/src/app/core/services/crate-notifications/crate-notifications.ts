import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { UserCrateItem } from '../../api/api.types';

const STORAGE_PREFIX = 'betception-crates-seen';

@Injectable({ providedIn: 'root' })
export class CrateNotifications {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  unseenUnopenedCount(userId: string | null | undefined, crates: UserCrateItem[]): number {
    if (!userId) {
      return 0;
    }
    const seen = this.readSeenIds(userId);
    return crates.filter((crate) => this.isNotificationRelevant(crate, seen)).length;
  }

  isUnseenUnopened(userId: string | null | undefined, crate: UserCrateItem): boolean {
    if (!userId) {
      return false;
    }
    return this.isNotificationRelevant(crate, this.readSeenIds(userId));
  }

  markUnopenedAsSeen(userId: string | null | undefined, crates: UserCrateItem[]): number {
    if (!userId) {
      return 0;
    }
    const seen = this.readSeenIds(userId);
    let changed = false;

    for (const crate of crates) {
      if (!crate.opened && !seen.has(crate.id)) {
        seen.add(crate.id);
        changed = true;
      }
    }

    if (changed) {
      this.writeSeenIds(userId, seen);
    }

    return this.unseenUnopenedCount(userId, crates);
  }

  markCrateAsSeen(userId: string | null | undefined, crate: UserCrateItem): void {
    if (!userId || crate.opened) {
      return;
    }
    const seen = this.readSeenIds(userId);
    if (!seen.has(crate.id)) {
      seen.add(crate.id);
      this.writeSeenIds(userId, seen);
    }
  }

  private isNotificationRelevant(crate: UserCrateItem, seen: Set<string>): boolean {
    return !crate.opened && !seen.has(crate.id);
  }

  private readSeenIds(userId: string): Set<string> {
    if (!this.isBrowser) {
      return new Set<string>();
    }

    const raw = window.localStorage.getItem(this.storageKey(userId));
    if (!raw) {
      return new Set<string>();
    }

    try {
      const value = JSON.parse(raw);
      return Array.isArray(value)
        ? new Set(value.filter((id): id is string => typeof id === 'string'))
        : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }

  private writeSeenIds(userId: string, seen: Set<string>): void {
    if (!this.isBrowser) {
      return;
    }
    window.localStorage.setItem(this.storageKey(userId), JSON.stringify([...seen]));
  }

  private storageKey(userId: string): string {
    return `${STORAGE_PREFIX}:${userId}`;
  }
}
