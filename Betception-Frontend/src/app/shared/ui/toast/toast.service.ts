import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'error' | 'success' | 'info' | 'achievement' | 'crate';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  durationMs: number;
  label?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly maxToasts = 3;
  private readonly timers = new Map<string, number>();
  private readonly messagesSubject = new BehaviorSubject<ToastMessage[]>([]);

  readonly messages$ = this.messagesSubject.asObservable();

  error(message: string, durationMs = 5200, label?: string) {
    this.show('error', message, durationMs, label);
  }

  success(message: string, durationMs = 4200, label?: string) {
    this.show('success', message, durationMs, label);
  }

  info(message: string, durationMs = 4200, label?: string) {
    this.show('info', message, durationMs, label);
  }

  achievement(message: string, durationMs = 5600, label?: string) {
    this.show('achievement', message, durationMs, label);
  }

  crate(message: string, durationMs = 5200, label?: string) {
    this.show('crate', message, durationMs, label);
  }

  dismiss(id: string) {
    this.clearTimer(id);
    this.messagesSubject.next(this.messagesSubject.value.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string, durationMs: number, label?: string) {
    const toast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      message,
      durationMs,
      label,
    };

    const next = [...this.messagesSubject.value, toast];
    const overflow = Math.max(0, next.length - this.maxToasts);
    next.slice(0, overflow).forEach((oldToast) => this.clearTimer(oldToast.id));
    this.messagesSubject.next(next.slice(overflow));

    const timer = window.setTimeout(() => this.dismiss(toast.id), durationMs);
    this.timers.set(toast.id, timer);
  }

  private clearTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
