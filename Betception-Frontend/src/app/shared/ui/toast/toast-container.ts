import { AsyncPipe, NgClass, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastMessage, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [AsyncPipe, NgClass, NgFor],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  readonly messages$ = this.toastService.messages$;

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }

  labelFor(toast: ToastMessage) {
    if (toast.type === 'error') {
      return 'Fehler';
    }
    if (toast.type === 'success') {
      return 'Erfolg';
    }
    return 'Info';
  }

  trackToast(_index: number, toast: ToastMessage) {
    return toast.id;
  }
}
