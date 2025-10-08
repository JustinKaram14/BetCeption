import { TestBed } from '@angular/core/testing';

import { Rng } from './rng';

describe('Rng', () => {
  let service: Rng;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rng);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
