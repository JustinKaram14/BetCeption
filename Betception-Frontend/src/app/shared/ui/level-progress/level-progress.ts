import { NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import type { LevelProgress } from '../../../core/api/api.types';

@Component({
  selector: 'app-level-progress',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './level-progress.html',
  styleUrl: './level-progress.css',
})
export class LevelProgressComponent {
  @Input() progress: LevelProgress | null = null;
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() compact = false;

  get percent() {
    const value = this.progress?.progressPercent ?? 0;
    return Math.max(0, Math.min(100, value));
  }

  get xpGained() {
    return Math.max(0, Math.floor(this.progress?.xpGained ?? 0));
  }

  get xpLabel() {
    if (!this.progress) return '0 / 0 XP';
    return `${this.progress.xpIntoLevel} / ${this.progress.nextLevelXp - this.progress.currentLevelXp} XP`;
  }
}
