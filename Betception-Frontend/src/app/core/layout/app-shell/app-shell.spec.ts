import { TestBed } from '@angular/core/testing';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppShell);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
