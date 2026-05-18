import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../../services/auth-facade';

type VerifyState = 'loading' | 'success' | 'already_verified' | 'expired' | 'error';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authFacade = inject(AuthFacade);

  readonly state = signal<VerifyState>('loading');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    this.authFacade.verifyEmail(token).subscribe({
      next: (res) => {
        if (res.message === 'Email already verified') {
          this.state.set('already_verified');
        } else {
          this.state.set('success');
        }
      },
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
