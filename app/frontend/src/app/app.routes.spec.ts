import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from './core/auth/auth.service';
import { routes } from './app.routes';

const deepest = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? deepest(snapshot.firstChild) : snapshot;

// HU-035 — contrato de rutas: las URL existentes se conservan dentro del esqueleto.
describe('app.routes', () => {
  const isAuthenticated = signal(true);
  const login = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    isAuthenticated.set(true);
    login.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAuthenticated, userName: signal('Ana'), login, logout: jest.fn() } },
      ],
    });
  });

  it.each([
    ['/backlog/nuevo', 'CreateBacklogItemComponent', undefined],
    ['/sprints', 'SprintListComponent', undefined],
    ['/sprints/nuevo', 'SprintFormComponent', undefined],
    ['/sprints/42/elementos', 'SprintAssignedItemsComponent', undefined],
    ['/sprints/42', 'SprintDetailComponent', undefined],
    ['/equipos', 'TeamPageComponent', { tab: 'miembros' }],
    ['/equipos/roles', 'TeamPageComponent', { tab: 'roles' }],
    ['/equipos/responsables', 'TeamPageComponent', { tab: 'responsables', view: 'elemento' }],
    ['/equipos/responsables/miembro', 'TeamPageComponent', { tab: 'responsables', view: 'miembro' }],
    ['/zzz', 'NotFoundComponent', undefined],
  ])('%s_ResuelveA_%s_DentroDelEsqueleto', async (url, componente, data) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const router = TestBed.inject(Router);
    const leaf = deepest(router.routerState.snapshot.root);

    expect(router.url).toBe(url);
    expect(leaf.component?.name).toBe(componente);
    if (data) expect(leaf.data).toEqual(data);
    expect(harness.routeNativeElement?.querySelector('header')).not.toBeNull();
  });

  it('Raiz_DebeRedirigirABacklogNuevo', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/backlog/nuevo');
  });

  it('SinSesion_ElGuardBloqueaYElEsqueletoNoSeActiva', async () => {
    isAuthenticated.set(false);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/sprints');

    expect(login).toHaveBeenCalled();
    expect(harness.routeNativeElement?.querySelector('header') ?? null).toBeNull();
  });
});
