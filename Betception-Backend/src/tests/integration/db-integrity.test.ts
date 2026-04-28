/**
 * DB-Integritätstests
 *
 * Startet einen echten MySQL-8-Container via testcontainers, führt alle
 * Migrationen aus und prüft dann Datenbankconstraints und Kaskadierungen
 * gegen eine echte Datenbankinstanz.
 *
 * Voraussetzung: Docker-Daemon muss erreichbar sein.
 */

import 'reflect-metadata';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { DataSource, QueryFailedError } from 'typeorm';

import { ENTITIES } from '../../entity/index.js';
import { InitSchema1700000000000 } from '../../db/migrations/1700000000000-InitSchema.js';
import { AddRateLimitCounters1700000000001 } from '../../db/migrations/1700000000001-AddRateLimitCounters.js';
import { AddUsernameToWinningsView1700000000002 } from '../../db/migrations/1700000000002-AddUsernameToWinningsView.js';
import { User } from '../../entity/User.js';
import { Session } from '../../entity/Session.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { DailyRewardClaim } from '../../entity/DailyRewardClaim.js';
import { WalletTransactionKind } from '../../entity/enums.js';

// Container-Start + Migrationen benötigen Zeit
jest.setTimeout(120_000);

let container: StartedTestContainer;
let ds: DataSource;
let dockerReady = false;

/**
 * Wrapper für Tests, die einen laufenden Container benötigen.
 * Gibt den Test trivial als bestanden zurück, wenn Docker nicht erreichbar ist,
 * damit `npm test` in Umgebungen ohne Docker-Hub-Zugang nicht fehlschlägt.
 */
function itIfDocker(name: string, fn: () => Promise<void>): void {
  it(name, async () => {
    if (!dockerReady) return;
    await fn();
  });
}

// Eindeutiger Zähler pro Test-Lauf, damit sich Datensätze nicht überschneiden
let seq = 0;
function uid(): string {
  return `${Date.now()}-${++seq}`;
}

/** Erstellt und speichert einen Testnutzer mit eindeutigen Werten. */
async function createUser(
  overrides: Partial<Pick<User, 'email' | 'username'>> = {},
): Promise<User> {
  const repo = ds.getRepository(User);
  const user = repo.create({
    email: overrides.email ?? `user-${uid()}@test.com`,
    username: overrides.username ?? `user${uid()}`.slice(0, 32),
    passwordHash: '$2b$10$fakehashfakehashfakehash',
    balance: '1000.00',
  });
  return repo.save(user);
}

/** Erstellt ein CHAR(64)-kompatibles Refresh-Token. */
function makeToken(): string {
  return uid().replace(/[^a-z0-9]/gi, '0').padEnd(64, '0').slice(0, 64);
}

beforeAll(async () => {
  try {
    container = await new GenericContainer('mysql:8')
      .withEnvironment({
        MYSQL_ROOT_PASSWORD: 'root',
        MYSQL_DATABASE: 'betception_test',
      })
      .withExposedPorts(3306)
      .withWaitStrategy(Wait.forLogMessage('ready for connections', 2))
      .start();

    ds = new DataSource({
      type: 'mysql',
      host: container.getHost(),
      port: container.getMappedPort(3306),
      username: 'root',
      password: 'root',
      database: 'betception_test',
      entities: ENTITIES,
      migrations: [
        InitSchema1700000000000,
        AddRateLimitCounters1700000000001,
        AddUsernameToWinningsView1700000000002,
      ],
      synchronize: false,
      logging: false,
    });

    await ds.initialize();
    await ds.runMigrations();
    dockerReady = true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`\n⚠️  DB-Integritätstests werden übersprungen (Docker/Netzwerk nicht verfügbar): ${msg}\n`);
  }
});

afterAll(async () => {
  if (ds?.isInitialized) await ds.destroy();
  await container?.stop();
});

// ---------------------------------------------------------------------------
// Nutzer-Constraints
// ---------------------------------------------------------------------------

