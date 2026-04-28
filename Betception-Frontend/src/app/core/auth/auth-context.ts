import { HttpContextToken } from '@angular/common/http';

/** Set this context token to `true` on requests that must bypass the auth interceptor. */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
