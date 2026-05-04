import { TestBed } from '@angular/core/testing';
import { NeonCardComponent } from './neon-card';

describe('NeonCardComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [NeonCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(NeonCardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
