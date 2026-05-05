import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import {
  ActivePowerup,
  InventoryPowerup,
  PowerPillCode,
  PowerupType,
} from '../../../../../core/api/api.types';
import { I18n } from '../../../../../core/i18n/i18n';

const PILL_CODES: PowerPillCode[] = ['RED_PILL', 'BLUE_PILL'];

const PILL_COPY: Record<
  PowerPillCode,
  { color: string; accentClass: string }
> = {
  RED_PILL: {
    color: '#ff3b45',
    accentClass: 'pill-card--red',
  },
  BLUE_PILL: {
    color: '#12e5ee',
    accentClass: 'pill-card--blue',
  },
};

@Component({
  selector: 'app-powerup-menu',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe],
  templateUrl: './powerup-menu.html',
  styleUrl: './powerup-menu.css',
})
export class PowerupMenu {
  readonly i18n = inject(I18n);

  @Input() inventory: InventoryPowerup[] = [];
  @Input() availablePowerups: PowerupType[] = [];
  @Input() activePowerup: ActivePowerup | null = null;
  @Input() balance: number | null = null;
  @Input() userLevel = 1;

  @Output() purchase = new EventEmitter<{ typeId: number; quantity: number }>();
  @Output() equip = new EventEmitter<{ typeId: number }>();
  @Output() close = new EventEmitter<void>();

  readonly pillCodes = PILL_CODES;

  getCopy(code: PowerPillCode) {
    return PILL_COPY[code];
  }

  getPillTitle(code: PowerPillCode): string {
    return this.i18n.t(code === 'RED_PILL' ? 'powerup.redPill' : 'powerup.bluePill');
  }

  getPillDescription(code: PowerPillCode): string {
    return this.i18n.t(code === 'RED_PILL' ? 'powerup.redPillDescription' : 'powerup.bluePillDescription');
  }

  getPowerup(code: PowerPillCode): PowerupType | null {
    return this.availablePowerups.find((powerup) => powerup.code === code)
      ?? this.inventory.find((item) => item.type?.code === code)?.type
      ?? null;
  }

  getPrice(code: PowerPillCode): number {
    return this.getPowerup(code)?.price ?? 300;
  }

  getOwnedQuantity(code: PowerPillCode): number {
    return this.inventory.find((item) => item.type?.code === code)?.quantity ?? 0;
  }

  isLocked(code: PowerPillCode): boolean {
    const powerup = this.getPowerup(code);
    return !!powerup && powerup.minLevel > this.userLevel;
  }

  canAfford(code: PowerPillCode): boolean {
    if (this.balance === null) return true;
    return this.balance >= this.getPrice(code);
  }

  getButtonLabel(code: PowerPillCode): string {
    if (!this.getPowerup(code)) return this.i18n.t('powerup.unavailable');
    if (this.activePowerup) return this.i18n.t('powerup.slotOccupied');
    const quantity = this.getOwnedQuantity(code);
    if (quantity > 0) return `${this.i18n.t('powerup.activate')} (x${quantity})`;
    return `${this.i18n.t('powerup.buy')} ($${this.getPrice(code).toFixed(0)})`;
  }

  canUse(code: PowerPillCode): boolean {
    const powerup = this.getPowerup(code);
    if (!powerup || this.activePowerup || this.isLocked(code)) return false;
    return this.getOwnedQuantity(code) > 0 || this.canAfford(code);
  }

  onUse(code: PowerPillCode) {
    if (!this.canUse(code)) return;
    const powerup = this.getPowerup(code);
    if (!powerup) return;
    if (this.getOwnedQuantity(code) > 0) {
      this.equip.emit({ typeId: powerup.id });
      return;
    }
    this.purchase.emit({ typeId: powerup.id, quantity: 1 });
  }
}
