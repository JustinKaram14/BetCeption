import {
  HttpClient as AngularHttpClient,
  HttpContext,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

type Primitive = string | number | boolean;

type ParamValue = Primitive | ReadonlyArray<Primitive> | null | undefined;

export type HttpClientOptions = {
  params?: HttpParams | Record<string, ParamValue>;
  headers?: HttpHeaders | Record<string, string | string[] | undefined>;
  context?: HttpContext;
  withCredentials?: boolean;
  body?: unknown;
  responseType?: 'json';
};

@Injectable({
  providedIn: 'root',
})
export class HttpClient {
  private readonly http = inject(AngularHttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly includeCredentials = environment.includeCredentials;

  get<T>(path: string, options: Omit<HttpClientOptions, 'body'> = {}) {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: unknown, options: HttpClientOptions = {}) {
    return this.request<T>('POST', path, { ...options, body });
  }

  put<T>(path: string, body?: unknown, options: HttpClientOptions = {}) {
    return this.request<T>('PUT', path, { ...options, body });
  }

  patch<T>(path: string, body?: unknown, options: HttpClientOptions = {}) {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  delete<T>(path: string, options: Omit<HttpClientOptions, 'body'> = {}) {
    return this.request<T>('DELETE', path, options);
  }

  private request<T>(
    method: string,
    path: string,
    options: HttpClientOptions = {},
  ) {
    const url = this.resolveUrl(path);
    const { params, headers, body, withCredentials, ...rest } = options;
    const requestOptions: HttpClientOptions = {
      ...rest,
      withCredentials:
        typeof withCredentials === 'boolean'
          ? withCredentials
          : this.includeCredentials,
    };

    if (body !== undefined) {
      requestOptions.body = body;
    }

    if (params) {
      requestOptions.params =
        params instanceof HttpParams ? params : this.createParams(params);
    }

    if (headers) {
      requestOptions.headers =
        headers instanceof HttpHeaders
          ? headers
          : this.createHeaders(headers as Record<string, string | string[]>);
    }

    return this.http.request<T>(method, url, requestOptions);
  }

  private resolveUrl(path: string) {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${trimmedPath}`;
  }

  private createParams(params: Record<string, ParamValue>) {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === null || typeof value === 'undefined') {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          httpParams = httpParams.append(key, String(entry));
        });
        continue;
      }
      httpParams = httpParams.append(key, String(value));
    }
    return httpParams;
  }

  private createHeaders(headers: Record<string, string | string[] | undefined>) {
    let httpHeaders = new HttpHeaders();
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'undefined' || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((entry, idx) => {
          httpHeaders = idx === 0 ? httpHeaders.set(key, entry) : httpHeaders.append(key, entry);
        });
        continue;
      }
      httpHeaders = httpHeaders.set(key, value);
    }
    return httpHeaders;
  }
}
