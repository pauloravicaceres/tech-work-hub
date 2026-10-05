import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../auth/auth.service';
import { LayoutComponent } from './layout.component';
import { NAV_ITEMS, resolveActiveModule } from './layout-nav';
import { LAYOUT_TEXTS } from './layout.texts';
import { ViewportService } from './viewport.service';

const deepest = (s: ActivatedRouteSnapshot): ActivatedRouteSnapshot => (s.firstChild ? deepest(s.firstChild) : s);

// QA-AUTO HU-035 — casos adversariales sobre el esqueleto (CA US1..US2, FR-001..FR-006).
describe('LayoutComponent (QA adversarial)', () => {
  const isWide = signal(true);
  const userName = signal<string | null>('Ana');

  beforeEach(() => {
    isWide.set(true);
    userName.set('Ana');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: '', component: LayoutComponent, children: [{ path: '**', children: [] }] }]),
        { provide: AuthService, useValue: { userName, logout: jest.fn() } },
        { provide: ViewportService, useValue: { isWide: isWide.asReadonly() } },
      ],
    });
  });

  async function render(url = '/sprints') {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
    return { harness, root: harness.routeNativeElement as HTMLElement };
  }
  const toggleBtn = (root: HTMLElement) =>
    root.querySelector<HTMLButtonElement>(`button[aria-label="${LAYOUT_TEXTS.toggleNavAriaLabel}"]`)!;

  it('Esqueleto_ConCualquierRuta_DebeSituarHeaderYFooterFueraDeMainYUnSoloMain', async () => {
    // Arrange / Act
    const { root } = await render('/equipos/roles');

    // Assert
    expect(root.querySelectorAll('main')).toHaveLength(1);
    expect(root.querySelector('main')?.contains(root.querySelector('header'))).toBe(false);
    expect(root.querySelector('main')?.contains(root.querySelector('footer'))).toBe(false);
    expect(root.querySelector('main')?.contains(root.querySelector('nav'))).toBe(false);
  });

  it('Navegacion_EnAnchoAmplio_DebeEnlazarLosTresModulosConSusRutasReales', async () => {
    // Arrange / Act
    const { root } = await render();
    const hrefs = Array.from(root.querySelectorAll<HTMLAnchorElement>('aside nav a')).map((a) => a.getAttribute('href'));

    // Assert
    expect(hrefs).toEqual(['/backlog/nuevo', '/sprints', '/equipos']);
  });

  it('Control_ConNavegacionAbierta_DebeReflejarAriaExpandedYCambiarAlColapsar', async () => {
    // Arrange
    const { harness, root } = await render();
    expect(toggleBtn(root).getAttribute('aria-expanded')).toBe('true');

    // Act
    toggleBtn(root).click();
    harness.detectChanges();

    // Assert
    expect(toggleBtn(root).getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('aside')).toBeNull();
    expect(root.querySelector('main')).not.toBeNull();
  });

  it('Colapsada_ElControlDebeSeguirVisibleYRestaurarLosTresModulos', async () => {
    // Arrange
    const { harness, root } = await render();
    toggleBtn(root).click();
    harness.detectChanges();

    // Act
    toggleBtn(root).click();
    harness.detectChanges();

    // Assert
    expect(root.querySelectorAll('aside nav li[role="menuitem"]')).toHaveLength(3);
  });

  it('AnchoReducido_ElDrawerNoDebeDuplicarAsideNiPermitirDosNavegaciones', async () => {
    // Arrange
    isWide.set(false);
    const { harness, root } = await render();

    // Act
    toggleBtn(root).click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();

    // Assert
    expect(root.querySelector('aside')).toBeNull();
    expect(document.body.querySelectorAll('.p-drawer nav')).toHaveLength(1);
  });

  it('AnchoReducido_AlElegirUnaEntrada_DebeCerrarLaCapaYNavegar', async () => {
    // Arrange
    isWide.set(false);
    const { harness, root } = await render('/backlog/nuevo');
    toggleBtn(root).click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();

    // Act
    document.body.querySelector<HTMLAnchorElement>('.p-drawer nav a[href="/equipos"]')?.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    // Assert
    expect(TestBed.inject(Router).url).toBe('/equipos');
    expect(toggleBtn(root).getAttribute('aria-expanded')).toBe('false');
  });

  it('Navegacion_AlCambiarDeModulo_DebeMoverElResaltadoSinDejarDosActivos', async () => {
    // Arrange
    const { harness, root } = await render('/backlog/nuevo');
    const activos = () => Array.from(root.querySelectorAll('nav li.font-semibold')).map((li) => li.textContent?.trim());
    expect(activos()).toEqual([LAYOUT_TEXTS.nav.backlog]);

    // Act
    await harness.navigateByUrl('/equipos/responsables');
    harness.detectChanges();

    // Assert
    expect(activos()).toEqual([LAYOUT_TEXTS.nav.equipos]);
  });

  it.each([
    ['/sprintsx', null],
    ['/Sprints', null],
    ['/backlog', 'backlog'],
    ['//sprints', 'sprints'],
    ['/sprints#frag', 'sprints'],
    ['', null],
  ])('resolveActiveModule_%j_Devuelve_%s', (url, esperado) => {
    // Act / Assert
    expect(resolveActiveModule(url)).toBe(esperado);
  });

  it('NavItems_DebenTenerIdUnicoYEtiquetaVisible', () => {
    // Assert
    expect(new Set(NAV_ITEMS.map((i) => i.id)).size).toBe(NAV_ITEMS.length);
    NAV_ITEMS.forEach((i) => expect((i.label ?? '').trim().length).toBeGreaterThan(0));
  });
});

