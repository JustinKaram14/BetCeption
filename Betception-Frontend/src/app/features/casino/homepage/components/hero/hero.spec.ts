import { TestBed } from '@angular/core/testing';
import { HeroComponent } from './hero';

describe('HeroComponent', () => {
  afterEach(() => {
    localStorage.removeItem('betception-language');
  });

  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the localized homepage subtitle', async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroComponent);
    fixture.componentInstance.i18n.setLanguage('en');
    fixture.detectChanges();

    const subtitle: HTMLElement = fixture.nativeElement.querySelector('.subtitle');
    expect(subtitle.textContent?.trim()).toBe('Where reality is just another variable.');
  });
});
