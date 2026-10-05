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
});
