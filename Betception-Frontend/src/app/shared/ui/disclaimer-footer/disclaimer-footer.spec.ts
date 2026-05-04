import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DisclaimerFooterComponent } from './disclaimer-footer';

describe('DisclaimerFooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisclaimerFooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DisclaimerFooterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes the current year', () => {
    const fixture = TestBed.createComponent(DisclaimerFooterComponent);
    const year = fixture.componentInstance.year;
    expect(year).toBe(new Date().getFullYear());
  });
});
