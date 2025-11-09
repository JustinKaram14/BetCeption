// src/app/features/homepage/pages/homepage/leaderboard.ts
import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero';
import { NeonCardComponent } from '../../components/neon-card/neon-card';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard';
import { AuthPanelComponent } from '../../components/auth-panel/auth-panel';
import { CtaPanelComponent } from '../../components/cta-panel/cta-panel';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [HeroComponent, NeonCardComponent, LeaderboardComponent, AuthPanelComponent, CtaPanelComponent],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class HomepageComponent {
  entries = [
    { rank: 1, player: 'CYB3R_GH0ST', bestWin: 150000, depth: 70 },
    { rank: 2, player: 'N30N_N1NJA', bestWin: 125000, depth: 60 },
    { rank: 3, player: 'DataWraith', bestWin: 110000, depth: 80 },
    { rank: 4, player: 'GlitchQueen', bestWin: 98000, depth: 50 },
    { rank: 5, player: 'V010_WALK3R', bestWin: 92500, depth: 70 },
    { rank: 6, player: 'BinaryBard', bestWin: 85000, depth: 40 },
    { rank: 7, player: 'SyntaxSorcerer', bestWin: 81000, depth: 60 },
    { rank: 8, player: 'MegaPixel', bestWin: 76000, depth: 50 },
    { rank: 9, player: 'CircuitSiren', bestWin: 71500, depth: 50 },
    { rank:10, player: 'PacketPharaoh', bestWin: 68000, depth: 40 },
  ];

  onLogin(payload:{username:string; password:string}) { console.log('login', payload); }
  onRegister(payload:{username:string; password:string}) { console.log('register', payload); }
  onEnter() { console.log('enter betception'); }
  onRewards() { console.log('daily rewards'); }
}
