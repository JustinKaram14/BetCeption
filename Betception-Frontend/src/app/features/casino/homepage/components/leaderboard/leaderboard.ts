// src/app/features/homepage/components/leaderboard/leaderboard.ts
import { Component, Input } from '@angular/core';
import { NgFor, DecimalPipe } from '@angular/common';

type Entry = { rank:number; player:string; bestWin:number; depth:number; };

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [NgFor, DecimalPipe],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.css']
})
export class LeaderboardComponent {
  @Input() entries: Entry[] = [];
}
