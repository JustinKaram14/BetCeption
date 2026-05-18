import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthFacade } from '../../services/auth-facade';

type PageState = 'form' | 'loading' | 'success' | 'expired' | 'error';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authFacade = inject(AuthFacade);

  readonly state = signal<PageState>('form');
  private token = '';

  newPassword = '';
  confirmPassword = '';
  errorMessage = '';

  ngOnInit(): void {
    const fragment = this.route.snapshot.fragment ?? '';
    const token = new URLSearchParams(fragment).get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    this.token = token;
  }

  get canSubmit(): boolean {
    return this.newPassword.length >= 8 && this.confirmPassword.length >= 8;
  }

  submit(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
      return;
    }

    this.errorMessage = '';
    this.state.set('loading');

    this.authFacade.resetPassword({ token: this.token, newPassword: this.newPassword }).subscribe({
      next: () => this.state.set('success'),
      error: (err) => {
        const code = err?.error?.code;
        if (code === 'TOKEN_EXPIRED') {
          this.state.set('expired');
        } else {
          this.state.set('error');
        }
      },
    });
  }
}
