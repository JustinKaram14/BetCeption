import type { Request, Response } from 'express';
import type { EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source.js';

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
    count: jest.fn(),
  };
  return { ...defaults, ...overrides };
}

export function mockAppDataSourceRepositories(
  repoMap: Map<EntityTarget<any>, MockRepository>,
) {
  return jest
    .spyOn(AppDataSource, 'getRepository')
    .mockImplementation(<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity> => {
      const repo = repoMap.get(entity);
      if (!repo) {
        throw new Error(`No mock repository registered for ${(entity as any)?.name ?? 'unknown entity'}`);
      }
      return repo as unknown as Repository<Entity>;
    });
}

export function mockAppDataSourceTransaction(
  managerRepos: Map<EntityTarget<any>, MockRepository>,
) {
  const manager = {
    getRepository: ((entity: EntityTarget<any>) => {
      const repo = managerRepos.get(entity);
      if (!repo) {
        throw new Error(`No mock repository registered in transaction for ${(entity as any)?.name ?? 'unknown entity'}`);
      }
      return repo as unknown as Repository<any>;
    }) as EntityManager['getRepository'],
  } as EntityManager;

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
  cookie: jest.MockedFunction<Response['cookie']>;
  clearCookie: jest.MockedFunction<Response['clearCookie']>;
  send: jest.MockedFunction<Response['send']>;
};

export function createMockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as MockResponse;
}

export function createMockNext() {
  return jest.fn();
}
