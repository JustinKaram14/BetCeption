import { TestBed } from '@angular/core/testing';

import { HttpClient } from './http-client';

describe('HttpClient', () => {
  let service: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
