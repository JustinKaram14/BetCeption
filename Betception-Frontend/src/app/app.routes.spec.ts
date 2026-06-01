import { routes } from './app.routes';

describe('routes', () => {
  it('defines the public and protected application routes', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'homepage',
      'blackjack',
      'impressum',
      'datenschutz',
      'verify-email',
      'change-password',
      'reset-password',
      '**',
    ]);
    expect(routes.find((route) => route.path === 'blackjack')?.canActivate?.length).toBe(1);
  });

  it('lazy-loads every component route', async () => {
    const componentRoutes = routes.filter((route) => route.loadComponent);

    const components = await Promise.all(
      componentRoutes.map((route) => route.loadComponent!()),
    );

    expect(components.length).toBe(7);
    expect(components.every(Boolean)).toBeTrue();
  });
});
