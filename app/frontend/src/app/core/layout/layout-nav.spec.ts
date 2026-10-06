import { ACTIVE_NAV_CLASS, NAV_ITEMS, resolveActiveModule } from './layout-nav';

describe('layout-nav', () => {
  it('ACTIVE_NAV_CLASS_DebeUsarSoloTokensDeSuperficieConVarianteOscura', () => {
    expect(ACTIVE_NAV_CLASS.split(' ').sort()).toEqual(['bg-surface-200', 'dark:bg-surface-700', 'font-semibold']);
  });

  it('NAV_ITEMS_DebeExponerExactamenteTresModulos', () => {
    expect(NAV_ITEMS.map((i) => [i.id, i.routerLink])).toEqual([
      ['backlog', '/backlog/nuevo'],
      ['sprints', '/sprints'],
      ['equipos', '/equipos'],
    ]);
    NAV_ITEMS.forEach((i) => expect(i.routerLinkActiveOptions).toEqual({ exact: false }));
  });

  it.each([
    ['/backlog/nuevo', 'backlog'],
    ['/sprints/42/elementos', 'sprints'],
    ['/equipos/responsables/miembro', 'equipos'],
    ['/equipos?x=1', 'equipos'],
    ['/zzz', null],
    ['/', null],
  ])('resolveActiveModule_%s_Devuelve_%s', (url, esperado) => {
    expect(resolveActiveModule(url)).toBe(esperado);
  });
});
