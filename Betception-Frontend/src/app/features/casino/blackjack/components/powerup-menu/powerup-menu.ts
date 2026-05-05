import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { InventoryPowerup, PowerupType } from '../../../../../core/api/api.types';
import { I18n } from '../../../../../core/i18n/i18n';

const POWERUP_ICONS: Record<string, string> = {
  MULTI_PLUS: '💊',
  JOKER_CARD: '🃏',
  NO_LOSS: '🛡️',
  BET_BOOST_30: '💰',
  BET_BOOST_100: '🚀',
  PEEK_CARD: '👁️',
  CARD_SWAP: '🔄',
  UNDO_HIT: '↩️',
  XP_BOOST: '⚡',
  DAILY_BOOST: '🌟',
  COIN_RUSH: '💎',
  INSURANCE_FREE: '🔒',
  SIDEBET_MEGA: '🎯',
};

const POWERUP_COLORS: Record<string, string> = {
  MULTI_PLUS: '#ffd700',
  JOKER_CARD: '#a855f7',
  NO_LOSS: '#4ade80',
  BET_BOOST_30: '#ff9800',
  BET_BOOST_100: '#ff4500',
  PEEK_CARD: '#00bcd4',
  CARD_SWAP: '#ff69b4',
  UNDO_HIT: '#ff6b6b',
  XP_BOOST: '#b0ff00',
  DAILY_BOOST: '#ffec3d',
  COIN_RUSH: '#00e5ff',
  INSURANCE_FREE: '#1de9b6',
  SIDEBET_MEGA: '#e040fb',
};

const ACTION_POWERUP_CODES = new Set(['PEEK_CARD', 'CARD_SWAP', 'UNDO_HIT']);

@Component({
  selector: 'app-powerup-menu',
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe],
  templateUrl: './powerup-menu.html',
  styleUrl: './powerup-menu.css',
})
export class PowerupMenu {
  readonly i18n = inject(I18n);

  @Input() inventory: InventoryPowerup[] = [];

  get ownedInventory(): InventoryPowerup[] {
    return this.inventory.filter(item => item.quantity > 0);
  }
  @Input() availablePowerups: PowerupType[] = [];
  @Input() roundId: string | null = null;
  @Input() roundActive = false;
  @Input() balance: number | null = null;
  @Input() userLevel = 1;
  @Input() pendingTypeIds: number[] = [];

  @Output() purchase = new EventEmitter<{ typeId: number; quantity: number }>();
  @Output() toggleQueue = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();

  selectedQuantities: Record<number, number> = {};

  getIcon(code: string): string {
    return POWERUP_ICONS[code] ?? '✨';
  }

  getColor(code: string): string {
    return POWERUP_COLORS[code] ?? '#00e5ff';
  }

  getQuantity(typeId: number): number {
    return this.selectedQuantities[typeId] ?? 1;
  }

  setQuantity(typeId: number, qty: number) {
    this.selectedQuantities = { ...this.selectedQuantities, [typeId]: qty };
  }

  isActionPowerup(item: InventoryPowerup): boolean {
    return ACTION_POWERUP_CODES.has(this.getInventoryCode(item));
  }

  canQueue(item: InventoryPowerup): boolean {
    return !this.roundActive && !this.isActionPowerup(item) && item.quantity > 0;
  }

  onPurchase(powerup: PowerupType) {
    const qty = this.getQuantity(powerup.id);
    this.purchase.emit({ typeId: powerup.id, quantity: qty });
  }

  canAfford(price: number, qty: number): boolean {
    if (this.balance === null) return true;
    return this.balance >= price * qty;
  }

  isLocked(powerup: PowerupType): boolean {
    return powerup.minLevel > this.userLevel;
  }

  isQueued(item: InventoryPowerup): boolean {
    return this.pendingTypeIds.includes(this.getInventoryTypeId(item));
  }

  onToggleQueue(item: InventoryPowerup) {
    if (!this.canQueue(item)) return;
    this.toggleQueue.emit(this.getInventoryTypeId(item));
  }

  getInventoryCode(item: InventoryPowerup): string {
    return item.type?.code ?? '';
  }

  getInventoryTitle(item: InventoryPowerup): string {
    return item.type?.title ?? '';
  }

  getInventoryDescription(item: InventoryPowerup): string {
    return item.type?.description ?? '';
  }

  getInventoryTypeId(item: InventoryPowerup): number {
    return item.type?.id ?? 0;
  }
}
