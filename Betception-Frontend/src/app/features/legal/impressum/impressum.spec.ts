import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ImpressumComponent } from './impressum';

describe('ImpressumComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpressumComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ImpressumComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('returns content for the current language', () => {
    const fixture = TestBed.createComponent(ImpressumComponent);
    const content = fixture.componentInstance.content;
    expect(content).toBeTruthy();
    expect(content.title).toBeTruthy();
    expect(content.sections.length).toBeGreaterThan(0);
  });
});
