import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HttpClient } from './http-client';

describe('HttpClient', () => {
  let service: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds relative JSON requests with params, headers, body and credentials', () => {
    service.post('/wallet/deposit', { amount: 25 }, {
      params: { page: 1, tag: ['a', 'b'], empty: null, missing: undefined },
      headers: { 'X-Test': ['one', 'two'] },
    }).subscribe((body) => {
      expect(body).toEqual({ ok: true });
    });

    const req = httpMock.expectOne((request) => request.url.endsWith('/wallet/deposit'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 25 });
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.getAll('tag')).toEqual(['a', 'b']);
    expect(req.request.params.has('empty')).toBeFalse();
    expect(req.request.headers.getAll('X-Test')).toEqual(['one', 'two']);
    req.flush({ ok: true });
  });

  it('keeps absolute URLs and accepts Angular params and headers instances', () => {
    const params = new HttpParams().set('q', 'blackjack');
    const headers = new HttpHeaders().set('X-Mode', 'test');

    service.get('https://api.example.test/search', {
      params,
      headers,
      withCredentials: false,
    }).subscribe();

    const req = httpMock.expectOne('https://api.example.test/search?q=blackjack');
    expect(req.request.withCredentials).toBeFalse();
    expect(req.request.headers.get('X-Mode')).toBe('test');
    req.flush({});
  });

  it('delegates put, patch and delete methods with the expected HTTP verbs', () => {
    service.put('/profile', { username: 'new' }).subscribe();
    service.patch('/profile', { avatarIcon: 'chip' }).subscribe();
    service.delete('/profile', { body: { password: 'pw' } }).subscribe();

    const putReq = httpMock.expectOne((request) => request.method === 'PUT');
    const patchReq = httpMock.expectOne((request) => request.method === 'PATCH');
    const deleteReq = httpMock.expectOne((request) => request.method === 'DELETE');

    expect(putReq.request.body).toEqual({ username: 'new' });
    expect(patchReq.request.body).toEqual({ avatarIcon: 'chip' });
    expect(deleteReq.request.body).toEqual({ password: 'pw' });
    putReq.flush({});
    patchReq.flush({});
    deleteReq.flush({});
  });
});
