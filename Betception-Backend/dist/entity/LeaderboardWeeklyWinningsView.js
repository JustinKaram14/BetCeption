var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ViewColumn, ViewEntity } from 'typeorm';
let LeaderboardWeeklyWinningsView = class LeaderboardWeeklyWinningsView {
    userId;
    netWinnings7d;
};
__decorate([
    ViewColumn({ name: 'user_id' }),
    __metadata("design:type", String)
], LeaderboardWeeklyWinningsView.prototype, "userId", void 0);
__decorate([
    ViewColumn({ name: 'net_winnings_7d' }),
    __metadata("design:type", String)
], LeaderboardWeeklyWinningsView.prototype, "netWinnings7d", void 0);
LeaderboardWeeklyWinningsView = __decorate([
    ViewEntity({ name: 'leaderboard_weekly_winnings' })
], LeaderboardWeeklyWinningsView);
export { LeaderboardWeeklyWinningsView };
