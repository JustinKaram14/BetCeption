import { TestBed } from '@angular/core/testing';
import { HeroComponent } from './hero';

describe('HeroComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
