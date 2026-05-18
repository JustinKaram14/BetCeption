import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { VerifyEmail } from './verify-email';
import { AuthFacade } from '../../services/auth-facade';

describe('VerifyEmail', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;

  beforeEach(async () => {
    const authFacadeMock = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['verifyEmail']);

    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
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
});