// Contrato de rutas ampliado: nada que no existía antes debe resolver a otra pantalla (FR-004, FR-005, SC-002).
describe('app.routes (QA adversarial)', () => {
  const isAuthenticated = signal(true);

  beforeEach(() => {
    isAuthenticated.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAuthenticated, userName: signal('Ana'), login: jest.fn(), logout: jest.fn() } },
      ],
    });
  });

  it.each(['/backlog', '/sprints/42/elementos/extra', '/equipos/otro', '/equipos/responsables/otro', '/sprints/nuevo/x/y'])(
    'RutaInexistente_%s_DebeMostrarNotFoundSinRedirigirYConEsqueleto',
    async (url) => {
      // Arrange
      const harness = await RouterTestingHarness.create();

      // Act
      await harness.navigateByUrl(url);
      harness.detectChanges();

      // Assert
      const router = TestBed.inject(Router);
      expect(router.url).toBe(url);
      expect(deepest(router.routerState.snapshot.root).component?.name).toBe('NotFoundComponent');
      const root = harness.routeNativeElement as HTMLElement;
      expect(root.querySelector('header')).not.toBeNull();
      expect(root.querySelector('footer')).not.toBeNull();
      expect(root.querySelector('main')?.textContent).toContain(LAYOUT_TEXTS.notFound.title);
    },
  );

  it('SprintsNuevo_DebeResolverAFormularioYNoAlDetalleConId', async () => {
    // Arrange
    const harness = await RouterTestingHarness.create();

    // Act
    await harness.navigateByUrl('/sprints/nuevo');

    // Assert
    const leaf = deepest(TestBed.inject(Router).routerState.snapshot.root);
    expect(leaf.component?.name).toBe('SprintFormComponent');
    expect(leaf.params['id']).toBeUndefined();
  });

  it('RutaInexistenteSinSesion_ElGuardDebeBloquearTambienElNotFound', async () => {
    // Arrange
    isAuthenticated.set(false);
    const harness = await RouterTestingHarness.create();

    // Act
    await harness.navigateByUrl('/zzz');

    // Assert
    expect((harness.routeNativeElement as HTMLElement | null)?.querySelector('header') ?? null).toBeNull();
  });

  it('Rutas_Raiz_DebeTenerUnaSolaRutaPadreConGuardDeHijas', () => {
    // Act
    const padres = routes.filter((r) => r.children);

    // Assert
    expect(padres).toHaveLength(1);
    expect(padres[0].canActivateChild).toBeDefined();
    expect(padres[0].path).toBe('');
  });
});
