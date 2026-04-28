import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Controls } from './controls';
import { HandStatus, RoundStatus } from '../../../../../core/api/api.types';

describe('Controls', () => {
  let component: Controls;
  let fixture: ComponentFixture<Controls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Controls],
    }).compileComponents();

    fixture = TestBed.createComponent(Controls);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isRoundActive', () => {
    it('is true for IN_PROGRESS, DEALING, and CREATED statuses', () => {
      for (const status of [RoundStatus.IN_PROGRESS, RoundStatus.DEALING, RoundStatus.CREATED]) {
        component.roundStatus = status;
        expect(component.isRoundActive).withContext(`status=${status}`).toBeTrue();
      }
    });

    it('is false for SETTLED, ABORTED, and null', () => {
      for (const status of [RoundStatus.SETTLED, RoundStatus.ABORTED, null]) {
        component.roundStatus = status;
        expect(component.isRoundActive).withContext(`status=${String(status)}`).toBeFalse();
      }
    });
  });

  describe('canDeal', () => {
    it('is true when round is inactive, betAmount > 0, and not busy', () => {
      component.roundStatus = null;
      component.betAmount = 25;
      component.busy = false;
      expect(component.canDeal).toBeTrue();
    });

    it('is false when betAmount is 0', () => {
      component.roundStatus = null;
      component.betAmount = 0;
      expect(component.canDeal).toBeFalse();
    });

    it('is false when the round is active', () => {
      component.roundStatus = RoundStatus.IN_PROGRESS;
      component.betAmount = 25;
      expect(component.canDeal).toBeFalse();
    });

    it('is false when busy', () => {
      component.roundStatus = null;
      component.betAmount = 25;
      component.busy = true;
      expect(component.canDeal).toBeFalse();
    });
  });

  describe('canHit / canStand', () => {
    it('canHit is true when round is IN_PROGRESS and player hand is ACTIVE and not busy', () => {
      component.roundStatus = RoundStatus.IN_PROGRESS;
      component.playerHandStatus = HandStatus.ACTIVE;
      component.busy = false;
      expect(component.canHit).toBeTrue();
    });

    it('canHit is false when busy', () => {
      component.roundStatus = RoundStatus.IN_PROGRESS;
      component.playerHandStatus = HandStatus.ACTIVE;
      component.busy = true;
      expect(component.canHit).toBeFalse();
    });

    it('canStand mirrors the same conditions as canHit', () => {
      component.roundStatus = RoundStatus.IN_PROGRESS;
      component.playerHandStatus = HandStatus.ACTIVE;
      component.busy = false;
      expect(component.canStand).toBeTrue();

      component.busy = true;
      expect(component.canStand).toBeFalse();
    });
  });

  describe('canSettle', () => {
    it('is true when round is open and player hand is finished (STOOD)', () => {
      component.roundStatus = RoundStatus.IN_PROGRESS;
      component.playerHandStatus = HandStatus.STOOD;
      component.busy = false;
      expect(component.canSettle).toBeTrue();
    });

    it('is false when round is SETTLED', () => {
      component.roundStatus = RoundStatus.SETTLED;
      component.playerHandStatus = HandStatus.STOOD;
      expect(component.canSettle).toBeFalse();
    });

    it('is false when round is ABORTED', () => {
      component.roundStatus = RoundStatus.ABORTED;
      component.playerHandStatus = HandStatus.STOOD;
      expect(component.canSettle).toBeFalse();
    });

    it('is false when player hand is still ACTIVE', () => {
      component.roundStatus = RoundStatus.IN_PROGRESS;
      component.playerHandStatus = HandStatus.ACTIVE;
      expect(component.canSettle).toBeFalse();
    });
  });

  describe('roundLabel', () => {
    it('returns the correct label for each round status', () => {
      const cases = [
        [RoundStatus.IN_PROGRESS, 'round.inProgress'],
        [RoundStatus.DEALING, 'round.dealing'],
        [RoundStatus.CREATED, 'round.created'],
        [RoundStatus.SETTLED, 'round.settled'],
        [RoundStatus.ABORTED, 'round.aborted'],
        [null, 'round.ready'],
      ] as const;
      for (const [status, labelKey] of cases) {
        component.roundStatus = status;
        expect(component.roundLabel).withContext(`status=${String(status)}`).toBe(component.i18n.t(labelKey));
      }
    });
  });

  describe('onChip', () => {
    it('emits placeBet with the chip amount when the round is not active', () => {
      component.roundStatus = null;
      component.busy = false;
      const spy = spyOn(component.placeBet, 'emit');

      component.onChip(25);

      expect(spy).toHaveBeenCalledOnceWith(25);
    });

    it('does not emit placeBet when the round is active', () => {
      component.roundStatus = RoundStatus.IN_PROGRESS;
      const spy = spyOn(component.placeBet, 'emit');

      component.onChip(25);

      expect(spy).not.toHaveBeenCalled();
    });

    it('does not emit placeBet when busy', () => {
      component.roundStatus = null;
      component.busy = true;
      const spy = spyOn(component.placeBet, 'emit');

      component.onChip(25);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