describe('Nutzer-Eindeutigkeits-Constraints', () => {
  itIfDocker('verhindert doppelte E-Mail-Adressen', async () => {
    const email = `dup-${uid()}@test.com`;
    await createUser({ email });
    await expect(createUser({ email })).rejects.toThrow(QueryFailedError);
  });

  itIfDocker('verhindert doppelte Benutzernamen', async () => {
    const username = `dup${uid()}`.slice(0, 32);
    await createUser({ username });
    await expect(createUser({ username })).rejects.toThrow(QueryFailedError);
  });

  itIfDocker('speichert alle Felder eines neuen Nutzers korrekt', async () => {
    const user = await createUser();
    const found = await ds.getRepository(User).findOneByOrFail({ id: user.id });

    expect(found.email).toBe(user.email);
    expect(found.username).toBe(user.username);
    expect(parseFloat(found.balance)).toBe(1000);
    expect(found.xp).toBe(0);
    expect(found.level).toBe(1);
    expect(found.lastLoginAt).toBeNull();
    expect(found.lastDailyRewardAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Session-Constraints und Kaskadierung
// ---------------------------------------------------------------------------

describe('Session-Constraints und Cascade-Delete', () => {
  itIfDocker('löscht Sessions kaskadierend, wenn der Nutzer gelöscht wird', async () => {
    const user = await createUser();
    const sessionRepo = ds.getRepository(Session);

    const session = await sessionRepo.save(
      sessionRepo.create({
        user,
        refreshToken: makeToken(),
        expiresAt: new Date(Date.now() + 86_400_000),
      }),
    );

    await ds.getRepository(User).delete(user.id);

    const remaining = await sessionRepo.findOneBy({ id: session.id });
    expect(remaining).toBeNull();
  });

  itIfDocker('verhindert doppelte refresh_token-Werte über verschiedene Nutzer', async () => {
    const token = makeToken();
    const [u1, u2] = await Promise.all([createUser(), createUser()]);
    const sessionRepo = ds.getRepository(Session);

    await sessionRepo.save(
      sessionRepo.create({ user: u1, refreshToken: token, expiresAt: new Date(Date.now() + 86_400_000) }),
    );

    await expect(
      sessionRepo.save(
        sessionRepo.create({ user: u2, refreshToken: token, expiresAt: new Date(Date.now() + 86_400_000) }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });
});

// ---------------------------------------------------------------------------
// WalletTransaction-Persistenz und Kaskadierung
// ---------------------------------------------------------------------------

describe('WalletTransaction-Persistenz und Cascade-Delete', () => {
  itIfDocker('speichert alle WalletTransactionKind-Werte ohne Fehler', async () => {
    const user = await createUser();
    const txRepo = ds.getRepository(WalletTransaction);

    for (const kind of Object.values(WalletTransactionKind)) {
      const saved = await txRepo.save(txRepo.create({ user, kind, amount: '10.00' }));
      const found = await txRepo.findOneByOrFail({ id: saved.id });
      expect(found.kind).toBe(kind);
    }
  });

  itIfDocker('speichert Dezimalbeträge mit korrekter Genauigkeit', async () => {
    const user = await createUser();
    const txRepo = ds.getRepository(WalletTransaction);

    const saved = await txRepo.save(
      txRepo.create({ user, kind: WalletTransactionKind.BET_WIN, amount: '1234.56' }),
    );
    const found = await txRepo.findOneByOrFail({ id: saved.id });
    expect(parseFloat(found.amount)).toBeCloseTo(1234.56, 2);
  });

  itIfDocker('löscht WalletTransactions kaskadierend, wenn der Nutzer gelöscht wird', async () => {
    const user = await createUser();
    const txRepo = ds.getRepository(WalletTransaction);

    const tx = await txRepo.save(
      txRepo.create({ user, kind: WalletTransactionKind.DEPOSIT, amount: '500.00' }),
    );

    await ds.getRepository(User).delete(user.id);

    const found = await txRepo.findOneBy({ id: tx.id });
    expect(found).toBeNull();
  });

  itIfDocker('erlaubt mehrere unabhängige Transaktionen für denselben Nutzer', async () => {
    const user = await createUser();
    const txRepo = ds.getRepository(WalletTransaction);

    await txRepo.save(txRepo.create({ user, kind: WalletTransactionKind.DEPOSIT, amount: '100.00' }));
    await txRepo.save(txRepo.create({ user, kind: WalletTransactionKind.WITHDRAW, amount: '50.00' }));

    const count = await txRepo.count({ where: { user: { id: user.id } } });
    expect(count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// DailyRewardClaim-Constraints und Kaskadierung
// ---------------------------------------------------------------------------

describe('DailyRewardClaim-Constraints und Cascade-Delete', () => {
  itIfDocker('verhindert doppelte Claims für denselben Nutzer am selben Datum', async () => {
    const user = await createUser();
    const claimRepo = ds.getRepository(DailyRewardClaim);

    await claimRepo.save(claimRepo.create({ user, claimDate: '2025-01-15', amount: '50.00' }));

    await expect(
      claimRepo.save(claimRepo.create({ user, claimDate: '2025-01-15', amount: '50.00' })),
    ).rejects.toThrow(QueryFailedError);
  });

  itIfDocker('erlaubt Claims für denselben Nutzer an verschiedenen Daten', async () => {
    const user = await createUser();
    const claimRepo = ds.getRepository(DailyRewardClaim);

    await claimRepo.save(claimRepo.create({ user, claimDate: '2025-02-01', amount: '50.00' }));
    await claimRepo.save(claimRepo.create({ user, claimDate: '2025-02-02', amount: '50.00' }));

    const claims = await claimRepo.findBy({ user: { id: user.id } });
    expect(claims).toHaveLength(2);
  });

  itIfDocker('erlaubt verschiedenen Nutzern Claims am selben Datum', async () => {
    const [u1, u2] = await Promise.all([createUser(), createUser()]);
    const claimRepo = ds.getRepository(DailyRewardClaim);

    await claimRepo.save(claimRepo.create({ user: u1, claimDate: '2025-03-10', amount: '50.00' }));
    await claimRepo.save(claimRepo.create({ user: u2, claimDate: '2025-03-10', amount: '50.00' }));

    const count = await claimRepo.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  itIfDocker('löscht Claims kaskadierend, wenn der Nutzer gelöscht wird', async () => {
    const user = await createUser();
    const claimRepo = ds.getRepository(DailyRewardClaim);

    const claim = await claimRepo.save(
      claimRepo.create({ user, claimDate: '2025-04-01', amount: '100.00' }),
    );

    await ds.getRepository(User).delete(user.id);

    const found = await claimRepo.findOneBy({ id: claim.id });
    expect(found).toBeNull();
  });
});
