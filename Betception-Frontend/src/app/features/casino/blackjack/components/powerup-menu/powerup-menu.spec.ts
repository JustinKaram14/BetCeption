import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerupMenu } from './powerup-menu';
import type { PowerupType } from '../../../../../core/api/api.types';

describe('PowerupMenu', () => {
  let fixture: ComponentFixture<PowerupMenu>;
  let component: PowerupMenu;

  const redPill: PowerupType = {
    id: 1,
    code: 'RED_PILL',
    title: 'Red Pill',
    description: '1:5 chance to trigger x3 payout on main wins.',
    minLevel: 1,
    price: 300,
    effect: { color: 'red', uses: 3 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerupMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(PowerupMenu);
    component = fixture.componentInstance;
    component.availablePowerups = [redPill];
  });

  it('keeps the base pill price for early accounts', () => {
    component.balance = 500;
    component.userLevel = 1;

    expect(component.getPrice('RED_PILL')).toBe(300);
  });

  it('scales and rounds the pill price for large bankrolls', () => {
    component.balance = 20000;
    component.userLevel = 5;
    fixture.detectChanges();

    expect(component.getPrice('RED_PILL')).toBe(1000);
    const redButton = fixture.nativeElement.querySelector('.pill-card--red .btn-pill') as HTMLButtonElement;
    expect(redButton.textContent?.trim()).toContain('$1000');
  });
});
