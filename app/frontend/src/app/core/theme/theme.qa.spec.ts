import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { contrastRatio } from './contrast';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

// QA-AUTO HU-036 — casos adversariales independientes de las pruebas del desarrollador.
describe('ThemeService (QA adversarial)', () => {
  const root = document.documentElement;
  const originalMatchMedia = window.matchMedia;

  function sistema(oscuro: boolean) {
    let listener: ((e: MediaQueryListEvent) => void) | undefined;
    window.matchMedia = jest.fn().mockReturnValue({
      matches: oscuro,
      addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => (listener = l),
      removeEventListener: jest.fn(),
    });
    return { emit: (matches: boolean) => listener?.({ matches } as MediaQueryListEvent) };
  }

  const crear = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(ThemeService);
  };

  beforeEach(() => {
    localStorage.clear();
    root.classList.remove('app-dark');
    root.style.removeProperty('color-scheme');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  it.each(['Dark', 'LIGHT', ' dark', 'dark ', '', 'null', 'undefined', '{"mode":"dark"}', '1', 'oscuro'])(
    'Constructor_ConValorGuardado%j_DebeIgnorarloYSeguirAlSistema',
    (invalido) => {
      // Arrange
      localStorage.setItem(THEME_STORAGE_KEY, invalido);
      sistema(false);

      // Act
      const servicio = crear();

      // Assert
      expect(servicio.mode()).toBe('light');
      expect(root.classList.contains('app-dark')).toBe(false);
    },
  );

  it('Toggle_DosVecesSeguidas_DebeRestaurarModoYPersistirElUltimo', () => {
    // Arrange
    sistema(true);
    const servicio = crear();

    // Act
    servicio.toggle();
    servicio.toggle();

    // Assert
    expect(servicio.mode()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('Toggle_TrasRecarga_DebeConservarLaEleccionAunqueElSistemaDiscrepe', () => {
    // Arrange
    sistema(false);
    crear().toggle(); // elige oscuro
    root.classList.remove('app-dark');

    // Act: "recarga" = nueva instancia con el sistema aún claro
    const recargado = crear();

    // Assert
    expect(recargado.mode()).toBe('dark');
    expect(root.classList.contains('app-dark')).toBe(true);
  });

  it('Toggle_ConEleccionPersistidaYCambioDeSistema_NoDebeSeguirAlSistema', () => {
    // Arrange
    const sys = sistema(false);
    const servicio = crear();
    servicio.toggle(); // oscuro manual

    // Act
    sys.emit(false);
    sys.emit(true);
    sys.emit(false);

    // Assert
    expect(servicio.mode()).toBe('dark');
    expect(root.classList.contains('app-dark')).toBe(true);
  });

  it('SistemaCambia_SinEleccion_DebeAplicarAlDomEnElMismoTurno', () => {
    // Arrange
    const sys = sistema(false);
    const servicio = crear();

    // Act
    sys.emit(true);

    // Assert
    expect(servicio.mode()).toBe('dark');
    expect(root.classList.contains('app-dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
    sys.emit(false);
    expect(root.classList.contains('app-dark')).toBe(false);
  });

  it('Toggle_ConSetItemQueLanzaYSistemaOscuro_DebeCambiarAClaroYSeguirAlternando', () => {
    // Arrange
    sistema(true);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cuota', 'QuotaExceededError');
    });
    const servicio = crear();

    // Act / Assert
    expect(() => servicio.toggle()).not.toThrow();
    expect(servicio.mode()).toBe('light');
    expect(() => servicio.toggle()).not.toThrow();
    expect(servicio.mode()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('Toggle_ConAlmacenamientoBloqueado_NoDebeSeguirAlSistemaDespuesDeElegir', () => {
    // Arrange
    const sys = sistema(false);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    const servicio = crear();
    servicio.toggle(); // oscuro solo en memoria

    // Act
    sys.emit(false);

    // Assert
    expect(servicio.mode()).toBe('dark');
  });
});

// Contraste calculado desde los hex de la spec (E-01..E-09), sin pasar por el preset.
describe('Contraste (QA, valores de spec.md)', () => {
  it.each([
    ['E-01', '#ffffff', '#0092b8', 3.62],
    ['E-02', '#99a1af', '#ffffff', 2.6],
    ['E-03', '#ffffff', '#00b8db', 2.37],
    ['E-04', '#fb2c36', '#ffffff', 3.81],
    ['E-05', '#fb2c36', '#1e2939', 3.85],
    ['E-06', '#6a7282', '#e5e7eb', 3.91],
    ['E-07', '#99a1af', '#364153', 3.96],
    ['E-08', '#e5e7eb', '#ffffff', 1.24],
    ['E-09', '#364153', '#1e2939', 1.42],
  ])('%s: ratio medido coincide con el declarado', (_id, fg, bg, declarado) => {
    // Act
    const ratio = contrastRatio(fg, bg);

    // Assert
    expect(Math.round(ratio * 100) / 100).toBe(declarado);
  });

  it.each([
    ['principal/página claro', '#1e2939', '#f9fafb'],
    ['principal/tarjeta claro', '#1e2939', '#ffffff'],
    ['secundario/tarjeta claro', '#6a7282', '#ffffff'],
    ['enlace/tarjeta claro', '#007595', '#ffffff'],
    ['principal/página oscuro', '#e5e7eb', '#101828'],
    ['principal/tarjeta oscuro', '#e5e7eb', '#1e2939'],
    ['secundario/tarjeta oscuro', '#99a1af', '#1e2939'],
    ['enlace/tarjeta oscuro', '#00b8db', '#1e2939'],
    ['marcador/campo oscuro', '#99a1af', '#1e2939'],
  ])('%s: texto normal cumple 4.5:1', (_n, fg, bg) => {
    // Act / Assert
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('ContrastRatio_ConColorInvalido_DebeLanzar', () => {
    // Act / Assert
    expect(() => contrastRatio('rojo', '#ffffff')).toThrow();
    expect(() => contrastRatio('#fff', '#ffffff')).toThrow();
  });
});

// Gobernanza independiente del script lint:primeng: recorre el código real de src/ (FR-013, SC-005).
describe('Gobernanza del tema sobre el código real (QA)', () => {
  const SRC = join(process.cwd(), 'src');
  const TEMA = ['app', 'core', 'theme', 'app-theme.ts'].join('/');

  function archivos(dir: string): string[] {
    return readdirSync(dir).flatMap((nombre) => {
      const ruta = join(dir, nombre);
      return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
    });
  }

  const fuente = archivos(SRC)
    .filter((f) => /\.(ts|html|css|scss)$/.test(f) && !/\.spec\.ts$/.test(f))
    .map((f) => ({ ruta: relative(SRC, f).split(sep).join('/'), texto: readFileSync(f, 'utf8') }));

  const buscar = (re: RegExp, filtro: (ruta: string) => boolean = () => true): string[] =>
    fuente
      .filter((f) => filtro(f.ruta))
      .flatMap((f) =>
        f.texto
          .split(/\r?\n/)
          .map((linea, i) => (re.test(linea) ? `${f.ruta}:${i + 1}` : ''))
          .filter(Boolean),
      );

  it('CodigoFuente_FueraDeAppTheme_NoDebeTenerColoresHexLiterales', () => {
    // Act
    const hallazgos = buscar(/(?:^|[\s:('"`])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?!-)/, (r) => r !== TEMA && !r.endsWith('.html'));

    // Assert
    expect(hallazgos).toEqual([]);
  });

  it('CodigoFuente_NoDebeUsarFuncionesDeColor', () => {
    // Act
    const hallazgos = buscar(/\b(?:rgba?|hsla?|oklch|lab|lch)\(/, (r) => r !== TEMA);

    // Assert
    expect(hallazgos).toEqual([]);
  });

  it('Plantillas_NoDebenUsarClasesDePaletaNiEstilosDeColorEnLinea', () => {
    // Arrange
    const paleta = /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:red|green|blue|cyan|gray|slate|zinc|neutral|stone|amber|yellow|orange|emerald|teal|sky|indigo|violet|purple|pink|rose|white|black)(?:-\d{2,3})?\b/;
    const enLinea = /\bstyle\s*=\s*"[^"]*(?:color|background|border|box-shadow)|\[style\.(?:color|background|border|box-shadow)/i;

    // Act
    const hallazgos = [...buscar(paleta, (r) => r.endsWith('.html')), ...buscar(enLinea, (r) => r.endsWith('.html'))];

    // Assert
    expect(hallazgos).toEqual([]);
  });

  it('PaginasYFormularios_NoDebenUsarUtilidadesDeRadio', () => {
    // Act
    const hallazgos = buscar(/(?:class|styleClass|\[class\.)[^>]*(?<![\w[-])rounded(?:-[a-z0-9]+)?(?![\w-])/, (r) => r.endsWith('.html') && r.includes('/features/'));

    // Assert
    expect(hallazgos).toEqual([]);
  });

  it('Estilos_NoDebenUsarNgDeepNiImportant', () => {
    // Act
    const hallazgos = buscar(/::ng-deep|!important/, (r) => /\.(css|scss|ts)$/.test(r));

    // Assert
    expect(hallazgos).toEqual([]);
  });

  it('CodigoFuente_NoDebeIncorporarFuentesExternasNiCodigoDeLaPlantilla', () => {
    // Act
    const hallazgos = buscar(/fonts\.googleapis|fonts\.gstatic|@import\s+url\(|template-primeng/i);

    // Assert
    expect(hallazgos).toEqual([]);
  });
});
