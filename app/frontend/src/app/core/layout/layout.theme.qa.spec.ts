import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '../auth/auth.service';
import { THEME_STORAGE_KEY } from '../theme/theme.service';
import { LayoutComponent } from './layout.component';
import { LAYOUT_TEXTS } from './layout.texts';
import { ViewportService } from './viewport.service';

// QA-AUTO HU-036 — conmutador en el layout (US2 CA2-CA4, US3 CA3, FR-007, FR-008, FR-011).
describe('LayoutComponent conmutador de tema (QA adversarial)', () => {
  const isWide = signal(true);
  const root = document.documentElement;

  beforeEach(() => {
    isWide.set(true);
    localStorage.clear();
    root.classList.remove('app-dark');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: '', component: LayoutComponent, children: [{ path: '**', children: [] }] }]),
        { provide: AuthService, useValue: { userName: signal('Ana'), logout: jest.fn() } },
        { provide: ViewportService, useValue: { isWide: isWide.asReadonly() } },
      ],
    });
  });

  afterEach(() => jest.restoreAllMocks());

  async function render(url = '/sprints') {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    const boton = () =>
      el.querySelector<HTMLButtonElement>(
        `header button[aria-label="${LAYOUT_TEXTS.theme.toDark}"], header button[aria-label="${LAYOUT_TEXTS.theme.toLight}"]`,
      )!;
    return { harness, el, boton };
  }

  it('Conmutador_EnAnchoEstrecho_DebeSeguirPresenteEnLaBarraSuperior', async () => {
    // Arrange
    isWide.set(false);

    // Act
    const { boton } = await render();

    // Assert
    expect(boton()).not.toBeNull();
  });

  it('Conmutador_EnElDom_DebeSerBotonNativoAlcanzablePorTeclado', async () => {
    // Arrange / Act
    const { boton } = await render();

    // Assert
    expect(boton().tagName).toBe('BUTTON');
    expect(boton().disabled).toBe(false);
    expect(boton().tabIndex).toBeGreaterThanOrEqual(0);
    expect(boton().getAttribute('aria-label')?.trim()).not.toBe('');
  });

  it('Conmutador_AlActivarEnRutaProfunda_NoDebeCambiarLaUrl', async () => {
    // Arrange
    const { harness, boton } = await render('/equipos/roles?x=1');
    const url = TestBed.inject(Router).url;

    // Act
    boton().click();
    harness.detectChanges();

    // Assert
    expect(TestBed.inject(Router).url).toBe(url);
    expect(root.classList.contains('app-dark')).toBe(true);
  });

  it('Conmutador_ConAlmacenamientoBloqueado_NoDebeMostrarErrorYDebeSeguirFuncionando', async () => {
    // Arrange
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    const { harness, el, boton } = await render();

    // Act
    boton().click();
    harness.detectChanges();
    const oscuroTrasPrimerClic = root.classList.contains('app-dark');
    boton().click();
    harness.detectChanges();

    // Assert
    expect(oscuroTrasPrimerClic).toBe(true);
    expect(root.classList.contains('app-dark')).toBe(false);
    expect(el.querySelector('p-message')).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('Conmutador_TrasActivar_DebePersistirLaEleccionEnLaClaveDelContrato', async () => {
    // Arrange
    const { harness, boton } = await render();

    // Act
    boton().click();
    harness.detectChanges();

    // Assert
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it.each([
    ['/backlog/nuevo', LAYOUT_TEXTS.nav.backlog],
    ['/sprints', LAYOUT_TEXTS.nav.sprints],
    ['/equipos', LAYOUT_TEXTS.nav.equipos],
  ])('NavegacionActiva_En%s_DebeLlevarFondoDeCadaModo', async (url, etiqueta) => {
    // Arrange / Act
    const { el } = await render(url);
    const activas = Array.from(el.querySelectorAll('nav li[role="menuitem"]')).filter((li) => li.classList.contains('bg-surface-200'));

    // Assert
    expect(activas).toHaveLength(1);
    expect(activas[0].textContent).toContain(etiqueta);
    expect(activas[0].classList.contains('dark:bg-surface-700')).toBe(true);
  });

  it('NavegacionActiva_EnRutaDesconocida_NoDebeResaltarNingunaEntrada', async () => {
    // Arrange / Act
    const { el } = await render('/no-existe');

    // Assert
    expect(el.querySelectorAll('nav li.bg-surface-200')).toHaveLength(0);
  });
});
