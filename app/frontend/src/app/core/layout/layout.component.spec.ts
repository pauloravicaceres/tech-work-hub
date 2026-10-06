import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '../auth/auth.service';
import { LayoutComponent } from './layout.component';
import { LAYOUT_TEXTS } from './layout.texts';
import { ViewportService } from './viewport.service';

// HU-035 — esqueleto: zonas, navegación activa, perfil, modo acoplado/capa y medidas del contenido.
describe('LayoutComponent', () => {
  const userName = signal<string | null>('Ana Pérez');
  const isWide = signal(true);
  const logout = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    userName.set('Ana Pérez');
    isWide.set(true);
    logout.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: '',
            component: LayoutComponent,
            children: [{ path: '**', children: [] }],
          },
        ]),
        { provide: AuthService, useValue: { userName, logout } },
        { provide: ViewportService, useValue: { isWide: isWide.asReadonly() } },
      ],
    });
  });

  async function render(url = '/backlog/nuevo') {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
    const root = harness.routeNativeElement as HTMLElement;
    return { harness, root, q: <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel) };
  }

  const items = (root: HTMLElement) => Array.from(root.querySelectorAll('nav [role="menuitem"], nav .p-menu-item'));

  it('DebeRenderizarLasCuatroZonas', async () => {
    const { q } = await render();

    expect(q('header')).not.toBeNull();
    expect(q('nav')?.getAttribute('aria-label')).toBe(LAYOUT_TEXTS.navAriaLabel);
    expect(q('main')).not.toBeNull();
    expect(q('footer')?.textContent).toContain(LAYOUT_TEXTS.footer);
  });

  it('NavegacionAcopladaDebeOcuparTodaLaAlturaDelAside', async () => {
    const { q } = await render();

    expect(q('aside nav')?.classList.contains('h-full')).toBe(true);
    expect(q('aside p-menu')?.getAttribute('styleClass') ?? q('aside .p-menu')?.className).toContain('h-full');
  });

  it('DebeMostrarExactamenteTresEntradasDeNavegacion', async () => {
    const { root } = await render();

    expect(root.querySelectorAll('nav li[role="menuitem"]').length).toBe(3);
  });

  it('DebeMostrarElNombreDelPerfilOElTextoPorDefecto', async () => {
    const { harness, root } = await render();
    expect(root.querySelector('header')?.textContent).toContain('Ana Pérez');

    userName.set(null);
    harness.detectChanges();
    expect(root.querySelector('header')?.textContent).toContain(LAYOUT_TEXTS.profileFallback);
  });

  it('CerrarSesion_DebeInvocarAuthServiceLogout', async () => {
    const { harness, root } = await render();
    root.querySelector<HTMLButtonElement>(`button[aria-label="${LAYOUT_TEXTS.profileMenuAriaLabel}"]`)?.click();
    harness.detectChanges();

    const option = Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"] a, [role="menuitem"] .p-menu-item-link')).find((el) =>
      el.textContent?.includes(LAYOUT_TEXTS.logout),
    );
    option?.click();

    expect(logout).toHaveBeenCalled();
  });

  it('CerrarSesion_ConRechazo_DebeMostrarMensajeDeError', async () => {
    logout.mockRejectedValueOnce(new Error('keycloak'));
    const { harness, root } = await render();
    root.querySelector<HTMLButtonElement>(`button[aria-label="${LAYOUT_TEXTS.profileMenuAriaLabel}"]`)?.click();
    harness.detectChanges();
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"] a, [role="menuitem"] .p-menu-item-link'))
      .find((el) => el.textContent?.includes(LAYOUT_TEXTS.logout))
      ?.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(root.querySelector('main p-message')?.textContent).toContain(LAYOUT_TEXTS.logoutError);
  });

  it.each([
    ['/sprints/42/elementos', LAYOUT_TEXTS.nav.sprints],
    ['/equipos/roles', LAYOUT_TEXTS.nav.equipos],
    ['/zzz', null],
  ])('%s_MarcaComoActiva_%s', async (url, etiqueta) => {
    const { root } = await render(url);

    const activos = Array.from(root.querySelectorAll('nav li.font-semibold')).map((li) => li.textContent?.trim());
    expect(activos).toEqual(etiqueta ? [etiqueta] : []);
  });

  it('AnchoAmplio_MuestraElAsideYNoElDrawer', async () => {
    const { q } = await render();

    expect(q('aside')).not.toBeNull();
    expect(document.body.querySelector('p-drawer')).toBeNull();
  });

  it('AnchoReducido_IniciaColapsadaYElControlAbreElDrawer', async () => {
    isWide.set(false);
    const { harness, root, q } = await render();

    expect(q('aside')).toBeNull();
    expect(document.body.querySelector('.p-drawer')).toBeNull();

    root.querySelector<HTMLButtonElement>(`button[aria-label="${LAYOUT_TEXTS.toggleNavAriaLabel}"]`)?.click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(document.body.querySelectorAll('.p-drawer nav li[role="menuitem"]').length).toBe(3);
  });

  it('ElControlAlternaElAsideEnAnchoAmplio', async () => {
    const { harness, root, q } = await render();
    const toggle = () => root.querySelector<HTMLButtonElement>(`button[aria-label="${LAYOUT_TEXTS.toggleNavAriaLabel}"]`)?.click();

    toggle();
    harness.detectChanges();
    expect(q('aside')).toBeNull();

    toggle();
    harness.detectChanges();
    expect(q('aside')).not.toBeNull();
  });

  it('AlCruzarElUmbral_NavOpenSeReiniciaAIsWide', async () => {
    const { harness, root, q } = await render();
    root.querySelector<HTMLButtonElement>(`button[aria-label="${LAYOUT_TEXTS.toggleNavAriaLabel}"]`)?.click();
    harness.detectChanges();
    expect(q('aside')).toBeNull();

    isWide.set(false);
    harness.detectChanges();
    isWide.set(true);
    harness.detectChanges();

    expect(q('aside')).not.toBeNull();
  });

  it('ElContenidoUsaLasMedidasUniformesUnaSolaVez', async () => {
    const { root } = await render();

    const contenedor = root.querySelector('main');
    expect(contenedor?.className.trim().split(/\s+/).sort()).toEqual(['max-w-7xl', 'mx-auto', 'p-6']);
    expect(root.querySelectorAll('.max-w-7xl').length).toBe(1);
    expect(contenedor?.querySelector('router-outlet')).not.toBeNull();
  });

  // HU-036 — superficies del shell con tokens semánticos y variante `dark:`.
  describe('superficies del tema (HU-036)', () => {
    const clases = (el: Element | null) => (el?.className ?? '').trim().split(/\s+/);

    it('LaRaizPintaFondoDePaginaYTextoConTokens', async () => {
      const { root } = await render();

      const raiz = root.querySelector('div.min-h-screen');
      expect(clases(raiz)).toEqual(
        expect.arrayContaining(['bg-surface-50', 'dark:bg-surface-900', 'text-color']),
      );
    });

    it('ElPieYElAsideUsanSuperficieDeTarjetaYBorde', async () => {
      const { q } = await render();

      expect(clases(q('footer'))).toEqual(
        expect.arrayContaining(['p-4', 'text-center', 'bg-surface-0', 'dark:bg-surface-800', 'border-t', 'border-surface-200', 'dark:border-surface-700', 'text-muted-color']),
      );
      expect(clases(q('aside'))).toEqual(
        expect.arrayContaining(['bg-surface-0', 'dark:bg-surface-800', 'border-surface-200', 'dark:border-surface-700']),
      );
    });

    it('SoloLaEntradaDelModuloActualLlevaElFondoActivo', async () => {
      const { root } = await render('/sprints');

      const activas = Array.from(root.querySelectorAll('nav li[role="menuitem"]')).filter((li) =>
        li.classList.contains('bg-surface-200'),
      );
      expect(activas.length).toBe(1);
      expect(activas[0].textContent).toContain(LAYOUT_TEXTS.nav.sprints);
      expect(clases(activas[0])).toEqual(expect.arrayContaining(['font-semibold', 'dark:bg-surface-700']));
    });
  });

  // HU-036 — conmutador claro/oscuro en la barra superior.
  describe('conmutador de tema (HU-036)', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.classList.remove('app-dark');
    });

    const boton = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>(
        `header button[aria-label="${LAYOUT_TEXTS.theme.toDark}"], header button[aria-label="${LAYOUT_TEXTS.theme.toLight}"]`,
      );

    it('MuestraLunaConEtiquetaAModoOscuroEnModoClaroSinAriaPressed', async () => {
      const { root } = await render();

      const b = boton(root);
      expect(b?.getAttribute('aria-label')).toBe(LAYOUT_TEXTS.theme.toDark);
      expect(b?.querySelector('.pi-moon')).not.toBeNull();
      expect(b?.hasAttribute('aria-pressed')).toBe(false);
    });

    it('SeUbicaAntesDelBloqueDePerfil', async () => {
      const { root } = await render();

      const b = boton(root) as HTMLElement;
      const perfil = root.querySelector('header .pi-user') as HTMLElement;
      expect(b.compareDocumentPosition(perfil) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('LaRegionDeEstadoIniciaVaciaYAnunciaSoloTrasActivar', async () => {
      const { harness, root } = await render();
      const region = root.querySelector<HTMLElement>('[role="status"].sr-only');
      expect(region?.textContent?.trim()).toBe('');

      boton(root)?.click();
      harness.detectChanges();

      expect(region?.textContent).toContain(LAYOUT_TEXTS.theme.announcedDark);
      expect(boton(root)?.getAttribute('aria-label')).toBe(LAYOUT_TEXTS.theme.toLight);
      expect(boton(root)?.querySelector('.pi-sun')).not.toBeNull();
      expect(document.documentElement.classList.contains('app-dark')).toBe(true);

      boton(root)?.click();
      harness.detectChanges();

      expect(region?.textContent).toContain(LAYOUT_TEXTS.theme.announcedLight);
      expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    });

    it('ActivarloNoRemontaElOutletNiBorraLoEscrito', async () => {
      const { harness, root } = await render();
      const main = root.querySelector('main') as HTMLElement;
      const outlet = main.querySelector('router-outlet');
      const input = document.createElement('input');
      input.value = 'borrador';
      main.appendChild(input);

      boton(root)?.click();
      harness.detectChanges();

      expect(root.querySelector('main')).toBe(main);
      expect(main.querySelector('router-outlet')).toBe(outlet);
      expect(main.querySelector('input')?.value).toBe('borrador');
    });
  });
});
