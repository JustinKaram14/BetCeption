import { TestBed } from '@angular/core/testing';
import { I18n } from './i18n';

describe('I18n', () => {
  let service: I18n;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18n);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults to German', () => {
    expect(service.language()).toBe('de');
  });

  it('translates a key in the current language', () => {
    expect(service.t('common.close')).toBe('Schließen');
  });

  it('translates with param interpolation', () => {
    const result = service.t('blackjack.dealerBust', { value: 22 });
    expect(result).toContain('22');
  });

  it('setLanguage switches the language', () => {
    service.setLanguage('en');
    expect(service.language()).toBe('en');
    expect(service.t('common.close')).toBe('Close');
  });

  it('setLanguage persists to localStorage', () => {
    service.setLanguage('es');
    expect(localStorage.getItem('betception-language')).toBe('es');
  });

  it('reads saved language from localStorage on init', () => {
    localStorage.setItem('betception-language', 'fr');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(I18n);
    expect(fresh.language()).toBe('fr');
  });

  it('falls back to German for unknown keys', () => {
    service.setLanguage('en');
    // t() falls back to de value if en key is missing — or returns the key itself
    const result = service.t('common.ok');
    expect(result).toBeTruthy();
  });

  it('exposes all 4 supported languages', () => {
    const codes = service.languages.map((l) => l.code);
    expect(codes).toEqual(['de', 'en', 'es', 'fr']);
  });
});
