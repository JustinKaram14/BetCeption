import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { ENTITIES } from '../entity/index.js';
import { InitSchema1700000000000 } from './migrations/1700000000000-InitSchema.js';
import { AddRateLimitCounters1700000000001 } from './migrations/1700000000001-AddRateLimitCounters.js';
import { AddUsernameToWinningsView1700000000002 } from './migrations/1700000000002-AddUsernameToWinningsView.js';
import { AddUserCrates1700000000003 } from './migrations/1700000000003-AddUserCrates.js';
import { AddCrateRewardToWalletKind1700000000004 } from './migrations/1700000000004-AddCrateRewardToWalletKind.js';
import { AddStreakToUsersAndClaims1700000000005 } from './migrations/1700000000005-AddStreakToUsersAndClaims.js';
import { AddXpBoostExpiry1700000000006 } from './migrations/1700000000006-AddXpBoostExpiry.js';
import { SeedPowerupTypes1700000000007 } from './migrations/1700000000007-SeedPowerupTypes.js';
import { AddActivePowerPills1700000000008 } from './migrations/1700000000008-AddActivePowerPills.js';
import { AddBetceptionSidebets1700000000009 } from './migrations/1700000000009-AddBetceptionSidebets.js';
import { ReplaceWinnerWithDealerBustSidebet1700000000010 } from './migrations/1700000000010-ReplaceWinnerWithDealerBustSidebet.js';
import { AddPlayerSplitHandType1700000000011 } from './migrations/1700000000011-AddPlayerSplitHandType.js';
import { AddExpandedBetceptionSidebets1700000000012 } from './migrations/1700000000012-AddExpandedBetceptionSidebets.js';
import { AddUserProfileAvatar1700000000013 } from './migrations/1700000000013-AddUserProfileAvatar.js';
import { AddEmailVerification1700000000014 } from './migrations/1700000000014-AddEmailVerification.js';
import { AddPasswordTokens1700000000015 } from './migrations/1700000000015-AddPasswordTokens.js';
import { AddPasswordChangedAt1700000000016 } from './migrations/1700000000016-AddPasswordChangedAt.js';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  entities: ENTITIES,
  migrations: [InitSchema1700000000000, AddRateLimitCounters1700000000001, AddUsernameToWinningsView1700000000002, AddUserCrates1700000000003, AddCrateRewardToWalletKind1700000000004, AddStreakToUsersAndClaims1700000000005, AddXpBoostExpiry1700000000006, SeedPowerupTypes1700000000007, AddActivePowerPills1700000000008, AddBetceptionSidebets1700000000009, ReplaceWinnerWithDealerBustSidebet1700000000010, AddPlayerSplitHandType1700000000011, AddExpandedBetceptionSidebets1700000000012, AddUserProfileAvatar1700000000013, AddEmailVerification1700000000014, AddPasswordTokens1700000000015, AddPasswordChangedAt1700000000016],
  synchronize: false,
  logging: env.nodeEnv === 'development',
});

export async function initDataSource() {
  if (AppDataSource.isInitialized) return AppDataSource;
  return AppDataSource.initialize();
}
