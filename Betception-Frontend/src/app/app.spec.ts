import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { App } from './app';
import { Auth } from './core/auth/auth';

describe('App', () => {
  let authMock: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<Auth>('Auth', ['refresh'], {
      user$: of(null),
      token$: of(null),
      isAuthenticated$: of(false),
    });
    authMock.refresh.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the router outlet host element', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
