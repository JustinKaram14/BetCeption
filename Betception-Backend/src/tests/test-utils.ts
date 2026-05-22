import type { Request, Response } from 'express';
import type { EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source.js';
import { UserAchievement } from '../entity/UserAchievement.js';
import { ACHIEVEMENTS, achievementTarget } from '../modules/achievements/achievement-definitions.js';

type MockFn = jest.Mock<any, any>;

export type MockRepository<T = any> = {
  find: MockFn;
  findOne: MockFn;
  findAndCount: MockFn;
  exist: MockFn;
  create: MockFn;
  save: MockFn;
  update: MockFn;
  delete: MockFn;
  remove: MockFn;
  count: MockFn;
};

export function createMockRepository<T>(overrides: Partial<MockRepository<T>> = {}) {
  const defaults: MockRepository<T> = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    exist: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((entity) => entity),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };
  return { ...defaults, ...overrides };
}

export function mockAppDataSourceRepositories(
  repoMap: Map<EntityTarget<any>, MockRepository>,
) {
  const repoFor = <Entity extends ObjectLiteral>(entity: EntityTarget<Entity>, strict: boolean): Repository<Entity> => {
    const repo = repoMap.get(entity);
    if (!repo && strict) {
      throw new Error(`No mock repository registered for ${(entity as any)?.name ?? 'unknown entity'}`);
    }
    return (repo ?? defaultLenientRepository(entity)) as unknown as Repository<Entity>;
  };

  jest
    .spyOn(AppDataSource.manager, 'getRepository')
    .mockImplementation(<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity> => repoFor(entity, false));

  return jest
    .spyOn(AppDataSource, 'getRepository')
    .mockImplementation(<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity> => repoFor(entity, true));
}

function defaultLenientRepository(entity: EntityTarget<any>) {
  if (entity === UserAchievement) {
    return createMockRepository({
      find: jest.fn().mockResolvedValue(
        ACHIEVEMENTS.map((achievement) => ({
          id: `achievement-${achievement.code}`,
          achievementCode: achievement.code,
          progress: achievementTarget(achievement),
          unlocked: true,
          unlockedAt: new Date('2026-01-01T00:00:00Z'),
          seenAt: new Date('2026-01-01T00:00:00Z'),
          rewardedAt: new Date('2026-01-01T00:00:00Z'),
        })),
      ),
    });
  }
  return createMockRepository({ find: jest.fn().mockResolvedValue([]) });
}

export function mockAppDataSourceTransaction(
  managerRepos: Map<EntityTarget<any>, MockRepository>,
  extraManagerMethods: Partial<Record<string, jest.Mock>> = {},
) {
  const manager = {
    getRepository: ((entity: EntityTarget<any>) => {
      const repo = managerRepos.get(entity);
      if (repo) return repo as unknown as Repository<any>;
      // Return a lenient default so new controller dependencies don't break
      // existing tests — explicit tests should still register their own repos.
      return defaultLenientRepository(entity) as unknown as Repository<any>;
    }) as EntityManager['getRepository'],
    query: jest.fn().mockResolvedValue([]),
    ...extraManagerMethods,
  } as unknown as EntityManager;

  return jest
    .spyOn(AppDataSource, 'transaction')
    .mockImplementation(async (runInTransaction: any) => runInTransaction(manager));
}

type MockRequestOptions = Partial<Request>;

export function createMockRequest<T extends MockRequestOptions = MockRequestOptions>(
  overrides: T = {} as T,
) {
  const base: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: undefined,
    ip: '127.0.0.1',
  };
  return { ...base, ...overrides } as Request;
}

export type MockResponse = Response & {
  status: jest.MockedFunction<Response['status']>;
  json: jest.MockedFunction<Response['json']>;
  setHeader: jest.MockedFunction<Response['setHeader']>;
  cookie: jest.MockedFunction<Response['cookie']>;
  clearCookie: jest.MockedFunction<Response['clearCookie']>;
  send: jest.MockedFunction<Response['send']>;
};

export function createMockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as MockResponse;
}

export function createMockNext() {
  return jest.fn();
}
