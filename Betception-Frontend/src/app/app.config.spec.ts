import { Subject, throwError } from 'rxjs';

import { Auth } from './core/auth/auth';
import { startAuthRefresh } from './app.config';

describe('startAuthRefresh', () => {
  it('starts auth refresh without blocking application bootstrap', () => {
    const refresh$ = new Subject<null>();
    const auth = jasmine.createSpyObj<Auth>('Auth', ['refresh']);
    auth.refresh.and.returnValue(refresh$);

    const result = startAuthRefresh(auth)();

    expect(result).toBeUndefined();
    expect(auth.refresh).toHaveBeenCalled();
  });

  it('swallows refresh errors during bootstrap', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['refresh']);
    auth.refresh.and.returnValue(throwError(() => new Error('refresh failed')));

    expect(() => startAuthRefresh(auth)()).not.toThrow();
  });
});
