import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { VerifyEmail } from './verify-email';
import { AuthFacade } from '../../services/auth-facade';

describe('VerifyEmail', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;
  let authFacadeMock: jasmine.SpyObj<AuthFacade>;
  let token: string | null;

  beforeEach(async () => {
    token = null;
    authFacadeMock = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['verifyEmail']);
    authFacadeMock.verifyEmail.and.returnValue(of({ message: 'Email verified' } as any));

    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => token } } },
        },
        { provide: AuthFacade, useValue: authFacadeMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets error state when the token is missing', () => {
    expect(component.state()).toBe('error');
    expect(authFacadeMock.verifyEmail).not.toHaveBeenCalled();
  });

  it('sets success state when email verification succeeds', () => {
    token = 'verify-token';
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(authFacadeMock.verifyEmail).toHaveBeenCalledWith('verify-token');
    expect(component.state()).toBe('success');
  });

  it('sets already-verified state for already verified responses', () => {
    token = 'verify-token';
    authFacadeMock.verifyEmail.and.returnValue(of({ message: 'Email already verified' } as any));
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.state()).toBe('already_verified');
  });

  it('maps expired token errors and generic failures to distinct states', () => {
    token = 'verify-token';
    authFacadeMock.verifyEmail.and.returnValue(
      throwError(() => ({ error: { code: 'TOKEN_EXPIRED' } })),
    );
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.state()).toBe('expired');

    authFacadeMock.verifyEmail.and.returnValue(throwError(() => ({ error: { code: 'OTHER' } })));
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.state()).toBe('error');
  });
});
