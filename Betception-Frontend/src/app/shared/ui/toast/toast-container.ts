import { AsyncPipe, NgClass, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastMessage, ToastService } from './toast.service';
import { I18n } from '../../../core/i18n/i18n';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [AsyncPipe, NgClass, NgFor],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  private readonly i18n = inject(I18n);

  readonly messages$ = this.toastService.messages$;

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }

  labelFor(toast: ToastMessage) {
    if (toast.type === 'error') {
      return this.i18n.t('toast.error');
    }
    if (toast.type === 'success') {
      return this.i18n.t('toast.success');
    }
    return this.i18n.t('toast.info');
  }

  trackToast(_index: number, toast: ToastMessage) {
    return toast.id;
  }
}
