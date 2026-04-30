import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DatenschutzComponent } from './datenschutz';

describe('DatenschutzComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatenschutzComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DatenschutzComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('returns content for the current language', () => {
    const fixture = TestBed.createComponent(DatenschutzComponent);
    const content = fixture.componentInstance.content;
    expect(content).toBeTruthy();
    expect(content.title).toBeTruthy();
    expect(content.sections.length).toBeGreaterThan(0);
  });
});
