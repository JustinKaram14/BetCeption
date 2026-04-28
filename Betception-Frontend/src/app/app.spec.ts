import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { App } from './app';
import { Auth } from './core/auth/auth';

describe('App', () => {
  const authMock = jasmine.createSpyObj<Auth>('Auth', ['refresh'], {
    user$: of(null),
    token$: of(null),
    isAuthenticated$: of(false),
  });

  beforeEach(async () => {
    authMock.refresh.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authMock },
      ],
    }).compileComponents();

    authMock.refresh.calls.reset();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls auth.refresh() on init to silently restore the session from the cookie', () => {
    authMock.refresh.and.returnValue(of(null));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(authMock.refresh).toHaveBeenCalledOnceWith();
  });
});
